-- Rollback-only, no IMAP/SMTP connections, no email delivery, no real secrets output.
begin;
do $$
declare admin_uid uuid; tenant_uid uuid; mid uuid; sid uuid; delivery uuid := gen_random_uuid();
  listed jsonb; credentials jsonb; cfg jsonb; denied boolean; op text;
begin
  select id into admin_uid from public.platform_admins limit 1;
  select id into tenant_uid from public.profiles where id not in (select id from public.platform_admins) limit 1;
  if admin_uid is null or tenant_uid is null then raise exception 'Test needs existing admin and tenant identities'; end if;
  if has_function_privilege('anon','public.ef_platform_mail(text,uuid,jsonb)','execute') then raise exception 'Anonymous execution permitted'; end if;
  if has_table_privilege('authenticated','private.platform_mail_accounts','select') then raise exception 'Direct table read permitted'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_uid,'role','authenticated')::text,true);
  perform set_config('request.headers','{}',true);
  cfg := jsonb_build_object('name','Rollback Mail Test','address','rollback-mail-test@example.invalid','username','rollback-mail-test@example.invalid',
    'incomingHost','mail.example.invalid','incomingPort',993,'incomingSecurity','tls',
    'outgoingHost','mail.example.invalid','outgoingPort',465,'outgoingSecurity','tls','outgoingUsername','rollback-mail-test@example.invalid',
    'password','synthetic-mail-test-secret','outgoingPassword','synthetic-smtp-test-secret');
  set local role authenticated;
  mid := (public.ef_platform_mail('save',null,cfg)->>'id')::uuid;
  listed := public.ef_platform_mail('list');
  if listed::text like '%synthetic-%' or listed::text like '%secret_id%' or listed::text like '%Password%' then raise exception 'Credential leak in account list'; end if;
  credentials := public.ef_platform_mail('credentials',mid);
  if credentials->>'password' <> cfg->>'password' or credentials->>'outgoingPassword' <> cfg->>'outgoingPassword' then raise exception 'Vault roundtrip failed'; end if;
  perform public.ef_platform_mail('save',mid,cfg || '{"password":"updated-synthetic-secret"}'::jsonb);
  if public.ef_platform_mail('credentials',mid)->>'password' <> 'updated-synthetic-secret' then raise exception 'Vault update failed'; end if;
  if not (public.ef_platform_mail('claim_send',mid,jsonb_build_object('deliveryId',delivery,'fingerprint',repeat('a',64)))->>'claimed')::boolean then raise exception 'Initial delivery claim failed'; end if;
  if (public.ef_platform_mail('claim_send',mid,jsonb_build_object('deliveryId',delivery,'fingerprint',repeat('a',64)))->>'claimed')::boolean then raise exception 'Duplicate delivery claim allowed'; end if;
  perform public.ef_platform_mail('finish_send',mid,jsonb_build_object('deliveryId',delivery,'status','accepted'));
  if public.ef_platform_mail('claim_send',mid,jsonb_build_object('deliveryId',delivery,'fingerprint',repeat('a',64)))->>'status' <> 'accepted' then raise exception 'Accepted delivery not remembered'; end if;
  reset role;
  select secret_id into sid from private.platform_mail_accounts where id = mid;
  if exists(select 1 from vault.secrets where id=sid and secret like '%synthetic%') then raise exception 'Plaintext stored in Vault'; end if;
  for tenant_uid in select distinct on (role) id from public.profiles where id not in (select id from public.platform_admins) order by role loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',tenant_uid,'role','authenticated')::text,true);
    set local role authenticated;
    foreach op in array array['list','credentials','save','delete','check','claim_send','finish_send'] loop
      denied := false;
      begin perform public.ef_platform_mail(op,mid,cfg); exception when insufficient_privilege then denied := true; end;
      if not denied then raise exception 'Tenant permitted operation %',op; end if;
    end loop;
    reset role;
  end loop;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_uid,'role','authenticated')::text,true);
  perform set_config('request.headers','{"x-ef-preview-org":"preview"}',true);
  set local role authenticated;
  denied := false;
  begin perform public.ef_platform_mail('credentials',mid); exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'Preview permitted credential retrieval'; end if;
  reset role;
  perform set_config('request.headers','{}',true);
  set local role authenticated;
  perform public.ef_platform_mail('delete',mid);
  reset role;
  if exists(select 1 from vault.secrets where id=sid) then raise exception 'Orphan secret after disconnect'; end if;
  if exists(select 1 from private.platform_mail_deliveries where id=delivery) then raise exception 'Orphan delivery after disconnect'; end if;
end;
$$;
rollback;
select 'Mail permissions, encrypted credential lifecycle, preview denial and duplicate delivery checks passed; transaction rolled back' as result;
