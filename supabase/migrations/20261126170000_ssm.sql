-- Etapa 4, punctul 19: SSM pe teren.
--
-- ssm_trainings: evidența instruirii pe fiecare om (introductiv-generală, la locul de muncă, periodică,
--   suplimentară), cu data următoarei instruiri; omul confirmă în aplicație că a fost instruit.
--   Evidența ajută la control, dar nu înlocuiește fișa individuală semnată cerută de HG 1425/2006
--   până nu se verifică art. 81¹ (instruire și semnare electronică).
-- jobs.at_height: lucrare la înălțime (acoperiș, schelă, scară). Biroul nu o poate aloca unui om fără
--   „apt pentru lucru la înălțime” valabil decât confirmând explicit (jobs.ssm_override, cu motiv).
-- ssm_checks: verificarea de siguranță făcută pe telefon înainte de „Pornește lucrul”.
-- ssm_incidents: accident, aproape-accident, incident periculos sau echipament defect, raportat din aplicație.

alter table public.jobs add column if not exists at_height boolean not null default false;
alter table public.jobs add column if not exists ssm_override jsonb;

create table if not exists public.ssm_trainings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  phase text not null check (phase in ('introductiv','loc_munca','periodic','suplimentar')),
  done_on date not null,
  next_due date,
  instructor text check (instructor is null or length(instructor) <= 120),
  topic text check (topic is null or length(topic) <= 300),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 5 and 960),
  confirmed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists ssm_trainings_profile on public.ssm_trainings (profile_id, done_on desc);
alter table public.ssm_trainings enable row level security;
revoke all on public.ssm_trainings from anon;
create policy ssm_trainings_select on public.ssm_trainings for select to authenticated
  using (organization_id = (select public.current_org_id()) and ((select public.is_back_office()) or profile_id = (select auth.uid())));
create policy ssm_trainings_insert on public.ssm_trainings for insert to authenticated
  with check (organization_id = (select public.current_org_id()) and (select public.is_back_office()) and confirmed_at is null);
create policy ssm_trainings_delete on public.ssm_trainings for delete to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()) and confirmed_at is null);

-- Omul confirmă că a fost instruit (o singură dată; după confirmare rândul nu mai poate fi șters).
create or replace function public.ssm_confirm_training(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.ssm_trainings set confirmed_at = now()
   where id = p_id and profile_id = (select auth.uid()) and organization_id = public.current_org_id() and confirmed_at is null;
  return found;
end $$;
revoke all on function public.ssm_confirm_training(uuid) from public, anon;
grant execute on function public.ssm_confirm_training(uuid) to authenticated;

create table if not exists public.ssm_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  template text not null check (template in ('electric','gaze','fotovoltaic','general')),
  items jsonb not null default '{}'::jsonb,
  all_ok boolean not null,
  note text check (note is null or length(note) <= 500),
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (job_id, profile_id, checked_at)
);
create index if not exists ssm_checks_org on public.ssm_checks (organization_id, checked_at desc);
alter table public.ssm_checks enable row level security;
revoke all on public.ssm_checks from anon;
create policy ssm_checks_select on public.ssm_checks for select to authenticated
  using (organization_id = (select public.current_org_id()) and ((select public.is_back_office()) or profile_id = (select auth.uid())));
create policy ssm_checks_insert on public.ssm_checks for insert to authenticated
  with check (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid())
              and ((select public.is_back_office()) or public.is_assigned_to_job(job_id)));

create table if not exists public.ssm_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reported_by uuid references public.profiles(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  kind text not null check (kind in ('accident','aproape','incident_periculos','echipament')),
  injured boolean not null default false,
  description text check (description is null or length(description) <= 1000),
  photo_path text,
  lat double precision,
  lng double precision,
  occurred_at timestamptz not null default now(),
  status text not null default 'nou' check (status in ('nou','cercetat','inchis')),
  measures text check (measures is null or length(measures) <= 1000),
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  client_op_id text,
  created_at timestamptz not null default now(),
  unique (reported_by, client_op_id)
);
create index if not exists ssm_incidents_org on public.ssm_incidents (organization_id, occurred_at desc);
alter table public.ssm_incidents enable row level security;
revoke all on public.ssm_incidents from anon;
create policy ssm_incidents_select on public.ssm_incidents for select to authenticated
  using (organization_id = (select public.current_org_id()) and ((select public.is_back_office()) or reported_by = (select auth.uid())));
create policy ssm_incidents_insert on public.ssm_incidents for insert to authenticated
  with check (organization_id = (select public.current_org_id()) and reported_by = (select auth.uid()) and status = 'nou' and closed_at is null);
create policy ssm_incidents_update on public.ssm_incidents for update to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()))
  with check (organization_id = (select public.current_org_id()) and (select public.is_back_office()));
