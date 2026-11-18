-- Platform-owned billing, separate from tenant invoices and billing_requests.
-- Oblio is the issuer: there is deliberately no local invoice number sequence.
begin;

create schema if not exists private;

create function private.billing_is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null
    and exists (select 1 from public.platform_admins where id = (select auth.uid()))
    and not (coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ? 'x-ef-preview-org');
$$;
revoke all on function private.billing_is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.billing_is_admin() to authenticated;

create table public.billing_company_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null check (length(trim(name)) > 0),
  cui text not null check (length(trim(cui)) > 0),
  registration_number text,
  address text not null,
  email text,
  phone text,
  vat_payer boolean not null default true,
  default_vat_rate numeric(5,2) not null default 21 check (default_vat_rate between 0 and 100),
  default_due_days integer not null default 7 check (default_due_days between 0 and 365),
  currency text not null default 'RON' check (currency = 'RON'),
  invoice_template jsonb not null default '{}' check (jsonb_typeof(invoice_template) = 'object'),
  accountant_email text,
  created_at timestamptz not null default now()
);

create table public.billing_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id smallint not null default 1 references public.billing_company_settings(id),
  bank_name text not null,
  iban text not null unique check (length(trim(iban)) > 0),
  currency text not null default 'RON' check (currency = 'RON'),
  is_default boolean not null default false
);
create unique index billing_one_default_bank on public.billing_bank_accounts(company_id) where is_default;

create table public.billing_clients (
  id uuid primary key default gen_random_uuid(),
  client_type text not null default 'company' check (client_type in ('company','person')),
  name text,
  cui text,
  registration_number text,
  address text,
  city text,
  county text,
  country text not null default 'Romania',
  vat_payer boolean not null default false,
  email text,
  phone text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  check (nullif(trim(name), '') is not null or nullif(trim(cui), '') is not null)
);
create unique index billing_clients_cui on public.billing_clients(upper(regexp_replace(cui, '\s', '', 'g'))) where cui is not null;

create table public.billing_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  unit text not null default 'buc',
  is_service boolean not null default true,
  unit_price numeric(18,4) not null default 0 check (unit_price >= 0 and unit_price < 1000000000000),
  vat_rate numeric(5,2) not null default 21 check (vat_rate between 0 and 100),
  archived boolean not null default false
);

create table public.billing_series (
  id uuid primary key default gen_random_uuid(),
  company_id smallint not null default 1 references public.billing_company_settings(id),
  name text not null check (length(trim(name)) > 0),
  document_type text not null check (document_type in ('invoice','proforma','credit_note')),
  active boolean not null default true,
  unique (company_id, name, document_type)
);
comment on table public.billing_series is 'Oblio series configuration only; Oblio assigns the final number at issuance.';

create table public.billing_oblio_connections (
  company_id smallint primary key default 1 references public.billing_company_settings(id),
  account_email text not null,
  verified_at timestamptz,
  enabled boolean not null default false
);
create table private.billing_oblio_credentials (
  company_id smallint primary key references public.billing_oblio_connections(company_id) on delete cascade,
  secret_id uuid not null unique references vault.secrets(id),
  created_at timestamptz not null default now()
);
alter table private.billing_oblio_credentials enable row level security;
revoke all on private.billing_oblio_credentials from public, anon, authenticated;
-- Credential RPCs will be added with Settings; no credential endpoint exists yet.

create table public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id smallint not null default 1 references public.billing_company_settings(id),
  client_id uuid not null references public.billing_clients(id),
  series_id uuid references public.billing_series(id),
  document_type text not null default 'invoice' check (document_type in ('invoice','proforma','credit_note')),
  original_invoice_id uuid references public.billing_invoices(id),
  status text not null default 'draft' check (status in ('draft','pending','issued')),
  issue_date date not null default current_date,
  due_date date not null default current_date,
  currency text not null default 'RON' check (currency = 'RON'),
  notes text,
  subtotal numeric(18,2) not null default 0,
  vat_total numeric(18,2) not null default 0,
  total numeric(18,2) generated always as (subtotal + vat_total) stored,
  company_snapshot jsonb,
  client_snapshot jsonb,
  provider_series text,
  provider_number text,
  provider_url text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  check (due_date >= issue_date),
  check ((document_type = 'credit_note') = (original_invoice_id is not null)),
  check (original_invoice_id is distinct from id),
  check ((status = 'issued') = (issued_at is not null)),
  check (status <> 'issued' or (nullif(trim(provider_series), '') is not null and nullif(trim(provider_number), '') is not null)),
  check (status = 'issued' or (provider_series is null and provider_number is null)),
  check (status = 'draft' or (company_snapshot is not null and client_snapshot is not null
    and jsonb_typeof(company_snapshot) = 'object' and jsonb_typeof(client_snapshot) = 'object')),
  unique (company_id, document_type, provider_series, provider_number)
);
create index billing_invoices_client on public.billing_invoices(client_id, issue_date desc);
create index billing_invoices_status_due on public.billing_invoices(status, due_date);
create index billing_invoices_issue_date on public.billing_invoices(issue_date);
create index billing_invoices_series on public.billing_invoices(series_id);
create index billing_invoices_original on public.billing_invoices(original_invoice_id) where original_invoice_id is not null;
-- A credit note is also a fiscal invoice; it cannot reuse an invoice's number.
create unique index billing_fiscal_provider_number on public.billing_invoices(company_id, provider_series, provider_number)
where document_type <> 'proforma';

