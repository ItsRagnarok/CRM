-- Transfer of the Super Admin role to another account.
-- 1) begin: creates the new account (temporary password) and grants the role;
-- 2) the app emails the temporary password;
-- 3) finish: removes the role from the caller. cancel: rolls back step 1.
create or replace function public.platform_admin_transfer_begin(new_email text, new_full_name text, temp_password text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  new_user_id uuid;
  clean_email text := lower(trim(new_email));
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresa de email nu este validă.';
  end if;
  if length(temp_password) < 12 then
    raise exception 'Parola temporară este prea scurtă.';
  end if;
  if exists (select 1 from auth.users where lower(email) = clean_email) then
    raise exception 'Există deja un cont cu acest email.';
  end if;

  new_user_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    clean_email, extensions.crypt(temp_password, extensions.gen_salt('bf')),
    now(), '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, false, now(), now()
  );
  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), new_user_id::text, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', clean_email, 'email_verified', true),
    'email', now(), now(), now()
  );
  insert into public.platform_admins (id, full_name) values (new_user_id, coalesce(nullif(trim(new_full_name), ''), clean_email));
  return new_user_id;
end;
$$;

create or replace function public.platform_admin_transfer_finish(new_admin_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if new_admin_id = auth.uid() or not exists (select 1 from public.platform_admins where id = new_admin_id) then
    raise exception 'Noul administrator nu este valid.';
  end if;
  delete from public.platform_admins where id = auth.uid();
end;
$$;

create or replace function public.platform_admin_transfer_cancel(new_admin_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if new_admin_id = auth.uid() then
    raise exception 'Nu poți anula propriul cont.';
  end if;
  delete from public.platform_admins where id = new_admin_id;
  -- Only remove accounts created by this transfer: no tenant profile, created minutes ago.
  delete from auth.users u
   where u.id = new_admin_id
     and u.created_at > now() - interval '15 minutes'
     and not exists (select 1 from public.profiles p where p.id = u.id);
end;
$$;

revoke all on function public.platform_admin_transfer_begin(text, text, text) from public, anon;
revoke all on function public.platform_admin_transfer_finish(uuid) from public, anon;
revoke all on function public.platform_admin_transfer_cancel(uuid) from public, anon;
grant execute on function public.platform_admin_transfer_begin(text, text, text) to authenticated;
grant execute on function public.platform_admin_transfer_finish(uuid) to authenticated;
grant execute on function public.platform_admin_transfer_cancel(uuid) to authenticated;
