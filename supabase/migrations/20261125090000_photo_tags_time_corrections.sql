-- Etapa 2, punctele 9 și 10.
-- 9: etichete noi pentru poze: „ascuns” (lucrări care se acoperă) și „bon” (bonuri, chitanțe).
alter table public.photos drop constraint if exists photos_category_check;
alter table public.photos add constraint photos_category_check
  check (category in ('before','during','after','problem','material','document','depot_pickup','hidden','receipt'));

-- 10: corecții de pontaj cerute de tehnician, cu motiv; biroul aprobă sau respinge.
-- GPS-ul rămâne doar dovadă: nu blochează nimic, se afișează lângă cerere.
create table if not exists public.time_corrections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type text not null check (event_type in ('work_start','work_end')),
  entry_id uuid references public.time_entries(id) on delete set null,
  original_at timestamptz,
  requested_at timestamptz not null,
  reason text not null check (length(trim(reason)) between 5 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists time_corrections_org_status on public.time_corrections (organization_id, status, created_at desc);
create index if not exists time_corrections_profile on public.time_corrections (profile_id, created_at desc);

alter table public.time_corrections enable row level security;
revoke all on public.time_corrections from anon;

create policy time_corrections_select on public.time_corrections for select to authenticated
  using (organization_id = public.current_org_id() and (public.is_back_office() or profile_id = (select auth.uid())));
create policy time_corrections_insert on public.time_corrections for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and profile_id = (select auth.uid())
    and status = 'pending' and reviewed_by is null and reviewed_at is null
    and public.is_assigned_to_job(job_id)
    and (entry_id is null or exists (
      select 1 from public.time_entries t
      where t.id = entry_id and t.profile_id = (select auth.uid()) and t.job_id = time_corrections.job_id and t.event_type = time_corrections.event_type))
  );
-- Tehnicianul își poate retrage o cerere încă neaprobată.
create policy time_corrections_delete on public.time_corrections for delete to authenticated
  using (organization_id = public.current_org_id() and profile_id = (select auth.uid()) and status = 'pending');

-- Aprobarea scrie în pontaj (time_entries nu are drept de update pentru nimeni): o singură funcție,
-- doar pentru birou, care mută ora intrării existente sau o adaugă dacă lipsea.
create or replace function public.review_time_correction(p_id uuid, p_approve boolean, p_note text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.time_corrections%rowtype;
begin
  if not public.is_back_office() then
    raise exception 'Doar biroul poate aproba corecțiile de pontaj.';
  end if;
  select * into c from public.time_corrections where id = p_id and organization_id = public.current_org_id() for update;
  if not found then return 'not_found'; end if;
  if c.status <> 'pending' then return 'already_reviewed'; end if;

  if p_approve then
    if c.entry_id is not null and exists (select 1 from public.time_entries where id = c.entry_id) then
      update public.time_entries set occurred_at = c.requested_at where id = c.entry_id;
    else
      insert into public.time_entries (organization_id, job_id, profile_id, event_type, occurred_at)
      values (c.organization_id, c.job_id, c.profile_id, c.event_type, c.requested_at);
    end if;
  end if;

  update public.time_corrections
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_by = (select auth.uid()), reviewed_at = now(),
         review_note = nullif(left(trim(coalesce(p_note, '')), 300), '')
   where id = p_id;
  return case when p_approve then 'approved' else 'rejected' end;
end $$;

revoke all on function public.review_time_correction(uuid, boolean, text) from public, anon;
grant execute on function public.review_time_correction(uuid, boolean, text) to authenticated;
