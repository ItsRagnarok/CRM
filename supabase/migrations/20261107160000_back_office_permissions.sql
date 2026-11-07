-- P0-2 + P1 (audit 2026-11-07). `is_staff()` = role <> 'client' dădea tehnicianului
-- drepturi de birou. Introducem `is_back_office()` (admin, manager) și îl folosim pe
-- scriere și pe datele sensibile (facturi, pontaje, GPS, cheltuieli, HR, ștergeri).
-- Aplicația mobilă scrie doar: jobs (alocate lui), time_entries, photos, signatures,
-- material_usage/stock, job_alerts, job_notes, time_off_requests, poziții, notificări.

create or replace function public.is_back_office()
returns boolean
language sql stable security definer
set search_path = public
as $$ select coalesce(public."current_role"() in ('admin','manager'), false) $$;

revoke all on function public.is_back_office() from public, anon;
grant execute on function public.is_back_office() to authenticated;

create or replace function public.is_assigned_to_job(p_job_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.job_assignments ja
    where ja.job_id = p_job_id and ja.profile_id = auth.uid()
  )
$$;

revoke all on function public.is_assigned_to_job(uuid) from public, anon;
grant execute on function public.is_assigned_to_job(uuid) to authenticated;

-- ===== Ștergeri / scrieri doar pentru back office =====
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients for insert
  with check (organization_id = current_org_id() and is_back_office());

drop policy if exists jobs_delete on public.jobs;
create policy jobs_delete on public.jobs for delete
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists jobs_write on public.jobs;
create policy jobs_write on public.jobs for insert
  with check (organization_id = current_org_id() and is_back_office());
-- Tehnicianul poate actualiza (status, etape) doar lucrările la care e alocat.
drop policy if exists jobs_update on public.jobs;
create policy jobs_update on public.jobs for update
  using (organization_id = current_org_id() and (is_back_office() or (is_staff() and is_assigned_to_job(id))))
  with check (organization_id = current_org_id());

drop policy if exists locations_delete on public.locations;
create policy locations_delete on public.locations for delete
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists locations_update on public.locations;
create policy locations_update on public.locations for update
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists locations_write on public.locations;
create policy locations_write on public.locations for insert
  with check (organization_id = current_org_id() and is_back_office());

drop policy if exists photos_delete on public.photos;
create policy photos_delete on public.photos for delete
  using (organization_id = current_org_id() and is_back_office());

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents for insert
  with check (
    organization_id = current_org_id()
    and (is_back_office() or (is_staff() and (profile_id = auth.uid() or (job_id is not null and is_assigned_to_job(job_id)))))
  );
-- Documentele HR (profile_id) le vede doar proprietarul și biroul.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select
  using (
    organization_id = current_org_id()
    and (
      is_back_office()
      or profile_id = auth.uid()
      or client_id = current_client_id()
      or (job_id is not null and (is_assigned_to_job(job_id)
          or exists (select 1 from public.jobs j where j.id = documents.job_id and j.client_id = current_client_id())))
    )
  );

-- Facturi: doar biroul (clientul își vede propriile facturi).
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select
  using (organization_id = current_org_id() and (is_back_office() or client_id = current_client_id()));
drop policy if exists invoices_update on public.invoices;
create policy invoices_update on public.invoices for update
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for insert
  with check (organization_id = current_org_id() and is_back_office());

-- Cheltuieli: tehnicianul vede/creează doar ale lui (sau pe lucrările lui).
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select
  using (
    organization_id = current_org_id()
    and (is_back_office() or submitted_by = auth.uid() or (job_id is not null and is_assigned_to_job(job_id)))
  );
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert
  with check (
    organization_id = current_org_id()
    and (is_back_office() or (is_staff() and submitted_by = auth.uid()))
  );
drop policy if exists expense_receipts_all on public.expense_receipts;
create policy expense_receipts_all on public.expense_receipts for all
  using (exists (select 1 from public.expenses e where e.id = expense_receipts.expense_id
                 and e.organization_id = current_org_id()
                 and (is_back_office() or e.submitted_by = auth.uid())))
  with check (exists (select 1 from public.expenses e where e.id = expense_receipts.expense_id
                 and e.organization_id = current_org_id()
                 and (is_back_office() or e.submitted_by = auth.uid())));

