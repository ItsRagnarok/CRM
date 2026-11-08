-- Applied via MCP on 2026-11-08. Electric module: measurements per board/circuit, reports (buletine)
-- with an authorized signer, and hidden works to document before covering. The platform never judges a
-- measurement: the technician states the result.
create table if not exists public.electric_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 160),
  kind text not null default 'circuit' check (kind in ('tablou','circuit')),
  insulation_mohm numeric(10,2),
  loop_ohm numeric(10,3),
  continuity_ohm numeric(10,3),
  result text check (result in ('conform','neconform')),
  notes text check (notes is null or length(notes) <= 1000),
  measured_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists electric_measurements_job on public.electric_measurements (job_id);

create table if not exists public.electric_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  signer_profile_id uuid references public.profiles(id) on delete set null,
  signed_on date,
  created_at timestamptz not null default now()
);
create index if not exists electric_reports_job on public.electric_reports (job_id);

create table if not exists public.electric_hidden_works (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  description text not null check (length(trim(description)) between 1 and 300),
  documented boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists electric_hidden_works_job on public.electric_hidden_works (job_id);

alter table public.electric_measurements enable row level security;
alter table public.electric_reports enable row level security;
alter table public.electric_hidden_works enable row level security;
revoke all on public.electric_measurements, public.electric_reports, public.electric_hidden_works from anon;

do $$
declare t text;
begin
  foreach t in array array['electric_measurements','electric_reports','electric_hidden_works'] loop
    execute format($f$create policy %1$s_all on public.%1$s for all to authenticated
      using (organization_id = public.current_org_id() and public.is_back_office())
      with check (organization_id = public.current_org_id() and public.is_back_office()
        and exists (select 1 from public.jobs j where j.id = job_id and j.organization_id = public.current_org_id()))$f$, t);
  end loop;
end $$;
