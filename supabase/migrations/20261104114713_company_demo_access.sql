create table public.company_demos (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  duration_hours integer not null check (duration_hours in (12, 16, 24, 48)),
  expires_at timestamptz,
  converted_at timestamptz
);
alter table public.company_demos enable row level security;
revoke all on public.company_demos from public, anon, authenticated;
grant select on public.company_demos to authenticated;
create policy company_demos_platform_read on public.company_demos
  for select to authenticated using ((select public.ef_is_platform_admin()));

create function public.ef_demo_blocked() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p join public.company_demos d on d.organization_id = p.organization_id
    join public.organizations o on o.id = d.organization_id
    where p.id = (select auth.uid()) and d.converted_at is null
      and (not o.is_active or d.expires_at is null or d.expires_at <= statement_timestamp())
  )
$$;
revoke all on function public.ef_demo_blocked() from public;
grant execute on function public.ef_demo_blocked() to authenticated, anon;

create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select organization_id from public.profiles
  where id = (select auth.uid()) and not (select public.ef_demo_blocked())
$$;

create or replace function public.current_client_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select client_id from public.profiles
  where id = (select auth.uid()) and not (select public.ef_demo_blocked())
$$;

create policy company_demo_storage_guard on storage.objects
  as restrictive for all to authenticated
  using (not (select public.ef_demo_blocked())) with check (not (select public.ef_demo_blocked()));
create policy company_demo_notifications_guard on public.notifications
  as restrictive for all to authenticated
  using (not (select public.ef_demo_blocked())) with check (not (select public.ef_demo_blocked()));

-- These RPCs read profiles directly rather than using current_org_id.
do $$
declare fn record;
begin
  for fn in select oid, prosrc from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('company_admin_create_employee', 'company_admin_get_employee_email',
        'company_admin_reset_employee_password', 'company_admin_update_employee_email', 'next_invoice_number', 'ef_record_usage')
  loop
    if strpos(fn.prosrc, 'begin') = 0 then
      raise exception 'Could not add demo guard to function %', fn.oid::regprocedure;
    end if;
    execute replace(pg_get_functiondef(fn.oid), fn.prosrc,
      overlay(fn.prosrc placing E'begin\n  if public.ef_demo_blocked() then raise exception ''Demo access unavailable'' using errcode = ''42501''; end if;' from strpos(fn.prosrc, 'begin') for 5));
  end loop;
end $$;

create function public.platform_admin_create_demo_company(
  company_name text, company_cui text, owner_full_name text, owner_email text,
  owner_password text, demo_hours integer
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare new_org uuid;
begin
  if not public.ef_is_platform_admin() or public.ef_preview_org() is not null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if demo_hours is null or demo_hours not in (12, 16, 24, 48) then
    raise exception 'Invalid demo duration';
  end if;
  new_org := public.platform_admin_create_company(company_name, company_cui, owner_full_name, owner_email, owner_password);
  insert into public.company_demos (organization_id, duration_hours) values (new_org, demo_hours);
  return new_org;
end $$;

create function public.company_demo_session()
returns table (company_name text, is_admin boolean, state text, duration_hours integer)
language sql stable security definer set search_path = ''
as $$
  select o.name, p.role = 'admin',
    case when not o.is_active then 'suspended'
      when d.expires_at is null then 'pending'
      when d.expires_at <= statement_timestamp() then 'expired'
      else 'active' end, d.duration_hours
  from public.profiles p
  join public.organizations o on o.id = p.organization_id
  join public.company_demos d on d.organization_id = o.id
  where p.id = (select auth.uid()) and d.converted_at is null
$$;

create function public.company_demo_decide_terms(accept_terms boolean) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare demo_org uuid;
begin
  select o.id into demo_org from public.profiles p
  join public.organizations o on o.id = p.organization_id
  join public.company_demos d on d.organization_id = o.id
  where p.id = (select auth.uid()) and p.role = 'admin' and o.is_active
    and o.terms_accepted_at is null
  for update of o;
  if not found then return false; end if;
  perform 1 from public.company_demos where organization_id = demo_org
    and expires_at is null and converted_at is null for update;
  if not found then return false; end if;
  if accept_terms then
    update public.organizations set terms_accepted_at = statement_timestamp(), terms_declined_at = null where id = demo_org;
    update public.company_demos set expires_at = statement_timestamp() + make_interval(hours => duration_hours)
      where organization_id = demo_org;
  else
    update public.organizations set is_active = false, terms_declined_at = statement_timestamp() where id = demo_org;
  end if;
  return true;
end $$;

create function public.platform_admin_convert_demo(p_org_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.ef_is_platform_admin() or public.ef_preview_org() is not null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  -- Match the terms flow lock order: organization first, then demo.
  perform 1 from public.organizations where id = p_org_id for update;
  update public.company_demos set converted_at = statement_timestamp()
    where organization_id = p_org_id and converted_at is null;
  if not found then return false; end if;
  update public.organizations set is_active = true where id = p_org_id;
  return true;
end $$;

revoke all on function public.platform_admin_create_demo_company(text, text, text, text, text, integer),
  public.company_demo_session(), public.company_demo_decide_terms(boolean),
  public.platform_admin_convert_demo(uuid) from public, anon;
grant execute on function public.platform_admin_create_demo_company(text, text, text, text, text, integer),
  public.company_demo_session(), public.company_demo_decide_terms(boolean),
  public.platform_admin_convert_demo(uuid) to authenticated;