-- Pontaje, concedii, GPS: propriile date sau biroul.
drop policy if exists time_entries_select on public.time_entries;
create policy time_entries_select on public.time_entries for select
  using (
    organization_id = current_org_id()
    and (is_back_office() or profile_id = auth.uid() or (job_id is not null and is_assigned_to_job(job_id)))
  );
drop policy if exists time_off_requests_select on public.time_off_requests;
create policy time_off_requests_select on public.time_off_requests for select
  using (organization_id = current_org_id() and (is_back_office() or profile_id = auth.uid()));
drop policy if exists time_off_requests_insert on public.time_off_requests;
create policy time_off_requests_insert on public.time_off_requests for insert
  with check (organization_id = current_org_id() and (is_back_office() or (is_staff() and profile_id = auth.uid())));
drop policy if exists technician_positions_select on public.technician_positions;
create policy technician_positions_select on public.technician_positions for select
  using (organization_id = current_org_id() and (is_back_office() or profile_id = auth.uid()));
drop policy if exists technician_position_log_select on public.technician_position_log;
create policy technician_position_log_select on public.technician_position_log for select
  using (organization_id = current_org_id() and (is_back_office() or profile_id = auth.uid()));

-- Audit și alerte rezolvate: doar biroul.
drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select
  using (organization_id = current_org_id() and is_back_office());
drop policy if exists job_alerts_update on public.job_alerts;
create policy job_alerts_update on public.job_alerts for update
  using (organization_id = current_org_id() and is_back_office());

-- Administrarea echipelor, vehiculelor, depozitelor, materialelor, șabloanelor, alocărilor:
-- citire pentru tot personalul, scriere doar pentru birou.
do $$
declare
  t text;
