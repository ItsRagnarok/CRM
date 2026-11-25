-- Etapa 4, punctul 18: canalul preferat și acordul pentru oferte, pe fiecare client.
--
-- Două lucruri diferite, ținute separat:
--  * mesajele despre lucrare (programare, „echipa e pe drum”, documente): pleacă pe canalul preferat
--    (clients.preferred_channel); nu sunt oferte, fac parte din serviciu;
--  * ofertele, promoțiile, noutățile: doar pe canalele pentru care clientul și-a dat acordul
--    (clients.marketing_channels). Gol = fără oferte.
-- Orice schimbare intră în client_consent_log (cine, când, de unde, ce), ca dovadă. Jurnalul nu se
-- modifică și nu se șterge din aplicație; scrierea se face doar prin funcțiile de mai jos.

alter table public.clients add column if not exists preferred_channel text
  check (preferred_channel is null or preferred_channel in ('telefon','sms','whatsapp','email'));
alter table public.clients add column if not exists marketing_channels text[] not null default '{}'
  check (marketing_channels <@ array['sms','whatsapp','email']::text[]);
alter table public.clients add column if not exists contact_prefs_updated_at timestamptz;

create table if not exists public.client_consent_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  preferred_channel text,
  marketing_channels text[] not null default '{}',
  prev_channel text,
  prev_marketing text[] not null default '{}',
  source text not null check (source in ('birou_telefon','birou_fata','birou_scris','formular_cerere','link_status')),
  note text check (note is null or length(note) <= 300),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists client_consent_log_client on public.client_consent_log (client_id, created_at desc);

alter table public.client_consent_log enable row level security;
revoke all on public.client_consent_log from anon;
create policy client_consent_log_select on public.client_consent_log for select to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()));

-- Normalizare comună: canalele de oferte valide, fără dubluri, în ordine fixă.
create or replace function public.ef_norm_marketing(p text[]) returns text[]
language sql immutable set search_path = '' as $$
  select coalesce(array_agg(c order by array_position(array['sms','whatsapp','email'], c)), '{}')
  from (select distinct c from unnest(coalesce(p, '{}')) c where c in ('sms','whatsapp','email')) x;
$$;

