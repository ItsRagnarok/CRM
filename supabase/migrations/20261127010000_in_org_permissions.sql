-- Securitate în interiorul firmei (din auditul de securitate):
-- 1. Un tehnician nu își mai poate aproba singur o cheltuială sau un concediu la creare (INSERT).
-- 2. Pe o lucrare, tehnicianul alocat schimbă doar ce ține de munca pe teren: starea, etapa din
--    aplicație, orele de sosire / început / final, observațiile. Nu poate redeschide o lucrare
--    finalizată sau anulată.
-- 3. Tokenurile de notificări push: fiecare își vede și își modifică doar telefonul lui; trimiterea
--    către colegi și preluarea unui telefon de la alt coleg se fac prin funcții controlate.
-- 4. În folderul „employees/<persoană>/” urcă doar persoana respectivă sau biroul.
-- 5. Curățenie: funcțiile de probă rămase și vechea funcție publică de status (v1, nefolosită).

-- 1. ---------------------------------------------------------------------------------------------
create or replace function public.ef_force_pending_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_back_office() then
    return new;
  end if;
  new.status := 'pending';
  if tg_table_name = 'expenses' then
    new.approved_by := null;
    new.approved_at := null;
    new.rejection_reason := null;
  else
    new.decided_by := null;
    new.decided_at := null;
  end if;
  return new;
end $$;

drop trigger if exists expenses_insert_pending on public.expenses;
create trigger expenses_insert_pending before insert on public.expenses
  for each row execute function public.ef_force_pending_on_insert();

drop trigger if exists time_off_insert_pending on public.time_off_requests;
create trigger time_off_insert_pending before insert on public.time_off_requests
  for each row execute function public.ef_force_pending_on_insert();

-- 2. ---------------------------------------------------------------------------------------------
create or replace function public.ef_guard_job_field_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['status', 'mobile_stage', 'arrived_at', 'work_started_at', 'work_ended_at',
                          'observations', 'equipment_issue_note', 'updated_at'];
begin
  if auth.uid() is null or public.is_back_office() then
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Din aplicație se pot schimba doar starea lucrării și observațiile. Restul îl modifică biroul.'
      using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    if old.status in ('finalizata', 'anulata') then
      raise exception 'Lucrarea e închisă. O poate redeschide doar biroul.' using errcode = '42501';
    end if;
    if new.status not in ('in_drum', 'ajunsa', 'in_lucru', 'pauza', 'finalizata', 'necesita_atentie') then
      raise exception 'Starea aceasta o setează doar biroul.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists jobs_field_update_guard on public.jobs;
create trigger jobs_field_update_guard before update on public.jobs
  for each row execute function public.ef_guard_job_field_update();

-- 3. ---------------------------------------------------------------------------------------------
drop policy if exists device_push_tokens_select on public.device_push_tokens;
drop policy if exists device_push_tokens_insert on public.device_push_tokens;
drop policy if exists device_push_tokens_update on public.device_push_tokens;
drop policy if exists device_push_tokens_delete on public.device_push_tokens;

create policy device_push_tokens_select on public.device_push_tokens for select
  using (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()));
create policy device_push_tokens_insert on public.device_push_tokens for insert
  with check (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()));
create policy device_push_tokens_update on public.device_push_tokens for update
  using (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()))
  with check (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()));
create policy device_push_tokens_delete on public.device_push_tokens for delete
  using (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()));

-- Telefonul (tokenul) trece la cine e logat acum pe el, chiar dacă înainte era al altcuiva.
create or replace function public.ef_register_push_token(p_token text, p_platform text default 'android')
returns void language plpgsql security definer set search_path = public as $$
declare
  org uuid := public.current_org_id();
begin
  if auth.uid() is null or org is null or p_token is null or length(p_token) < 20 or length(p_token) > 4096 then
    return;
  end if;
  delete from public.device_push_tokens where token = p_token and profile_id is distinct from auth.uid();
  insert into public.device_push_tokens (organization_id, profile_id, platform, token, updated_at)
  values (org, auth.uid(), coalesce(nullif(p_platform, ''), 'android'), p_token, now())
  on conflict (token) do update
    set organization_id = excluded.organization_id, profile_id = excluded.profile_id,
        platform = excluded.platform, updated_at = now();
end $$;

-- Pentru trimitere: tokenurile colegilor din aceeași firmă (doar pe server, nu ajung în browser).
create or replace function public.ef_push_tokens_for(p_profile_ids uuid[])
returns table (token text) language sql stable security definer set search_path = public as $$
  select t.token from public.device_push_tokens t
  where t.organization_id = public.current_org_id() and t.profile_id = any (p_profile_ids)
$$;

-- Tokenurile expirate (raportate de Firebase) se șterg, tot doar în firma ta.
create or replace function public.ef_delete_push_tokens(p_tokens text[])
returns void language sql security definer set search_path = public as $$
  delete from public.device_push_tokens
  where organization_id = public.current_org_id() and token = any (p_tokens)
$$;

revoke all on function public.ef_register_push_token(text, text) from public, anon;
revoke all on function public.ef_push_tokens_for(uuid[]) from public, anon;
revoke all on function public.ef_delete_push_tokens(text[]) from public, anon;
grant execute on function public.ef_register_push_token(text, text) to authenticated;
grant execute on function public.ef_push_tokens_for(uuid[]) to authenticated;
grant execute on function public.ef_delete_push_tokens(text[]) to authenticated;

-- 4. ---------------------------------------------------------------------------------------------
drop policy if exists "org members can upload to their folder" on storage.objects;
create policy "org members can upload to their folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select profiles.organization_id::text from public.profiles where profiles.id = auth.uid())
    and (
      (storage.foldername(name))[2] is distinct from 'employees'
      or public.is_back_office()
      or (storage.foldername(name))[3] = auth.uid()::text
    )
  );

-- 5. ---------------------------------------------------------------------------------------------
drop function if exists public._ddl_probe_fn2();
drop function if exists public._ddl_probe_fn3(uuid);
drop table if exists public._ddl_probe;
revoke execute on function public.public_job_status(uuid) from public, anon, authenticated;
