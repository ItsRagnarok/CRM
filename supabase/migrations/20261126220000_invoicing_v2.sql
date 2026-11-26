-- Facturare v2: facturi și proforme cu rânduri, TVA pe rând, încasări parțiale, anulare și storno.
-- Documentul fiscal rămâne la furnizor (SmartBill/Oblio); aici ținem copia lui, ca platforma să știe
-- ce e de încasat. Fără furnizor, documentele sunt doar evidență internă.

-- 1) Factura: tip, TVA, încasat, anulare, legătura storno/proformă, link-ul furnizorului
alter table public.invoices
  add column if not exists doc_type text not null default 'factura',
  add column if not exists vat_amount numeric(12,2) not null default 0,
  add column if not exists paid_amount numeric(12,2) not null default 0,
  add column if not exists cancelled_at timestamptz,
  add column if not exists reference_invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists provider_url text,
  add column if not exists mentions text,
  add column if not exists client_snapshot jsonb,
  add column if not exists emailed_at timestamptz;

alter table public.invoices drop constraint if exists invoices_doc_type_check;
alter table public.invoices add constraint invoices_doc_type_check check (doc_type in ('factura', 'proforma', 'storno'));
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (status in ('unpaid', 'paid', 'overdue', 'cancelled'));

-- Totalul de plată (cu TVA). total_amount rămâne valoarea fără TVA.
alter table public.invoices
  add column if not exists gross_amount numeric generated always as (labor_amount + materials_amount + travel_amount + other_amount + vat_amount) stored;

-- Facturile vechi marcate plătite au fost încasate integral.
update public.invoices set paid_amount = gross_amount where status = 'paid' and paid_amount = 0;

create index if not exists invoices_org_doc_idx on public.invoices (organization_id, doc_type, status);
create index if not exists invoices_reference_idx on public.invoices (reference_invoice_id);

-- 2) Rândurile documentului
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 300),
  unit text not null default 'buc' check (char_length(unit) between 1 and 20),
  quantity numeric(14,4) not null,
  unit_price numeric(14,4) not null,
  vat_percent numeric(5,2) not null default 0 check (vat_percent between 0 and 100),
  is_service boolean not null default true,
  code text,
  net_amount numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  line_vat numeric(14,2) generated always as (round(round(quantity * unit_price, 2) * vat_percent / 100, 2)) stored
);
create index if not exists invoice_lines_invoice_idx on public.invoice_lines (invoice_id, position);
alter table public.invoice_lines enable row level security;

drop policy if exists invoice_lines_select on public.invoice_lines;
create policy invoice_lines_select on public.invoice_lines for select to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()));
drop policy if exists invoice_lines_insert on public.invoice_lines;
create policy invoice_lines_insert on public.invoice_lines for insert to authenticated
  with check (
    organization_id = (select public.current_org_id()) and (select public.is_back_office())
    and exists (select 1 from public.invoices i where i.id = invoice_id and i.organization_id = (select public.current_org_id()))
  );

-- 3) Încasările (parțiale sau integrale)
create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount <> 0),
  method text not null check (method in ('numerar', 'card', 'ordin_plata', 'alta')),
  paid_on date not null,
  document text check (document is null or char_length(document) <= 60),
  source text not null default 'platforma' check (source in ('platforma', 'furnizor')),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id);
alter table public.invoice_payments enable row level security;

drop policy if exists invoice_payments_select on public.invoice_payments;
create policy invoice_payments_select on public.invoice_payments for select to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()));
drop policy if exists invoice_payments_insert on public.invoice_payments;
create policy invoice_payments_insert on public.invoice_payments for insert to authenticated
  with check (
    organization_id = (select public.current_org_id()) and (select public.is_back_office())
    and exists (select 1 from public.invoices i where i.id = invoice_id and i.organization_id = (select public.current_org_id()) and i.doc_type <> 'proforma')
  );
drop policy if exists invoice_payments_delete on public.invoice_payments;
create policy invoice_payments_delete on public.invoice_payments for delete to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()));

-- Suma încasată și starea facturii se țin singure din încasări.
create or replace function public.ef_invoice_paid_sync() returns trigger
language plpgsql security definer set search_path to '' as $$
declare
  inv uuid := coalesce(new.invoice_id, old.invoice_id);
  paid numeric;
begin
  select coalesce(sum(amount), 0) into paid from public.invoice_payments where invoice_id = inv;
  update public.invoices i
     set paid_amount = paid,
         status = case
           when i.status = 'cancelled' then 'cancelled'
           when abs(i.gross_amount) > 0 and abs(paid) >= abs(i.gross_amount) - 0.01 then 'paid'
           when i.status = 'paid' then 'unpaid'
           else i.status end
   where i.id = inv;
  return null;
end $$;
drop trigger if exists invoice_payments_sync on public.invoice_payments;
create trigger invoice_payments_sync after insert or delete on public.invoice_payments
  for each row execute function public.ef_invoice_paid_sync();

