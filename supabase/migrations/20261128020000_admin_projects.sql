-- Super Admin → Proiecte: clienții proprietarului platformei (site-uri, SEO, magazine online, ElectroField),
-- cu sarcini (termen, urgent, făcut) și un jurnal de notițe. Le vede și le modifică doar super adminul.
-- O sarcină poate fi și fără proiect („Diverse”).

create table if not exists public.admin_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  kind text not null default 'altul' check (kind in ('seo','site','magazin','electrofield','altul')),
  status text not null default 'activ' check (status in ('activ','asteptare','incheiat')),
  url text check (url is null or length(url) <= 300),
  contact_name text check (contact_name is null or length(contact_name) <= 120),
  phone text check (phone is null or length(phone) <= 40),
  email text check (email is null or length(email) <= 160),
  about text check (about is null or length(about) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.admin_projects(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 300),
  details text check (details is null or length(details) <= 2000),
  due_on date,
  urgent boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_tasks_open on public.admin_tasks (due_on nulls last, created_at) where done_at is null;
create index if not exists admin_tasks_project on public.admin_tasks (project_id, created_at desc);

create table if not exists public.admin_project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists admin_project_notes_project on public.admin_project_notes (project_id, created_at desc);

alter table public.admin_projects enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.admin_project_notes enable row level security;
revoke all on public.admin_projects, public.admin_tasks, public.admin_project_notes from anon;

create policy admin_projects_admin on public.admin_projects for all to authenticated
  using ((select public.ef_is_platform_admin())) with check ((select public.ef_is_platform_admin()));
create policy admin_tasks_admin on public.admin_tasks for all to authenticated
  using ((select public.ef_is_platform_admin())) with check ((select public.ef_is_platform_admin()));
create policy admin_project_notes_admin on public.admin_project_notes for all to authenticated
  using ((select public.ef_is_platform_admin())) with check ((select public.ef_is_platform_admin()));

create or replace function public.admin_projects_touch() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists admin_projects_touch on public.admin_projects;
create trigger admin_projects_touch before update on public.admin_projects for each row execute function public.admin_projects_touch();
