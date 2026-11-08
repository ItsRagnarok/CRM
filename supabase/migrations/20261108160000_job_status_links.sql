-- Applied via MCP on 2026-11-08. Customer-facing job status link (no account), by unguessable token.
create table if not exists public.job_status_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  revoked_at timestamptz
);
create index if not exists job_status_links_job on public.job_status_links (job_id);
alter table public.job_status_links enable row level security;
revoke all on public.job_status_links from anon;

create policy job_status_links_all on public.job_status_links for all to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and exists (select 1 from public.jobs j where j.id = job_id and j.organization_id = public.current_org_id()));

create or replace function public.public_job_status(p_token uuid)
returns table (
  company_name text, company_phone text, company_email text,
  job_number int, title text, status text,
  scheduled_date date, start_time time, work_started_at timestamptz, work_ended_at timestamptz
)
language sql
security definer
set search_path to 'public'
as $$
  select o.name, o.phone, o.email, j.display_number, j.title, j.status::text,
         j.scheduled_date, j.start_time, j.work_started_at, j.work_ended_at
  from public.job_status_links l
  join public.jobs j on j.id = l.job_id
  join public.organizations o on o.id = l.organization_id
  where l.token = p_token and l.revoked_at is null and l.expires_at > now()
  limit 1;
$$;
revoke all on function public.public_job_status(uuid) from public;
grant execute on function public.public_job_status(uuid) to anon, authenticated;
