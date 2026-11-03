-- Credentials are encrypted by Supabase Vault. No mailbox data belongs to a tenant.
create schema if not exists private;
create table private.platform_mail_accounts (
  id uuid primary key default gen_random_uuid(),
  address text not null unique,
  settings jsonb not null,
  secret_id uuid not null references vault.secrets(id),
  verified_at timestamptz not null default now()
);
create table private.platform_mail_limits (
  admin_id uuid primary key references public.platform_admins(id) on delete cascade,
  window_start timestamptz not null default now(),
  requests integer not null default 0
);
create table private.platform_mail_deliveries (
  id uuid primary key,
  account_id uuid not null references private.platform_mail_accounts(id) on delete cascade,
  fingerprint text not null,
  status text not null check(status in ('sending','accepted','unknown')),
  created_at timestamptz not null default now()
);
alter table private.platform_mail_accounts enable row level security;
alter table private.platform_mail_limits enable row level security;
alter table private.platform_mail_deliveries enable row level security;
revoke all on private.platform_mail_accounts, private.platform_mail_limits from public, anon, authenticated;
revoke all on private.platform_mail_deliveries from public, anon, authenticated;

-- The privileged implementation stays outside the exposed schema, with a fixed
-- search_path and an independent membership check on every call, including reads.
create function private.platform_mail_dispatch(operation text, p_id uuid, config jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb; sid uuid; request_count integer; safe_settings jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Super Admin required' using errcode = '42501';
  end if;
  if coalesce(current_setting('request.headers', true), '{}')::jsonb ? 'x-ef-preview-org' then
    raise exception 'Mail unavailable in company preview' using errcode = '42501';
  end if;
  if operation = 'list' then
    select coalesce(jsonb_agg(settings || jsonb_build_object('id', id, 'verifiedAt', verified_at) order by settings->>'name'), '[]'::jsonb)
      into result from private.platform_mail_accounts;
    return result;
  end if;
  insert into private.platform_mail_limits as limits (admin_id, requests) values (auth.uid(), 1)
  on conflict (admin_id) do update set
    requests = case when limits.window_start < now() - interval '1 minute' then 1 else limits.requests + 1 end,
    window_start = case when limits.window_start < now() - interval '1 minute' then now() else limits.window_start end
  returning requests into request_count;
  if request_count > 120 then raise exception 'Mail rate limit' using errcode = 'P0001'; end if;
  if operation = 'check' then return 'true'::jsonb; end if;
  if operation = 'claim_send' then
    if config->>'fingerprint' !~ '^[0-9a-f]{64}$' then raise exception 'Invalid delivery fingerprint'; end if;
    insert into private.platform_mail_deliveries(id, account_id, fingerprint, status)
      values ((config->>'deliveryId')::uuid, p_id, config->>'fingerprint', 'sending') on conflict (id) do nothing;
    if found then return jsonb_build_object('claimed', true); end if;
    if exists (select 1 from private.platform_mail_deliveries where id = (config->>'deliveryId')::uuid
      and (account_id <> p_id or fingerprint <> config->>'fingerprint')) then
      raise exception 'Delivery request changed' using errcode = '22023';
    end if;
    return jsonb_build_object('claimed', false, 'status',
      (select status from private.platform_mail_deliveries where id = (config->>'deliveryId')::uuid));
  end if;
  if operation = 'finish_send' then
    update private.platform_mail_deliveries set status = config->>'status'
      where id = (config->>'deliveryId')::uuid and account_id = p_id and status = 'sending';
    return 'true'::jsonb;
  end if;
  if operation = 'credentials' then
    select a.settings || v.decrypted_secret::jsonb into result from private.platform_mail_accounts a
      join vault.decrypted_secrets v on v.id = a.secret_id where a.id = p_id;
    if result is null then raise exception 'Mail account not found' using errcode = 'P0002'; end if;
    return result;
  end if;
  if operation = 'save' then
    if jsonb_typeof(config) <> 'object' or length(config::text) > 12000
      or coalesce(length(config->>'password'), 0) = 0 or coalesce(length(config->>'outgoingPassword'), 0) = 0
      or coalesce(config->>'address', '') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Invalid mail settings' using errcode = '22023';
    end if;
    safe_settings = jsonb_build_object('name', config->>'name', 'address', lower(config->>'address'),
      'username', config->>'username', 'incomingHost', config->>'incomingHost', 'incomingPort', config->'incomingPort',
      'incomingSecurity', config->>'incomingSecurity', 'outgoingHost', config->>'outgoingHost',
      'outgoingPort', config->'outgoingPort', 'outgoingSecurity', config->>'outgoingSecurity', 'outgoingUsername', config->>'outgoingUsername',
      'separateSmtp', coalesce(config->'separateSmtp', 'false'::jsonb));
    -- Serialize additions/updates so the account cap and duplicate checks are atomic.
    perform pg_advisory_xact_lock(73651492);
    if p_id is not null then
      select secret_id into sid from private.platform_mail_accounts where id = p_id for update;
      if sid is null then raise exception 'Mail account not found' using errcode = 'P0002'; end if;
      perform vault.update_secret(sid, jsonb_build_object('password', config->>'password', 'outgoingPassword', config->>'outgoingPassword')::text);
      update private.platform_mail_accounts set address = lower(config->>'address'), settings = safe_settings, verified_at = now() where id = p_id;
    else
      if (select count(*) from private.platform_mail_accounts) >= 20 then raise exception 'Mail account limit'; end if;
      sid = vault.create_secret(jsonb_build_object('password', config->>'password', 'outgoingPassword', config->>'outgoingPassword')::text,
        null, 'ElectroField platform mailbox credentials');
      insert into private.platform_mail_accounts(address, settings, secret_id)
        values (lower(config->>'address'), safe_settings, sid) returning id into p_id;
    end if;
    return jsonb_build_object('id', p_id);
  end if;
  if operation = 'delete' then
    delete from private.platform_mail_accounts where id = p_id returning secret_id into sid;
    if sid is null then raise exception 'Mail account not found' using errcode = 'P0002'; end if;
    delete from vault.secrets where id = sid;
    return 'true'::jsonb;
  end if;
  raise exception 'Invalid mail operation' using errcode = '22023';
end;
$$;
revoke all on function private.platform_mail_dispatch(text,uuid,jsonb) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.platform_mail_dispatch(text,uuid,jsonb) to authenticated;

-- Explicit invoker wrapper. Credential retrieval is restricted to verified platform
-- admins by the implementation; only the Node server consumes it in this app.
create function public.ef_platform_mail(operation text, p_id uuid default null, config jsonb default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.platform_mail_dispatch(operation, p_id, config);
$$;
revoke all on function public.ef_platform_mail(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.ef_platform_mail(text,uuid,jsonb) to authenticated;
