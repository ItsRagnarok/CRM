-- Applied via MCP on 2026-11-08. Photovoltaic project files: stage, key dates, operator clocks.
-- The operator terms (ATR, connection certificate) are per-company settings because sources disagree.
alter table public.organizations
  add column if not exists pv_atr_days int not null default 15 check (pv_atr_days between 1 and 365),
  add column if not exists pv_cert_days int not null default 10 check (pv_cert_days between 1 and 365);

create table if not exists public.pv_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 160),
  address text check (address is null or length(address) <= 300),
  contact_name text check (contact_name is null or length(contact_name) <= 160),
  contact_phone text check (contact_phone is null or length(contact_phone) <= 40),
  kwp numeric(8,2) check (kwp is null or (kwp > 0 and kwp < 100000)),
  stage text not null default 'oferta' check (stage in ('oferta','contract','montaj','atr','punere_in_functiune','afm_garantie','finalizat','anulat')),
  operator_name text check (operator_name is null or length(operator_name) <= 160),
  atr_number text check (atr_number is null or length(atr_number) <= 80),
  offer_sent_on date,
  contract_signed_on date,
  advance_received_on date,
  install_on date,
  atr_filed_on date,
  atr_received_on date,
  cert_requested_on date,
  cert_received_on date,
  afm_filed_on date,
  afm_paid_on date,
  warranty_until date,
  notes text check (notes is null or length(notes) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists pv_projects_org_stage on public.pv_projects (organization_id, stage);
alter table public.pv_projects enable row level security;
revoke all on public.pv_projects from anon;
create policy pv_projects_all on public.pv_projects for all to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.organization_id = public.current_org_id())));
