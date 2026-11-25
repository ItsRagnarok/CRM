-- Etapa 3, punctul 16: registrul de scule, cu predare-primire și calibrare legată de Conformitate.
--
-- tools: fiecare sculă sau aparat cu serie, cod de inventar, valoare, cine o are (om și/sau mașină) și starea.
--   Aparatele de măsură au calibrarea în Conformitate (compliance_items, tip „device”), prin compliance_item_id.
-- tool_handovers: istoricul predărilor și returnărilor. Predarea o face biroul, tehnicianul confirmă primirea
--   în aplicație; returnarea o cere tehnicianul, biroul confirmă că a primit-o. Ambele cu starea sculei.
-- Funcțiile tool_* fac schimbările într-un singur pas și verifică cine are voie.

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  category text not null default 'scula' check (category in ('aparat', 'scula', 'scara', 'echipament', 'altele')),
  serial text check (serial is null or length(serial) <= 80),
  inventory_code text check (inventory_code is null or length(inventory_code) <= 40),
  value numeric check (value is null or value >= 0),
  needs_calibration boolean not null default false,
  compliance_item_id uuid references public.compliance_items(id) on delete set null,
  status text not null default 'disponibil' check (status in ('disponibil', 'predat', 'service', 'pierdut', 'casat')),
  condition text not null default 'buna' check (condition in ('buna', 'uzata', 'defecta')),
  holder_profile_id uuid references public.profiles(id) on delete set null,
  holder_vehicle_id uuid references public.vehicles(id) on delete set null,
  notes text check (notes is null or length(notes) <= 1000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists tools_org on public.tools (organization_id, status);
create index if not exists tools_holder on public.tools (holder_profile_id);

create table if not exists public.tool_handovers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  kind text not null check (kind in ('predare', 'returnare')),
  status text not null default 'asteapta' check (status in ('asteapta', 'confirmata', 'anulata')),
  from_profile_id uuid references public.profiles(id) on delete set null,
  to_profile_id uuid references public.profiles(id) on delete set null,
  to_vehicle_id uuid references public.vehicles(id) on delete set null,
  condition text not null default 'buna' check (condition in ('buna', 'uzata', 'defecta')),
  condition_confirmed text check (condition_confirmed is null or condition_confirmed in ('buna', 'uzata', 'defecta')),
  note text check (note is null or length(note) <= 500),
  confirm_note text check (confirm_note is null or length(confirm_note) <= 500),
  created_by uuid references public.profiles(id) on delete set null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tool_handovers_tool on public.tool_handovers (tool_id, created_at desc);
create index if not exists tool_handovers_pending on public.tool_handovers (organization_id, status) where status = 'asteapta';

alter table public.tools enable row level security;
alter table public.tool_handovers enable row level security;
revoke all on public.tools from anon;
revoke all on public.tool_handovers from anon;
create policy tools_select on public.tools for select to authenticated
  using (organization_id = public.current_org_id() and public.is_staff());
create policy tools_manage on public.tools for all to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office());
create policy tool_handovers_select on public.tool_handovers for select to authenticated
  using (organization_id = public.current_org_id() and public.is_staff());
-- Scrierile trec doar prin funcțiile de mai jos.

-- Calibrarea: data de expirare din Conformitate (null dacă aparatul nu are calibrare legată).
create or replace function public.tool_calibration_expires(p_tool uuid) returns date
language sql stable security definer set search_path = '' as $$
  select c.expires_on from public.tools t join public.compliance_items c on c.id = t.compliance_item_id
   where t.id = p_tool and t.organization_id = public.current_org_id();
$$;

-- Biroul predă scula unui om (și, opțional, mașinii lui). Aparat cu calibrarea expirată: refuzat, dacă nu se forțează.
create or replace function public.tool_handover(p_tool uuid, p_to uuid, p_vehicle uuid, p_condition text, p_note text, p_force boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  org uuid := public.current_org_id();
  t public.tools%rowtype;
  exp date;
  hid uuid;
begin
  if not public.is_back_office() then raise exception 'Doar biroul predă scule' using errcode = '42501'; end if;
  select * into t from public.tools where id = p_tool and organization_id = org for update;
  if not found then raise exception 'Sculă necunoscută' using errcode = '22023'; end if;
  if t.status in ('pierdut', 'casat') then raise exception 'Scula e scoasă din uz' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_to and organization_id = org and is_active) then raise exception 'Persoană necunoscută' using errcode = '22023'; end if;
  if p_vehicle is not null and not exists (select 1 from public.vehicles where id = p_vehicle and organization_id = org) then raise exception 'Mașină necunoscută' using errcode = '22023'; end if;
  if t.needs_calibration then
    exp := public.tool_calibration_expires(p_tool);
    if (exp is null or exp < (now() at time zone 'Europe/Bucharest')::date) and not coalesce(p_force, false) then
      raise exception 'calibrare_expirata' using errcode = 'P0001';
    end if;
  end if;
  update public.tool_handovers set status = 'anulata' where tool_id = p_tool and status = 'asteapta';
  insert into public.tool_handovers (organization_id, tool_id, kind, from_profile_id, to_profile_id, to_vehicle_id, condition, note, created_by)
  values (org, p_tool, 'predare', t.holder_profile_id, p_to, p_vehicle,
          case when p_condition in ('buna','uzata','defecta') then p_condition else t.condition end,
          nullif(left(trim(coalesce(p_note, '')), 500), ''), (select auth.uid()))
  returning id into hid;
  update public.tools set holder_profile_id = p_to, holder_vehicle_id = p_vehicle, status = 'predat',
         condition = case when p_condition in ('buna','uzata','defecta') then p_condition else condition end
   where id = p_tool;
  return hid;
