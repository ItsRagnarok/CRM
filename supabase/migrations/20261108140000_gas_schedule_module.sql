-- Applied via MCP on 2026-11-08. Gas schedule: buildings and apartments with last
-- inspection/revision dates; intervals are per-company settings (to be confirmed with a lawyer).
alter table public.organizations
  add column if not exists gas_inspection_months int not null default 24 check (gas_inspection_months between 1 and 240),
  add column if not exists gas_revision_months int not null default 120 check (gas_revision_months between 1 and 360);

create table if not exists public.gas_buildings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 160),
  address text check (address is null or length(address) <= 300),
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists gas_buildings_org on public.gas_buildings (organization_id);

create table if not exists public.gas_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  building_id uuid not null references public.gas_buildings(id) on delete cascade,
  stair text not null default '' check (length(stair) <= 40),
  apartment text not null check (length(trim(apartment)) between 1 and 40),
  owner_name text check (owner_name is null or length(owner_name) <= 160),
  phone text check (phone is null or length(phone) <= 40),
  last_inspection_on date,
  last_revision_on date,
  contact_status text not null default 'neprogramat' check (contact_status in ('neprogramat','programat','nu_raspunde','refuz','efectuat')),
  scheduled_on date,
  notes text check (notes is null or length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (building_id, stair, apartment)
);
create index if not exists gas_units_org_building on public.gas_units (organization_id, building_id);

alter table public.gas_buildings enable row level security;
alter table public.gas_units enable row level security;
revoke all on public.gas_buildings, public.gas_units from anon;

create policy gas_buildings_all on public.gas_buildings for all to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.organization_id = public.current_org_id())));
create policy gas_units_all on public.gas_units for all to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and exists (select 1 from public.gas_buildings b where b.id = building_id and b.organization_id = public.current_org_id()));