begin
  foreach t in array array['teams','vehicles','warehouses','materials','checklist_templates'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('create policy %I on public.%I for select using (organization_id = current_org_id() and is_staff())', t || '_select', t);
    execute format('create policy %I on public.%I for all using (organization_id = current_org_id() and is_back_office()) with check (organization_id = current_org_id() and is_back_office())', t || '_manage', t);
  end loop;
end $$;

drop policy if exists team_members_all on public.team_members;
create policy team_members_select on public.team_members for select
  using (exists (select 1 from public.teams t where t.id = team_members.team_id and t.organization_id = current_org_id()) and is_staff());
create policy team_members_manage on public.team_members for all
  using (exists (select 1 from public.teams t where t.id = team_members.team_id and t.organization_id = current_org_id()) and is_back_office())
  with check (exists (select 1 from public.teams t where t.id = team_members.team_id and t.organization_id = current_org_id()) and is_back_office());

drop policy if exists job_assignments_all on public.job_assignments;
create policy job_assignments_select on public.job_assignments for select
  using (exists (select 1 from public.jobs j where j.id = job_assignments.job_id and j.organization_id = current_org_id()) and is_staff());
create policy job_assignments_manage on public.job_assignments for all
  using (exists (select 1 from public.jobs j where j.id = job_assignments.job_id and j.organization_id = current_org_id()) and is_back_office())
  with check (exists (select 1 from public.jobs j where j.id = job_assignments.job_id and j.organization_id = current_org_id()) and is_back_office());

drop policy if exists checklist_template_items_all on public.checklist_template_items;
create policy checklist_template_items_select on public.checklist_template_items for select
  using (exists (select 1 from public.checklist_templates t where t.id = checklist_template_items.template_id and t.organization_id = current_org_id()) and is_staff());
create policy checklist_template_items_manage on public.checklist_template_items for all
  using (exists (select 1 from public.checklist_templates t where t.id = checklist_template_items.template_id and t.organization_id = current_org_id()) and is_back_office())
  with check (exists (select 1 from public.checklist_templates t where t.id = checklist_template_items.template_id and t.organization_id = current_org_id()) and is_back_office());

drop policy if exists client_contacts_all on public.client_contacts;
create policy client_contacts_select on public.client_contacts for select
  using (exists (select 1 from public.clients c where c.id = client_contacts.client_id and c.organization_id = current_org_id()) and is_staff());
create policy client_contacts_manage on public.client_contacts for all
  using (exists (select 1 from public.clients c where c.id = client_contacts.client_id and c.organization_id = current_org_id()) and is_back_office())
  with check (exists (select 1 from public.clients c where c.id = client_contacts.client_id and c.organization_id = current_org_id()) and is_back_office());

-- ===== Auto-aprobare (P1-1) =====
create or replace function public.guard_expense_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_back_office() then
    return new;
  end if;
  if old.status is distinct from 'pending' then
    raise exception 'Cheltuiala nu mai poate fi modificată după decizie.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.rejection_reason is distinct from old.rejection_reason
     or new.submitted_by is distinct from old.submitted_by
     or new.organization_id is distinct from old.organization_id then
    raise exception 'Doar biroul poate aproba sau respinge cheltuieli.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists expenses_review_guard on public.expenses;
create trigger expenses_review_guard before update on public.expenses
  for each row execute function public.guard_expense_review();

create or replace function public.guard_time_off_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_back_office() then
    return new;
  end if;
  if old.status is distinct from 'pending' then
    raise exception 'Cererea nu mai poate fi modificată după decizie.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status
     or new.decided_by is distinct from old.decided_by
     or new.decided_at is distinct from old.decided_at
     or new.profile_id is distinct from old.profile_id
     or new.organization_id is distinct from old.organization_id then
    raise exception 'Doar biroul poate aproba sau respinge concedii.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists time_off_review_guard on public.time_off_requests;
create trigger time_off_review_guard before update on public.time_off_requests
  for each row execute function public.guard_time_off_review();

-- ===== Numerotare facturi: doar pentru organizația apelantului (P1-2) =====
create or replace function public.next_invoice_number(p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number int;
begin
  if auth.uid() is not null and p_organization_id is distinct from public.current_org_id() then
    raise exception 'Organizație invalidă.' using errcode = '42501';
  end if;
  insert into invoice_counters (organization_id, next_number)
  values (p_organization_id, 2)
  on conflict (organization_id)
    do update set next_number = invoice_counters.next_number + 1
  returning next_number - 1 into v_number;
  return v_number;
end;
$$;
revoke all on function public.next_invoice_number(uuid) from public, anon;
grant execute on function public.next_invoice_number(uuid) to authenticated;

-- ===== Plan și activare: nu le schimbă adminul de tenant (P1-3) =====
create or replace function public.guard_org_platform_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Adminii de platformă nu au profil; doar utilizatorii de tenant sunt restricționați.
  if auth.uid() is null or public.current_org_id() is null then
    return new;
  end if;
  if new.subscription_plan is distinct from old.subscription_plan
     or new.is_active is distinct from old.is_active then
    raise exception 'Planul și starea contului se schimbă doar din platformă.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists organizations_platform_columns_guard on public.organizations;
create trigger organizations_platform_columns_guard before update on public.organizations
  for each row execute function public.guard_org_platform_columns();

-- ===== Storage `attachments` (P1-5) =====
-- Ștergere / modificare doar de către birou; documentele HR (…/employees/<profil>/…)
-- le citește doar proprietarul sau biroul.
drop policy if exists "org members can delete their files" on storage.objects;
create policy "back office can delete org files" on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select organization_id::text from public.profiles where id = auth.uid())
    and public.is_back_office()
  );
drop policy if exists "org members can update their files" on storage.objects;
create policy "back office can update org files" on storage.objects for update
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select organization_id::text from public.profiles where id = auth.uid())
    and public.is_back_office()
  );
drop policy if exists "org members can read their files" on storage.objects;
create policy "org members can read their files" on storage.objects for select
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select organization_id::text from public.profiles where id = auth.uid())
    and (
      (storage.foldername(name))[2] is distinct from 'employees'
      or public.is_back_office()
      or (storage.foldername(name))[3] = auth.uid()::text
    )
  );