end $$;

-- Tehnicianul confirmă că a primit scula, cu starea în care a găsit-o.
create or replace function public.tool_confirm(p_handover uuid, p_condition text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare h public.tool_handovers%rowtype;
begin
  select * into h from public.tool_handovers where id = p_handover and organization_id = public.current_org_id() for update;
  if not found or h.kind <> 'predare' or h.status <> 'asteapta' then raise exception 'Predare negăsită' using errcode = '22023'; end if;
  if h.to_profile_id is distinct from (select auth.uid()) then raise exception 'Doar cine primește confirmă' using errcode = '42501'; end if;
  update public.tool_handovers
     set status = 'confirmata', confirmed_by = (select auth.uid()), confirmed_at = now(),
         condition_confirmed = case when p_condition in ('buna','uzata','defecta') then p_condition else h.condition end,
         confirm_note = nullif(left(trim(coalesce(p_note, '')), 500), '')
   where id = p_handover;
  if p_condition in ('uzata','defecta') then update public.tools set condition = p_condition where id = h.tool_id; end if;
end $$;

-- Tehnicianul anunță că returnează scula; biroul confirmă când o primește.
create or replace function public.tool_return_request(p_tool uuid, p_condition text, p_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.tools%rowtype; hid uuid;
begin
  select * into t from public.tools where id = p_tool and organization_id = public.current_org_id() for update;
  if not found then raise exception 'Sculă necunoscută' using errcode = '22023'; end if;
  if t.holder_profile_id is distinct from (select auth.uid()) then raise exception 'Scula nu e la tine' using errcode = '42501'; end if;
  if exists (select 1 from public.tool_handovers where tool_id = p_tool and kind = 'returnare' and status = 'asteapta') then
    select id into hid from public.tool_handovers where tool_id = p_tool and kind = 'returnare' and status = 'asteapta' limit 1;
    return hid;
  end if;
  insert into public.tool_handovers (organization_id, tool_id, kind, from_profile_id, condition, note, created_by)
  values (t.organization_id, p_tool, 'returnare', t.holder_profile_id,
          case when p_condition in ('buna','uzata','defecta') then p_condition else t.condition end,
          nullif(left(trim(coalesce(p_note, '')), 500), ''), (select auth.uid()))
  returning id into hid;
  return hid;
end $$;

-- Biroul primește scula înapoi (cu sau fără cerere de returnare); defectă = intră în service.
create or replace function public.tool_receive(p_tool uuid, p_condition text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  t public.tools%rowtype;
  c text;
begin
  if not public.is_back_office() then raise exception 'Doar biroul primește scule' using errcode = '42501'; end if;
  select * into t from public.tools where id = p_tool and organization_id = public.current_org_id() for update;
  if not found then raise exception 'Sculă necunoscută' using errcode = '22023'; end if;
  c := case when p_condition in ('buna','uzata','defecta') then p_condition else t.condition end;
  update public.tool_handovers set status = 'anulata' where tool_id = p_tool and kind = 'predare' and status = 'asteapta';
  if exists (select 1 from public.tool_handovers where tool_id = p_tool and kind = 'returnare' and status = 'asteapta') then
    update public.tool_handovers
       set status = 'confirmata', confirmed_by = (select auth.uid()), confirmed_at = now(), condition_confirmed = c,
           confirm_note = nullif(left(trim(coalesce(p_note, '')), 500), '')
     where tool_id = p_tool and kind = 'returnare' and status = 'asteapta';
  elsif t.holder_profile_id is not null then
    insert into public.tool_handovers (organization_id, tool_id, kind, status, from_profile_id, condition, condition_confirmed, confirm_note, created_by, confirmed_by, confirmed_at)
    values (t.organization_id, p_tool, 'returnare', 'confirmata', t.holder_profile_id, c, c, nullif(left(trim(coalesce(p_note, '')), 500), ''), (select auth.uid()), (select auth.uid()), now());
  end if;
  update public.tools set holder_profile_id = null, holder_vehicle_id = null, condition = c,
         status = case when c = 'defecta' then 'service' else 'disponibil' end
   where id = p_tool;
end $$;

revoke all on function public.tool_calibration_expires(uuid) from public, anon;
revoke all on function public.tool_handover(uuid, uuid, uuid, text, text, boolean) from public, anon;
revoke all on function public.tool_confirm(uuid, text, text) from public, anon;
revoke all on function public.tool_return_request(uuid, text, text) from public, anon;
revoke all on function public.tool_receive(uuid, text, text) from public, anon;
grant execute on function public.tool_calibration_expires(uuid) to authenticated;
grant execute on function public.tool_handover(uuid, uuid, uuid, text, text, boolean) to authenticated;
grant execute on function public.tool_confirm(uuid, text, text) to authenticated;
grant execute on function public.tool_return_request(uuid, text, text) to authenticated;
grant execute on function public.tool_receive(uuid, text, text) to authenticated;
