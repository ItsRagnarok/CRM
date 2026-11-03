-- Rollback-only metadata policy test. No Storage API uploads or real files.
begin;
do $$
declare admin_uid uuid; tenant_uid uuid; org uuid; object_name text; denied boolean; n integer;
begin
  select id into admin_uid from public.platform_admins limit 1;
  select id into org from public.organizations limit 1;
  if admin_uid is null or org is null then raise exception 'Missing test identities'; end if;
  if not exists(select 1 from storage.buckets where id='platform-mail-uploads' and public=false and file_size_limit=15728640) then raise exception 'Unsafe upload bucket configuration'; end if;
  object_name := admin_uid::text || '/' || gen_random_uuid()::text;
  perform set_config('request.headers','{}',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_uid,'role','authenticated')::text,true);
  set local role authenticated;
  insert into storage.objects(bucket_id,name,owner_id,metadata) values('platform-mail-uploads',object_name,admin_uid::text,'{"size":1}');
  select count(*) into n from storage.objects where bucket_id='platform-mail-uploads' and name=object_name;
  if n<>1 then raise exception 'Admin could not read own upload'; end if;
  denied := false;
  begin insert into storage.objects(bucket_id,name) values('platform-mail-uploads',gen_random_uuid()::text || '/' || gen_random_uuid()::text); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Cross-owner upload allowed'; end if;
  reset role;
  for tenant_uid in select distinct on(role) id from public.profiles where id not in(select id from public.platform_admins) order by role loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',tenant_uid,'role','authenticated')::text,true);
    set local role authenticated;
    select count(*) into n from storage.objects where bucket_id='platform-mail-uploads';
    if n<>0 then raise exception 'Tenant read a mail upload'; end if;
    denied:=false;
    begin insert into storage.objects(bucket_id,name) values('platform-mail-uploads',tenant_uid::text || '/' || gen_random_uuid()::text); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'Tenant uploaded a mail file'; end if;
    begin
      delete from storage.objects where bucket_id='platform-mail-uploads' and name=object_name;
      get diagnostics n = row_count;
      if n<>0 then raise exception 'Tenant removed an admin upload'; end if;
    exception when insufficient_privilege then null; -- Storage also blocks direct SQL deletion; actual cleanup uses its API.
    end;
    reset role;
  end loop;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_uid,'role','authenticated')::text,true);
  perform set_config('request.headers',jsonb_build_object('x-ef-preview-org',org)::text,true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id='platform-mail-uploads' and name=object_name;
  if n<>0 then raise exception 'Preview read mail uploads'; end if;
  reset role;
  perform set_config('request.headers','{}',true);
  set local role anon;
  select count(*) into n from storage.objects where bucket_id='platform-mail-uploads';
  if n<>0 then raise exception 'Anonymous read mail uploads'; end if;
  reset role;
end;
$$;
rollback;
select 'Mail upload RLS checks passed: admin own uploads only, tenant and anonymous denial, preview denial; rolled back' as result;