create table public.billing_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  product_id uuid references public.billing_products(id),
  position integer not null check (position > 0),
  name text not null check (length(trim(name)) > 0),
  unit text not null default 'buc',
  is_service boolean not null default true,
  quantity numeric(18,4) not null check (quantity <> 0 and abs(quantity) < 1000000000),
  unit_price numeric(18,4) not null check (unit_price >= 0 and unit_price < 1000000000000),
  vat_rate numeric(5,2) not null default 21 check (vat_rate between 0 and 100),
  net_amount numeric(18,2) generated always as (round(quantity * unit_price, 2)) stored,
  vat_amount numeric(18,2) generated always as (round(round(quantity * unit_price, 2) * vat_rate / 100, 2)) stored,
  unique (invoice_id, position)
);
create index billing_lines_product on public.billing_invoice_lines(product_id) where product_id is not null;

-- One durable claim per document. No automatic reclaim after timeouts: reconcile
-- with Oblio first. These rows are writable only by future controlled RPCs.
create table public.billing_issue_requests (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references public.billing_invoices(id),
  status text not null default 'prepared' check (status in ('prepared','sending','unknown','rejected','confirmed')),
  request_payload jsonb not null check (jsonb_typeof(request_payload) = 'object'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  provider_reference jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.billing_issue_requests.request_payload is 'Frozen fiscal request only. Never store tokens, Client Secret or Authorization headers.';

-- Delivery / ANAF tracking is separate from the immutable fiscal document.
create table public.billing_invoice_delivery (
  invoice_id uuid primary key references public.billing_invoices(id),
  email_status text not null default 'not_sent' check (email_status in ('not_sent','sending','sent','failed','unknown')),
  email_sent_at timestamptz,
  e_invoice_status text not null default 'not_sent' check (e_invoice_status in ('not_sent','processing','validated','rejected')),
  pdf_storage_path text,
  updated_at timestamptz not null default now()
);

create table public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id),
  amount numeric(18,2) not null check (amount <> 0 and abs(amount) < 1000000000000),
  paid_on date not null,
  method text not null check (method in ('bank','cash','card','other')),
  source text not null default 'manual' check (source in ('manual','oblio')),
  external_reference text,
  reverses_payment_id uuid unique references public.billing_payments(id),
  notes text,
  created_at timestamptz not null default now(),
  unique (invoice_id, source, external_reference)
);
create index billing_payments_date on public.billing_payments(paid_on);

create function private.billing_guard_invoice()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op <> 'INSERT' and old.status = 'issued' then
    raise exception 'Factura emisă nu poate fi modificată sau ștearsă. Folosește o stornare.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'Factura este în curs de emitere.' using errcode = '23514'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'issued' then
    raise exception 'Cererea Oblio trebuie reconciliată înainte de modificare.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and old.status = 'pending' and
    (to_jsonb(new) - array['status','provider_series','provider_number','provider_url','issued_at','total'])
      is distinct from
    (to_jsonb(old) - array['status','provider_series','provider_number','provider_url','issued_at','total']) then
    raise exception 'Conținutul trimis către Oblio nu poate fi schimbat la confirmare.' using errcode = '23514';
  end if;
  if new.series_id is not null and not exists (
    select 1 from public.billing_series where id = new.series_id and company_id = new.company_id and document_type = new.document_type
  ) then raise exception 'Seria nu corespunde documentului.' using errcode = '23514'; end if;
  if new.original_invoice_id is not null and not exists (
    select 1 from public.billing_invoices where id = new.original_invoice_id and status = 'issued'
      and document_type = 'invoice' and company_id = new.company_id and client_id = new.client_id
  ) then raise exception 'Factura de stornat nu este validă.' using errcode = '23514'; end if;
  if new.status <> 'draft' and not exists (select 1 from public.billing_invoice_lines where invoice_id = new.id) then
    raise exception 'Factura nu are linii.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger billing_guard_invoice before insert or update or delete on public.billing_invoices
