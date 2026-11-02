-- Run with a database administrator. Uses existing identities and rolls back all test data.
begin;
select set_config('ef_test.admin', (select id::text from public.platform_admins limit 1), true);
select set_config('ef_test.org', (select id::text from public.organizations order by created_at limit 1), true);
select set_config('ef_test.employee', (select id::text from public.profiles where role='admin' limit 1), true);
select set_config('ef_test.employee_org', (select organization_id::text from public.profiles where id=current_setting('ef_test.employee')::uuid), true);
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('ef_test.admin'),'role','authenticated')::text, true);
select set_config('request.headers', jsonb_build_object('x-ef-preview-org',current_setting('ef_test.org'))::text, true);
set local role authenticated;
do $$ begin
  if public.ef_preview_org() is distinct from current_setting('ef_test.org')::uuid then raise exception 'Preview scope failed'; end if;
  if not exists(select 1 from public.profiles) then raise exception 'Preview cannot read selected company'; end if;
  if exists(select 1 from public.profiles where organization_id<>current_setting('ef_test.org')::uuid) then raise exception 'Preview escaped selected company'; end if;
  begin
    update public.jobs set title=title where false;
    raise exception 'Preview write was not rejected';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('ef_test.employee'),'role','authenticated')::text, true);
set local role authenticated;
do $$ begin
  if public.ef_preview_org() is not null then raise exception 'Tenant spoofed platform admin'; end if;
  if exists(select 1 from public.profiles where organization_id<>current_setting('ef_test.employee_org')::uuid) then raise exception 'Tenant read another company'; end if;
  if exists(select 1 from public.bookings) then raise exception 'Tenant read private bookings'; end if;
end $$;
reset role;
select set_config('request.headers','{}',true);
set local role authenticated;
select public.ef_record_usage('11111111-1111-4111-8111-111111111111','web',0,'/dashboard','start');
select public.ef_record_usage('11111111-1111-4111-8111-111111111111','web',35,'/dashboard','ping');
reset role;
do $$ begin
  if (select active_seconds from public.platform_usage_sessions where id='11111111-1111-4111-8111-111111111111')<>0 then raise exception 'Accepted inflated active time'; end if;
  if (select count(*) from public.platform_usage_sessions where id='11111111-1111-4111-8111-111111111111')<>1 then raise exception 'Duplicated visit'; end if;
end $$;
rollback;
