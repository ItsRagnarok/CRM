-- Etapa 2, punctele 5 și 6: gazele ajung pe telefonul tehnicianului.
-- Fișa de evidență (Ord. ANRE 179/2015, anexele 4 și 5), lista de pe bloc, documentele
-- apartamentului cu expirări, termenele de după fișă și registrul anual (anexa 6).

-- 1. O lucrare poate fi „pe bloc”: tehnicianul vede lista apartamentelor din scadențar.
alter table public.jobs add column if not exists gas_building_id uuid references public.gas_buildings(id) on delete set null;
create index if not exists jobs_gas_building on public.jobs (gas_building_id) where gas_building_id is not null;

-- 2. Documentele apartamentului, cu expirări (completate automat din fișă).
alter table public.gas_units
  add column if not exists chimney_doc_on date,
  add column if not exists iscir_doc_on date,
  add column if not exists hose_valid_until date,
  add column if not exists detector_valid_until date;

-- „sistat” = alimentarea a fost întreruptă la verificare; apartamentul nu e considerat „efectuat”.
alter table public.gas_units drop constraint if exists gas_units_contact_status_check;
alter table public.gas_units add constraint gas_units_contact_status_check
  check (contact_status in ('neprogramat','programat','nu_raspunde','refuz','efectuat','sistat'));

-- 3. Fișele de evidență.
create table if not exists public.gas_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  unit_id uuid references public.gas_units(id) on delete set null,
  kind text not null check (kind in ('verificare','revizie')),
  year int,
  number int,
  drawn_up_on date,
  data jsonb not null default '{}'::jsonb,
  conform boolean,
  gas_interrupted boolean not null default false,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  notice_due_on date,
  os_registered_on date,
  os_registration_no text check (os_registration_no is null or length(os_registration_no) <= 80),
  client_delivered_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pg_column_size(data) < 400000)
);
create unique index if not exists gas_records_job_unit on public.gas_records (job_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists gas_records_org_year on public.gas_records (organization_id, year, number);
create index if not exists gas_records_unit on public.gas_records (unit_id) where unit_id is not null;

-- 4. Încercările pe bloc fără fișă: absent, refuz, reprogramat.
create table if not exists public.gas_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  unit_id uuid not null references public.gas_units(id) on delete cascade,
  outcome text not null check (outcome in ('absent','refuz','reprogramat')),
  reschedule_on date,
  note text check (note is null or length(note) <= 300),
  op_id text,
  created_by uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now()
);
create index if not exists gas_visits_job on public.gas_visits (job_id, unit_id, occurred_at desc);
create unique index if not exists gas_visits_op on public.gas_visits (op_id) where op_id is not null;

alter table public.gas_records enable row level security;
alter table public.gas_visits enable row level security;
revoke all on public.gas_records, public.gas_visits from anon;

-- Tehnicianul vede și scrie doar pe lucrările lui; biroul vede tot.
create policy gas_records_select on public.gas_records for select to authenticated
  using (organization_id = public.current_org_id() and (public.is_back_office() or public.is_assigned_to_job(job_id)));
create policy gas_records_insert on public.gas_records for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_staff() and (public.is_back_office() or public.is_assigned_to_job(job_id))
    and exists (select 1 from public.jobs j where j.id = job_id and j.organization_id = public.current_org_id())
    and (unit_id is null or exists (
      select 1 from public.gas_units u join public.jobs j on j.gas_building_id = u.building_id
      where u.id = unit_id and j.id = job_id and u.organization_id = public.current_org_id())));
create policy gas_records_update on public.gas_records for update to authenticated
  using (organization_id = public.current_org_id() and public.is_staff() and (public.is_back_office() or public.is_assigned_to_job(job_id)))
  with check (organization_id = public.current_org_id());
create policy gas_records_delete on public.gas_records for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());

create policy gas_visits_select on public.gas_visits for select to authenticated
  using (organization_id = public.current_org_id() and (public.is_back_office() or public.is_assigned_to_job(job_id)));
create policy gas_visits_insert on public.gas_visits for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_staff() and (public.is_back_office() or public.is_assigned_to_job(job_id))
    and exists (
      select 1 from public.gas_units u join public.jobs j on j.gas_building_id = u.building_id
      where u.id = unit_id and j.id = job_id and u.organization_id = public.current_org_id()));

-- Tehnicianul vede blocul și apartamentele doar dacă are o lucrare pe acel bloc.
create policy gas_buildings_assigned_select on public.gas_buildings for select to authenticated
  using (organization_id = public.current_org_id() and exists (
    select 1 from public.jobs j where j.gas_building_id = gas_buildings.id and public.is_assigned_to_job(j.id)));
