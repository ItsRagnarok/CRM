-- Raportul de intervenție pentru client, pe linkul de status: /status/<token>/raport (PDF, fără cont).
--
-- public_job_report: datele raportului (aceleași ca în raportul din platformă), doar pentru o lucrare
--   finalizată cu link activ.
-- ef_client_package_file: semnătura clientului intră în pachetul pe care clientul îl poate citi pe link
--   (o lucrare finalizată, cu link activ), ca să apară în PDF.

create or replace function public.public_job_report(p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  l public.job_status_links%rowtype;
  j public.jobs%rowtype;
begin
  select * into l from public.job_status_links where token = p_token and revoked_at is null and expires_at > now();
  if not found then return null; end if;
  select * into j from public.jobs where id = l.job_id;
  if j.status <> 'finalizata' then return null; end if;
  return jsonb_build_object(
    'company', (select o.name from public.organizations o where o.id = l.organization_id),
    'number', j.display_number, 'title', j.title, 'status', j.status, 'job_type', j.job_type,
    'date', j.scheduled_date, 'description', j.description,
    'client', (select c.name from public.clients c where c.id = j.client_id),
    'address', coalesce((select x.address from public.locations x where x.id = j.location_id), (select c.address from public.clients c where c.id = j.client_id)),
    'team', (select t.name from public.teams t where t.id = j.team_id),
    'assignees', coalesce((select jsonb_agg(p.full_name order by p.full_name) from public.job_assignments a join public.profiles p on p.id = a.profile_id where a.job_id = j.id), '[]'::jsonb),
    'checklist', coalesce((
      select jsonb_agg(jsonb_build_object('label', i.label, 'is_checked', i.is_checked) order by i.sort_order, i.label)
      from public.job_checklists cl join public.job_checklist_items i on i.job_checklist_id = cl.id
      where cl.job_id = j.id and cl.phase = 'after'), '[]'::jsonb),
    'expenses', coalesce((
      select jsonb_agg(jsonb_build_object('category', e.category, 'vendor', e.vendor, 'amount', e.amount, 'currency', e.currency) order by e.created_at)
      from public.expenses e where e.job_id = j.id), '[]'::jsonb),
    'photo_count', (select count(*) from public.photos ph where ph.job_id = j.id),
    'signature', (select jsonb_build_object('name', s.signer_name, 'at', s.signed_at, 'path', s.storage_path)
                    from public.signatures s where s.job_id = j.id order by s.signed_at desc limit 1)
  );
end $$;
revoke all on function public.public_job_report(uuid) from public;
grant execute on function public.public_job_report(uuid) to anon, authenticated;

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
     where d.storage_path = p_path and d.client_visible)
  or exists (
    select 1 from public.signatures s
      join public.jobs j on j.id = s.job_id and j.status = 'finalizata'
      join public.job_status_links l on l.job_id = j.id and l.revoked_at is null and l.expires_at > now()
     where s.storage_path = p_path);
$$;
