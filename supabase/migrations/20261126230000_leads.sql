-- Leads pentru platformă: firmele de instalatori care ar putea folosi Electrofield.
-- Le vede și le modifică doar super adminul. Un lead trece prin etape până devine companie sau se pierde.
-- platform_lead_events: jurnalul unui lead (apeluri, e-mailuri, WhatsApp, notițe, schimbări de etapă).

create table if not exists public.platform_leads (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'nou' check (stage in ('nou','contactat','discutie','oferta','negociere','castigat','pierdut')),
  source text not null default 'altul' check (source in ('site','programari','facebook','recomandare','telefon','targ','altul')),
  company_name text not null check (length(trim(company_name)) between 1 and 160),
  contact_name text check (contact_name is null or length(contact_name) <= 120),
  phone text check (phone is null or length(phone) <= 40),
  email text check (email is null or length(email) <= 160),
  team_size integer check (team_size is null or team_size between 1 and 10000),
  domains text[] not null default '{}' check (domains <@ array['gaze','electric','fotovoltaic']::text[]),
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  next_follow_up date,
  current_tools text check (current_tools is null or length(current_tools) <= 1000),
  problems text check (problems is null or length(problems) <= 2000),
  lost_reason text check (lost_reason is null or length(lost_reason) <= 300),
  booking_id uuid references public.bookings(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists platform_leads_booking on public.platform_leads (booking_id) where booking_id is not null;
create index if not exists platform_leads_stage on public.platform_leads (stage, created_at desc);
create index if not exists platform_leads_follow_up on public.platform_leads (next_follow_up) where next_follow_up is not null;

create table if not exists public.platform_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.platform_leads(id) on delete cascade,
  kind text not null check (kind in ('apel','email','whatsapp','nota','discutie','etapa')),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists platform_lead_events_lead on public.platform_lead_events (lead_id, created_at desc);

alter table public.platform_leads enable row level security;
alter table public.platform_lead_events enable row level security;
revoke all on public.platform_leads from anon;
revoke all on public.platform_lead_events from anon;

create policy platform_leads_admin on public.platform_leads for all to authenticated
  using ((select public.ef_is_platform_admin()))
  with check ((select public.ef_is_platform_admin()));
create policy platform_lead_events_admin on public.platform_lead_events for all to authenticated
  using ((select public.ef_is_platform_admin()))
  with check ((select public.ef_is_platform_admin()));

create or replace function public.platform_leads_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists platform_leads_touch on public.platform_leads;
create trigger platform_leads_touch before update on public.platform_leads for each row execute function public.platform_leads_touch();
