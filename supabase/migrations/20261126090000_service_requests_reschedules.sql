-- Etapa 3, punctul 13: o singură listă „Cereri noi” și reprogramare cu motiv.
--
-- service_requests: tot ce cere un client înainte să devină lucrare. Biroul notează cererile venite
-- pe telefon, e-mail sau WhatsApp; clienții pot trimite singuri din formularul public al firmei
-- (/cerere/<token>), prin funcția submit_service_request, care limitează abuzul.
-- job_reschedules: istoricul mutărilor unei lucrări, cu motivul, ca să existe și mesajul pentru client.

alter table public.organizations add column if not exists request_token uuid not null default gen_random_uuid();
create unique index if not exists organizations_request_token on public.organizations (request_token);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null check (source in ('telefon','email','whatsapp','site','tehnician','altul')),
  status text not null default 'noua' check (status in ('noua','contactata','programata','respinsa')),
  client_id uuid references public.clients(id) on delete set null,
  contact_name text not null check (length(trim(contact_name)) between 1 and 120),
  phone text check (phone is null or length(phone) <= 40),
  email text check (email is null or length(email) <= 160),
  address text check (address is null or length(address) <= 300),
  description text not null check (length(trim(description)) between 3 and 2000),
  domain text check (domain is null or domain in ('gaze','electric','fotovoltaic')),
  preferred_date date,
  preferred_window text check (preferred_window is null or preferred_window in ('dimineata','pranz','dupa_amiaza','oricand')),
  urgent boolean not null default false,
  job_id uuid references public.jobs(id) on delete set null,
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  ip_hash text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists service_requests_org_status on public.service_requests (organization_id, status, created_at desc);
create index if not exists service_requests_ip on public.service_requests (ip_hash, created_at desc) where ip_hash is not null;

alter table public.service_requests enable row level security;
revoke all on public.service_requests from anon;

create policy service_requests_select on public.service_requests for select to authenticated
  using (organization_id = public.current_org_id() and (public.is_back_office() or created_by = (select auth.uid())));
-- Biroul notează orice cerere; tehnicianul doar cereri „de la client, pe teren”, pe numele lui.
create policy service_requests_insert on public.service_requests for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and created_by = (select auth.uid())
    and ip_hash is null
    and (public.is_back_office() or (source = 'tehnician' and status = 'noua' and job_id is null))
  );
create policy service_requests_update on public.service_requests for update to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office());
create policy service_requests_delete on public.service_requests for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());

create table if not exists public.job_reschedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  from_date date,
  from_start time,
  to_date date not null,
  to_start time,
  to_end time,
  reason text not null check (reason in ('client','vreme','material','echipa','urgenta','acces','altul')),
  note text check (note is null or length(note) <= 500),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists job_reschedules_job on public.job_reschedules (job_id, created_at desc);

alter table public.job_reschedules enable row level security;
revoke all on public.job_reschedules from anon;
create policy job_reschedules_select on public.job_reschedules for select to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());
create policy job_reschedules_insert on public.job_reschedules for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_back_office() and created_by = (select auth.uid()));

-- Formularul public: fără cont. Limite: 5 cereri pe oră de la aceeași adresă (păstrăm doar un hash),
-- 60 pe oră pe firmă. Biroul primește notificare în clopoțel.
create or replace function public.submit_service_request(
  p_token uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_description text,
  p_domain text,
  p_date date,
  p_window text,
  p_ip_hash text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  org public.organizations%rowtype;
  rid uuid;
  nm text := left(trim(coalesce(p_name, '')), 120);
  ph text := nullif(left(regexp_replace(coalesce(p_phone, ''), '[^0-9+ ()./-]', '', 'g'), 40), '');
  em text := nullif(left(lower(trim(coalesce(p_email, ''))), 160), '');
  ds text := left(trim(coalesce(p_description, '')), 2000);
begin
  select * into org from public.organizations where request_token = p_token and is_active;
  if not found then return 'not_found'; end if;
  if length(nm) < 1 or length(ds) < 3 then return 'invalid'; end if;
  if ph is null and em is null then return 'contact'; end if;
  if em is not null and em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'contact'; end if;
  if p_ip_hash is not null and (select count(*) from public.service_requests where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    return 'rate_limited';
  end if;
  if (select count(*) from public.service_requests where organization_id = org.id and source = 'site' and created_at > now() - interval '1 hour') >= 60 then
    return 'rate_limited';
  end if;

  insert into public.service_requests (organization_id, source, contact_name, phone, email, address, description, domain, preferred_date, preferred_window, ip_hash)
  values (
    org.id, 'site', nm, ph, em,
    nullif(left(trim(coalesce(p_address, '')), 300), ''),
    ds,
    case when p_domain in ('gaze','electric','fotovoltaic') then p_domain end,
    case when p_date between current_date and current_date + 365 then p_date end,
    case when p_window in ('dimineata','pranz','dupa_amiaza','oricand') then p_window end,
    left(p_ip_hash, 80)
  ) returning id into rid;

  insert into public.notifications (organization_id, profile_id, type, title, body, link)
  select org.id, p.id, 'service_request', 'Cerere nouă de pe site', left(nm || ': ' || ds, 200), '/cereri'
  from public.profiles p
  where p.organization_id = org.id and p.role in ('admin','manager') and p.is_active;

  return 'ok';
end;
$$;
revoke all on function public.submit_service_request(uuid, text, text, text, text, text, text, date, text, text) from public;
grant execute on function public.submit_service_request(uuid, text, text, text, text, text, text, date, text, text) to anon, authenticated;

-- Numele firmei pentru pagina publică (doar numele și domeniile, nimic altceva).
create or replace function public.public_request_org(p_token uuid)
returns table (name text, enabled_domains text[], phone text)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, o.enabled_domains, o.phone from public.organizations o where o.request_token = p_token and o.is_active;
$$;
revoke all on function public.public_request_org(uuid) from public;
grant execute on function public.public_request_org(uuid) to anon, authenticated;