-- 4) Ce s-a emis nu se mai rescrie: sumele, clientul, numărul și rândurile rămân cum au fost emise.
--    Se pot schimba doar starea (încasare, anulare) și ce vine de la furnizor.
create or replace function public.ef_invoice_guard() returns trigger
language plpgsql set search_path to '' as $$
begin
  if new.labor_amount is distinct from old.labor_amount or new.materials_amount is distinct from old.materials_amount
     or new.travel_amount is distinct from old.travel_amount or new.other_amount is distinct from old.other_amount
     or new.vat_amount is distinct from old.vat_amount or new.client_id is distinct from old.client_id
     or new.invoice_number is distinct from old.invoice_number or new.doc_type is distinct from old.doc_type
     or new.provider_series is distinct from old.provider_series or new.provider_number is distinct from old.provider_number
     or new.organization_id is distinct from old.organization_id or new.issued_at is distinct from old.issued_at then
    raise exception 'Un document emis nu se mai modifică. Anulează-l sau emite o stornare.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists invoices_guard on public.invoices;
create trigger invoices_guard before update on public.invoices for each row execute function public.ef_invoice_guard();

-- 5) Conexiunea: seriile pentru proforme și chitanțe
alter table public.invoicing_connections
  add column if not exists proforma_series text,
  add column if not exists receipt_series text;

-- 6) Tarife pentru precompletarea facturii din lucrare (prețuri de vânzare, nu costuri)
alter table public.organizations
  add column if not exists invoice_labor_rate numeric(10,2) check (invoice_labor_rate is null or invoice_labor_rate >= 0),
  add column if not exists invoice_material_markup numeric(6,2) not null default 0 check (invoice_material_markup between 0 and 500);

-- 7) Numerotarea internă: doar biroul.
create or replace function public.next_invoice_number(p_organization_id uuid) returns integer
language plpgsql security definer set search_path to 'public' as $$
declare v_number int;
begin
  if auth.uid() is not null and (p_organization_id is distinct from public.current_org_id() or not public.is_back_office()) then
    raise exception 'Organizație invalidă.' using errcode = '42501';
  end if;
  insert into invoice_counters (organization_id, next_number) values (p_organization_id, 2)
  on conflict (organization_id) do update set next_number = invoice_counters.next_number + 1
  returning next_number - 1 into v_number;
  return v_number;
end $$;

-- 8) „Bani de recuperat”: totalul cu TVA, doar facturi (fără proforme), fără cele anulate;
--    o lucrare e facturată doar dacă are o factură (o proformă nu o scoate din „de facturat”).
create or replace function public.money_at_risk(p_today date)
returns table(unbilled_jobs bigint, unbilled_estimate numeric, overdue_count bigint, overdue_amount numeric, overdue_oldest_days integer, cash_open_count bigint, cash_open_amount numeric, pending_expenses_count bigint, pending_expenses_amount numeric)
language sql stable set search_path to 'public' as $$
  with org as (select public.current_org_id() as id),
  unbilled as (
    select j.id,
      coalesce(extract(epoch from (j.work_ended_at - j.work_started_at)) / 3600, 0)
        * coalesce((select sum(coalesce(p.hourly_rate, 0)) from public.job_assignments a join public.profiles p on p.id = a.profile_id where a.job_id = j.id), 0)
      + coalesce((select sum(mu.quantity * coalesce(m.unit_cost, 0)) from public.material_usage mu join public.materials m on m.id = mu.material_id where mu.job_id = j.id), 0) as est
    from public.jobs j, org
    where j.organization_id = org.id and j.status = 'finalizata'
      and not exists (select 1 from public.invoices i where i.job_id = j.id and i.doc_type = 'factura' and i.status <> 'cancelled')
  ),
  overdue as (
    select i.gross_amount - i.paid_amount as rest, (p_today - coalesce(i.due_date, i.issued_at)) as days
    from public.invoices i, org
    where i.organization_id = org.id and i.doc_type = 'factura' and i.status in ('unpaid', 'overdue')
      and coalesce(i.due_date, i.issued_at) < p_today
  )
  select (select count(*) from unbilled), coalesce((select sum(est) from unbilled), 0),
    (select count(*) from overdue), coalesce((select sum(rest) from overdue), 0), coalesce((select max(days) from overdue), 0)::integer,
    (select count(*) from public.billing_requests b, org where b.organization_id = org.id and b.status = 'new' and coalesce(b.collected_amount, 0) > 0),
    coalesce((select sum(b.collected_amount) from public.billing_requests b, org where b.organization_id = org.id and b.status = 'new'), 0),
    (select count(*) from public.expenses e, org where e.organization_id = org.id and e.status = 'pending'),
    coalesce((select sum(e.amount) from public.expenses e, org where e.organization_id = org.id and e.status = 'pending'), 0);
$$;