create policy gas_units_assigned_select on public.gas_units for select to authenticated
  using (organization_id = public.current_org_id() and exists (
    select 1 from public.jobs j where j.gas_building_id = gas_units.building_id and public.is_assigned_to_job(j.id)));

-- 5. Garda: înregistrarea la operator și predarea către client le face doar biroul;
--    o fișă încheiată nu mai poate fi modificată de pe telefon.
create or replace function public.gas_records_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_back_office() then
    if tg_op = 'UPDATE' and old.completed_at is not null then
      raise exception 'Fișa e deja încheiată. Pentru corecturi, cere biroului.';
    end if;
    if new.os_registered_on is not null or new.os_registration_no is not null or new.client_delivered_on is not null then
      raise exception 'Înregistrarea la operator o completează biroul.';
    end if;
  end if;
  -- Numărul fișei: următorul din anul întocmirii, la încheiere.
  if new.completed_at is not null and new.number is null then
    new.year := extract(year from coalesce(new.drawn_up_on, (new.completed_at at time zone 'Europe/Bucharest')::date))::int;
    perform pg_advisory_xact_lock(hashtext('gas_records_number_' || new.organization_id::text || new.year::text));
    select coalesce(max(number), 0) + 1 into new.number from public.gas_records
     where organization_id = new.organization_id and year = new.year;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists gas_records_guard on public.gas_records;
create trigger gas_records_guard before insert or update on public.gas_records
  for each row execute function public.gas_records_guard();

create or replace function public.gas_try_date(v text) returns date language plpgsql immutable set search_path = public as $$
begin
  if v is null or v !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  return v::date;
exception when others then return null;
end $$;

-- 6. Fișa încheiată actualizează scadențarul apartamentului (datele, documentele, starea).
--    Revizia ține locul verificării din acel an (art. 32), deci mută și data verificării.
create or replace function public.gas_records_apply_to_unit()
returns trigger language plpgsql security definer set search_path = public as $$
declare d jsonb := new.data;
begin
  if new.unit_id is null or new.completed_at is null or new.drawn_up_on is null then return new; end if;
  if tg_op = 'UPDATE' and old.completed_at is not null then return new; end if;
  update public.gas_units u set
    last_inspection_on = greatest(coalesce(u.last_inspection_on, new.drawn_up_on), new.drawn_up_on),
    last_revision_on = case when new.kind = 'revizie' then greatest(coalesce(u.last_revision_on, new.drawn_up_on), new.drawn_up_on) else u.last_revision_on end,
    chimney_doc_on = coalesce(public.gas_try_date(d->>'doc_cos_data'), u.chimney_doc_on),
    iscir_doc_on = coalesce(public.gas_try_date(d->>'doc_iscir_data'), u.iscir_doc_on),
    hose_valid_until = coalesce(public.gas_try_date(d->>'racord_valabil'), u.hose_valid_until),
    detector_valid_until = coalesce(public.gas_try_date(d->>'detector_valabil'), u.detector_valid_until),
    contact_status = case when new.gas_interrupted then 'sistat' else 'efectuat' end,
    scheduled_on = null
  where u.id = new.unit_id and u.organization_id = new.organization_id;
  return new;
end $$;

drop trigger if exists gas_records_apply on public.gas_records;
create trigger gas_records_apply after insert or update of completed_at on public.gas_records
  for each row execute function public.gas_records_apply_to_unit();

-- 7. O încercare fără fișă schimbă starea de contact a apartamentului (dacă nu e deja efectuat de această lucrare).
create or replace function public.gas_visits_apply_to_unit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.gas_records r where r.job_id = new.job_id and r.unit_id = new.unit_id and r.completed_at is not null) then
    return new;
  end if;
  update public.gas_units u set
    contact_status = case new.outcome when 'absent' then 'nu_raspunde' when 'refuz' then 'refuz' else 'programat' end,
    scheduled_on = case when new.outcome = 'reprogramat' then new.reschedule_on else null end
  where u.id = new.unit_id and u.organization_id = new.organization_id;
  return new;
end $$;
drop trigger if exists gas_visits_apply on public.gas_visits;
create trigger gas_visits_apply after insert on public.gas_visits
  for each row execute function public.gas_visits_apply_to_unit();

revoke all on function public.gas_records_guard() from public, anon, authenticated;
revoke all on function public.gas_records_apply_to_unit() from public, anon, authenticated;
revoke all on function public.gas_visits_apply_to_unit() from public, anon, authenticated;