for each row execute function private.billing_guard_invoice();

create function private.billing_guard_line()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare doc public.billing_invoices;
begin
  if tg_op = 'UPDATE' and new.invoice_id <> old.invoice_id then
    raise exception 'Linia nu poate fi mutată pe altă factură.' using errcode = '23514';
  end if;
  select * into doc from public.billing_invoices where id = case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end for update;
  if not found then
    -- Cascading deletion of a draft after the parent was removed.
    if tg_op = 'DELETE' then return old; end if;
    raise exception 'Factura nu există.' using errcode = '23503';
  end if;
  if doc.status <> 'draft' then raise exception 'Liniile sunt blocate după începerea emiterii.' using errcode = '23514'; end if;
  if tg_op <> 'DELETE' and ((doc.document_type = 'credit_note' and new.quantity > 0) or (doc.document_type <> 'credit_note' and new.quantity < 0)) then
    raise exception 'Semnul cantității nu corespunde documentului.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger billing_guard_line before insert or update or delete on public.billing_invoice_lines
for each row execute function private.billing_guard_line();

-- Privileged only to update calculated columns, which have no client write grant.
-- No callable arguments; the parent lock is acquired by billing_guard_line.
create function private.billing_refresh_totals()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
begin
  update public.billing_invoices set
    subtotal = (select coalesce(sum(net_amount), 0) from public.billing_invoice_lines where invoice_id = target),
    vat_total = (select coalesce(sum(vat_amount), 0) from public.billing_invoice_lines where invoice_id = target)
    where id = target;
  return null;
end;
$$;
create trigger billing_refresh_totals after insert or update or delete on public.billing_invoice_lines
for each row execute function private.billing_refresh_totals();

create function private.billing_guard_payment()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare doc public.billing_invoices; original public.billing_payments;
begin
  if tg_op <> 'INSERT' then raise exception 'Încasările se corectează prin înregistrare inversă.' using errcode = '23514'; end if;
  select * into doc from public.billing_invoices where id = new.invoice_id for update;
  if not found or doc.status <> 'issued' or doc.document_type = 'proforma' then
    raise exception 'Plata necesită o factură emisă.' using errcode = '23514';
  end if;
  if new.reverses_payment_id is not null then
    select * into original from public.billing_payments where id = new.reverses_payment_id;
    if not found or original.invoice_id <> new.invoice_id or original.amount <> -new.amount or original.reverses_payment_id is not null then
      raise exception 'Înregistrarea inversă nu corespunde plății.' using errcode = '23514';
    end if;
  elsif (doc.document_type = 'credit_note') <> (new.amount < 0) then
    raise exception 'Semnul plății nu corespunde documentului.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger billing_guard_payment before insert or update or delete on public.billing_payments
for each row execute function private.billing_guard_payment();

revoke all on function private.billing_guard_invoice(), private.billing_guard_line(), private.billing_refresh_totals(), private.billing_guard_payment() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['billing_company_settings','billing_bank_accounts','billing_clients','billing_products',
    'billing_series','billing_oblio_connections','billing_invoices','billing_invoice_lines','billing_issue_requests',
    'billing_invoice_delivery','billing_payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy billing_admin_only on public.%I for all to authenticated using ((select private.billing_is_admin())) with check ((select private.billing_is_admin()))', t);
  end loop;
end;
$$;

grant insert, update, delete on public.billing_company_settings, public.billing_bank_accounts,
  public.billing_clients, public.billing_products, public.billing_series to authenticated;
-- Provider metadata, issuance states, snapshots and totals are never client writable.
grant insert (id, company_id, client_id, series_id, document_type, original_invoice_id, issue_date, due_date, currency, notes),
  update (client_id, series_id, issue_date, due_date, notes), delete on public.billing_invoices to authenticated;
grant insert (id, invoice_id, product_id, position, name, unit, is_service, quantity, unit_price, vat_rate),
  update (product_id, position, name, unit, is_service, quantity, unit_price, vat_rate), delete on public.billing_invoice_lines to authenticated;
grant insert (id, invoice_id, amount, paid_on, method, reverses_payment_id, notes) on public.billing_payments to authenticated;

commit;
