-- Prospectare (Super Admin → Prospectare): campanii care descriu ce firme căutăm, firmele găsite de agent,
-- oamenii de contact și jurnalul rulărilor. Le vede și le modifică doar super adminul.
-- O firmă aprobată se mută în platform_leads („De contactat”); de acolo mesajele le scrie omul.

create table if not exists public.prospect_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  domain text not null default 'gaze' check (domain in ('gaze','electric','fotovoltaic','altul')),
  status text not null default 'pauza' check (status in ('activa','pauza')),
  offer text check (offer is null or length(offer) <= 1000),
  customer_problem text check (customer_problem is null or length(customer_problem) <= 1000),
  targeting text check (targeting is null or length(targeting) <= 2000),
  target_roles text check (target_roles is null or length(target_roles) <= 1000),
  example_clients text[] not null default '{}',
  positive_criteria text[] not null default '{}',
  negative_criteria text[] not null default '{}',
  keywords text[] not null default '{}',
  caen_codes text[] not null default '{}',
  counties text[] not null default '{}',
  min_employees integer check (min_employees is null or min_employees between 1 and 100000),
  max_employees integer check (max_employees is null or max_employees between 1 and 100000),
  min_turnover numeric(14,2) check (min_turnover is null or min_turnover >= 0),
  daily_target integer not null default 30 check (daily_target between 1 and 500),
  agent_notes text check (agent_notes is null or length(agent_notes) <= 4000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_companies (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.prospect_campaigns(id) on delete cascade,
  status text not null default 'candidat' check (status in ('candidat','aprobat','respins','importat')),
  name text not null check (length(trim(name)) between 1 and 200),
  cui text check (cui is null or cui ~ '^[0-9]{2,10}$'),
  website text check (website is null or length(website) <= 300),
  host text check (host is null or length(host) <= 200),
  description text check (description is null or length(description) <= 1500),
  county text, city text, address text, phone text,
  caen text, employees integer, turnover numeric(16,2), profit numeric(16,2), fin_year integer, reg_date date,
  fit_score integer check (fit_score is null or fit_score between 0 and 100),
  fit_reason text check (fit_reason is null or length(fit_reason) <= 1500),
  signals text[] not null default '{}',
  emails jsonb not null default '[]'::jsonb,
  mx boolean,
  source text not null default 'cautare' check (source in ('anre','cautare','onrc','manual','altul')),
  source_detail text check (source_detail is null or length(source_detail) <= 500),
  reject_reason text check (reject_reason is null or length(reject_reason) <= 300),
  lead_id uuid references public.platform_leads(id) on delete set null,
  run_id uuid,
  found_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index if not exists prospect_companies_cui on public.prospect_companies (campaign_id, cui) where cui is not null;
create unique index if not exists prospect_companies_host on public.prospect_companies (campaign_id, host) where host is not null;
create index if not exists prospect_companies_campaign on public.prospect_companies (campaign_id, status, fit_score desc);

create table if not exists public.prospect_people (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.prospect_companies(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  role text check (role is null or length(role) <= 160),
  email text check (email is null or length(email) <= 160),
  email_status text not null default 'lipsa' check (email_status in ('pe_site','ghicit','lipsa')),
  linkedin text check (linkedin is null or length(linkedin) <= 300),
  source_url text check (source_url is null or length(source_url) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists prospect_people_company on public.prospect_people (company_id);

create table if not exists public.prospect_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.prospect_campaigns(id) on delete cascade,
  status text not null default 'in_curs' check (status in ('in_curs','gata','eroare')),
  summary text check (summary is null or length(summary) <= 4000),
  stats jsonb not null default '{}'::jsonb,
  queries text[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists prospect_runs_campaign on public.prospect_runs (campaign_id, started_at desc);

alter table public.prospect_companies drop constraint if exists prospect_companies_run_fk;
alter table public.prospect_companies add constraint prospect_companies_run_fk foreign key (run_id) references public.prospect_runs(id) on delete set null;

do $$ declare t text; begin
  foreach t in array array['prospect_campaigns','prospect_companies','prospect_people','prospect_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.ef_is_platform_admin())) with check ((select public.ef_is_platform_admin()))', t || '_admin', t);
  end loop;
end $$;

create or replace function public.prospect_campaigns_touch() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists prospect_campaigns_touch on public.prospect_campaigns;
create trigger prospect_campaigns_touch before update on public.prospect_campaigns for each row execute function public.prospect_campaigns_touch();
