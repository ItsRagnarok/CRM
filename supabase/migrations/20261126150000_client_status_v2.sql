-- Etapa 4, punctul 17: ce vede clientul pe linkul de status.
--
-- organizations.arrival_window_minutes: fereastra de sosire arătată clientului (ex. „între 09:00 și 11:00”).
-- documents.client_visible: documentele lucrării alese de birou pentru pachetul clientului.
-- ensure_job_status_link: tehnicianul alocat (sau biroul) obține linkul lucrării, ca să-l trimită clientului.
-- public_job_status_v2: tot ce vede clientul, fără cont: fereastra, când a plecat echipa, cine vine
--   (prenume + inițială, rol, autorizații valabile), iar după închidere pozele înainte/după, documentele și semnătura.
-- Politica pe storage: pozele înainte/după și documentele pentru client ale unei lucrări finalizate, cu link activ,
--   pot fi citite (link semnat) și fără cont. Căile conțin id-ul firmei și al lucrării, deci nu se pot ghici.

alter table public.organizations add column if not exists arrival_window_minutes integer not null default 120
  check (arrival_window_minutes between 15 and 480);
alter table public.documents add column if not exists client_visible boolean not null default false;

create or replace function public.ensure_job_status_link(p_job uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  org uuid := public.current_org_id();
  tok uuid;
begin
  if not exists (select 1 from public.jobs where id = p_job and organization_id = org) then raise exception 'Lucrare necunoscută' using errcode = '22023'; end if;
  if not (public.is_back_office() or public.is_assigned_to_job(p_job)) then raise exception 'Fără acces' using errcode = '42501'; end if;
  select token into tok from public.job_status_links
   where job_id = p_job and organization_id = org and revoked_at is null and expires_at > now()
   order by created_at desc limit 1;
  if tok is null then
    insert into public.job_status_links (organization_id, job_id, created_by) values (org, p_job, (select auth.uid())) returning token into tok;
  end if;
  return tok;
end $$;
revoke all on function public.ensure_job_status_link(uuid) from public, anon;
grant execute on function public.ensure_job_status_link(uuid) to authenticated;

create or replace function public.public_job_status_v2(p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  l public.job_status_links%rowtype;
  j public.jobs%rowtype;
  o public.organizations%rowtype;
  done boolean;
begin
  select * into l from public.job_status_links where token = p_token and revoked_at is null and expires_at > now();
  if not found then return null; end if;
  select * into j from public.jobs where id = l.job_id;
  select * into o from public.organizations where id = l.organization_id;
  done := j.status = 'finalizata';
  return jsonb_build_object(
    'company', jsonb_build_object('name', o.name, 'phone', o.phone, 'email', o.email),
    'job', jsonb_build_object(
      'number', j.display_number, 'title', j.title, 'status', j.status,
      'date', j.scheduled_date, 'start', j.start_time, 'end', j.end_time,
      'window_minutes', o.arrival_window_minutes,
      'departed_at', (select max(h.created_at) from public.job_status_history h where h.job_id = j.id and h.status = 'in_drum'),
      'arrived_at', j.arrived_at, 'started_at', j.work_started_at, 'ended_at', j.work_ended_at),
    'team', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''),
        'role', p.role,
        'badges', coalesce((
          select jsonb_agg(distinct c.title) from public.compliance_items c
           where c.profile_id = p.id and c.kind = 'person' and c.expires_on >= coalesce(j.scheduled_date, current_date)
             and (j.domain is null or c.domain is null or c.domain = j.domain)), '[]'::jsonb)
      ) order by p.full_name)
      from public.job_assignments a join public.profiles p on p.id = a.profile_id
      where a.job_id = j.id and p.is_active), '[]'::jsonb),
    'team_name', (select t.name from public.teams t where t.id = j.team_id),
    'photos', case when done then coalesce((
      select jsonb_agg(jsonb_build_object('path', x.storage_path, 'category', x.category, 'taken_at', x.taken_at) order by x.category desc, x.taken_at)
      from (select storage_path, category, taken_at, row_number() over (partition by category order by taken_at) rn
              from public.photos where job_id = j.id and category in ('before', 'after')) x
      where x.rn <= 8), '[]'::jsonb) else '[]'::jsonb end,
    'documents', case when done then coalesce((
      select jsonb_agg(jsonb_build_object('name', d.name, 'path', d.storage_path, 'type', d.doc_type) order by d.created_at)
      from public.documents d where d.job_id = j.id and d.client_visible), '[]'::jsonb) else '[]'::jsonb end,
    'signature', case when done then (
      select jsonb_build_object('name', s.signer_name, 'at', s.signed_at) from public.signatures s where s.job_id = j.id order by s.signed_at desc limit 1) end
  );
end $$;
revoke all on function public.public_job_status_v2(uuid) from public;
grant execute on function public.public_job_status_v2(uuid) to anon, authenticated;

-- Fișierele din pachetul clientului: doar ale lucrărilor finalizate care au link de status activ.
create or replace function public.ef_client_package_file(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.photos ph
      join public.jobs j on j.id = ph.job_id and j.status = 'finalizata'
      join public.job_status_links l on l.job_id = j.id and l.revoked_at is null and l.expires_at > now()
     where ph.storage_path = p_path and ph.category in ('before', 'after'))
  or exists (
    select 1 from public.documents d
      join public.jobs j on j.id = d.job_id and j.status = 'finalizata'
      join public.job_status_links l on l.job_id = j.id and l.revoked_at is null and l.expires_at > now()
     where d.storage_path = p_path and d.client_visible);
$$;
revoke all on function public.ef_client_package_file(text) from public;
grant execute on function public.ef_client_package_file(text) to anon, authenticated;

drop policy if exists "client package read" on storage.objects;
create policy "client package read" on storage.objects for select to anon
  using (bucket_id = 'attachments' and public.ef_client_package_file(name));