-- Scrie preferințele și jurnalul, doar dacă s-a schimbat ceva. Intern; apelat de funcțiile de mai jos.
create or replace function public.ef_write_contact_prefs(p_client uuid, p_channel text, p_marketing text[], p_source text, p_note text, p_by uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  c public.clients%rowtype;
  ch text := case when p_channel in ('telefon','sms','whatsapp','email') then p_channel end;
  mk text[] := public.ef_norm_marketing(p_marketing);
begin
  select * into c from public.clients where id = p_client for update;
  if not found then return false; end if;
  if c.preferred_channel is not distinct from ch and c.marketing_channels = mk then return false; end if;
  update public.clients set preferred_channel = ch, marketing_channels = mk, contact_prefs_updated_at = now() where id = c.id;
  insert into public.client_consent_log (organization_id, client_id, preferred_channel, marketing_channels, prev_channel, prev_marketing, source, note, recorded_by)
  values (c.organization_id, c.id, ch, mk, c.preferred_channel, c.marketing_channels, p_source, nullif(left(trim(coalesce(p_note, '')), 300), ''), p_by);
  return true;
end $$;
revoke all on function public.ef_write_contact_prefs(uuid, text, text[], text, text, uuid) from public, anon, authenticated;
revoke all on function public.ef_norm_marketing(text[]) from public, anon;
grant execute on function public.ef_norm_marketing(text[]) to authenticated;

-- Biroul: canalul și acordul, cu sursa (la telefon, față în față, în scris) și o notă.
create or replace function public.set_client_contact_prefs(p_client uuid, p_channel text, p_marketing text[], p_source text, p_note text)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_back_office() then raise exception 'Fără acces' using errcode = '42501'; end if;
  if not exists (select 1 from public.clients where id = p_client and organization_id = public.current_org_id()) then
    raise exception 'Client necunoscut' using errcode = '22023';
  end if;
  if p_source not in ('birou_telefon','birou_fata','birou_scris','formular_cerere') then raise exception 'Sursă invalidă' using errcode = '22023'; end if;
  return public.ef_write_contact_prefs(p_client, p_channel, p_marketing, p_source, p_note, (select auth.uid()));
end $$;
revoke all on function public.set_client_contact_prefs(uuid, text, text[], text, text) from public, anon;
grant execute on function public.set_client_contact_prefs(uuid, text, text[], text, text) to authenticated;

-- Clientul, de pe linkul de status: vede și schimbă singur cum e anunțat și dacă primește oferte.
create or replace function public.public_status_prefs(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('channel', c.preferred_channel, 'marketing', to_jsonb(c.marketing_channels),
                            'has_phone', c.phone is not null and c.phone <> '', 'has_email', c.email is not null and c.email <> '')
  from public.job_status_links l
  join public.jobs j on j.id = l.job_id
  join public.clients c on c.id = j.client_id
  where l.token = p_token and l.revoked_at is null and l.expires_at > now();
$$;
revoke all on function public.public_status_prefs(uuid) from public;
grant execute on function public.public_status_prefs(uuid) to anon, authenticated;

create or replace function public.set_status_prefs(p_token uuid, p_channel text, p_marketing text[]) returns text
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid;
begin
  select j.client_id into cid
  from public.job_status_links l join public.jobs j on j.id = l.job_id
  where l.token = p_token and l.revoked_at is null and l.expires_at > now();
  if cid is null then return 'not_found'; end if;
  if (select count(*) from public.client_consent_log where client_id = cid and source = 'link_status' and created_at > now() - interval '1 hour') >= 10 then
    return 'rate_limited';
  end if;
  perform public.ef_write_contact_prefs(cid, p_channel, p_marketing, 'link_status', null, null);
  return 'ok';
end $$;
revoke all on function public.set_status_prefs(uuid, text, text[]) from public;
grant execute on function public.set_status_prefs(uuid, text, text[]) to anon, authenticated;

-- Formularul public de cereri: clientul alege și el canalul și, dacă vrea, acordul pentru oferte.
-- Se aplică pe client când biroul transformă cererea în lucrare (cu sursa „formular_cerere”).
alter table public.service_requests add column if not exists preferred_channel text
  check (preferred_channel is null or preferred_channel in ('telefon','sms','whatsapp','email'));
alter table public.service_requests add column if not exists marketing_channels text[] not null default '{}'
  check (marketing_channels <@ array['sms','whatsapp','email']::text[]);

drop function if exists public.submit_service_request(uuid, text, text, text, text, text, text, date, text, text);
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
  p_ip_hash text,
  p_channel text default null,
  p_marketing text[] default '{}'
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

  insert into public.service_requests (organization_id, source, contact_name, phone, email, address, description, domain, preferred_date, preferred_window, ip_hash, preferred_channel, marketing_channels)
  values (
    org.id, 'site', nm, ph, em,
    nullif(left(trim(coalesce(p_address, '')), 300), ''),
    ds,
    case when p_domain in ('gaze','electric','fotovoltaic') then p_domain end,
    case when p_date between current_date and current_date + 365 then p_date end,
    case when p_window in ('dimineata','pranz','dupa_amiaza','oricand') then p_window end,
    left(p_ip_hash, 80),
    case when p_channel in ('telefon','sms','whatsapp','email') then p_channel end,
    public.ef_norm_marketing(p_marketing)
  ) returning id into rid;

  insert into public.notifications (organization_id, profile_id, type, title, body, link)
  select org.id, p.id, 'service_request', 'Cerere nouă de pe site', left(nm || ': ' || ds, 200), '/cereri'
  from public.profiles p
  where p.organization_id = org.id and p.role in ('admin','manager') and p.is_active;

  return 'ok';
end;
$$;
revoke all on function public.submit_service_request(uuid, text, text, text, text, text, text, date, text, text, text, text[]) from public;
grant execute on function public.submit_service_request(uuid, text, text, text, text, text, text, date, text, text, text, text[]) to anon, authenticated;
