-- Leads: potențiali clienți urmăriți până devin clienți (sau se pierd).
-- Diferența față de service_requests: o cerere vine de la un client care vrea o lucrare acum;
-- un lead e o oportunitate de vânzare (ofertă, negociere, reapel) cu valoare estimată și dată de reluat.
-- Doar biroul le vede și le modifică.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stage text not null default 'nou' check (stage in ('nou','contactat','oferta','negociere','castigat','pierdut')),
  source text not null default 'altul' check (source in ('telefon','whatsapp','email','site','recomandare','facebook','teren','altul')),
  name text not null check (length(trim(name)) between 1 and 120),
  phone text check (phone is null or length(phone) <= 40),
  email text check (email is null or length(email) <= 160),
  address text check (address is null or length(address) <= 300),
  interest text not null check (length(trim(interest)) between 3 and 1000),
  domain text check (domain is null or domain in ('gaze','electric','fotovoltaic')),
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  next_follow_up date,
  note text check (note is null or length(note) <= 1000),
  lost_reason text check (lost_reason is null or length(lost_reason) <= 300),
  client_id uuid references public.clients(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_org_stage on public.leads (organization_id, stage, created_at desc);
create index if not exists leads_org_follow_up on public.leads (organization_id, next_follow_up) where next_follow_up is not null;

alter table public.leads enable row level security;
revoke all on public.leads from anon;

create policy leads_select on public.leads for select to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());
create policy leads_insert on public.leads for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_back_office() and created_by = (select auth.uid()));
create policy leads_update on public.leads for update to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office());
create policy leads_delete on public.leads for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());

create or replace function public.leads_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.leads_touch();
