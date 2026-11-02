-- Additive platform administration support. Existing tenant policies remain intact.
create or replace function public.ef_is_platform_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.platform_admins where id = (select auth.uid())) $$;
revoke all on function public.ef_is_platform_admin() from public;
grant execute on function public.ef_is_platform_admin() to authenticated;

create or replace function public.ef_preview_org() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare value text := coalesce(current_setting('request.headers',true),'{}')::jsonb->>'x-ef-preview-org';
begin
 if value is null or not public.ef_is_platform_admin() then return null; end if;
 if value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return null; end if;
 return value::uuid;
end $$;
revoke all on function public.ef_preview_org() from public;
grant execute on function public.ef_preview_org() to authenticated;

create or replace function public.ef_reject_preview_write() returns trigger
language plpgsql set search_path = '' as $$
begin
 if coalesce(current_setting('request.headers',true),'{}')::jsonb->>'x-ef-preview-org' is not null then
   raise exception 'Preview is read only' using errcode='42501';
 end if;
 if TG_OP = 'DELETE' then return OLD; end if;
 return NEW;
end $$;

do $$
declare t record;
begin
 for t in select c.table_name from information_schema.columns c join information_schema.tables b
 on b.table_schema=c.table_schema and b.table_name=c.table_name
 where c.table_schema='public' and c.column_name='organization_id' and b.table_type='BASE TABLE'
 loop
  execute format('drop policy if exists ef_platform_preview_select on public.%I',t.table_name);
  execute format('create policy ef_platform_preview_select on public.%I for select to authenticated using (organization_id = (select public.ef_preview_org()))',t.table_name);
 end loop;
 -- A trigger also guards writes made inside SECURITY DEFINER RPCs.
 for t in select tablename from pg_tables where schemaname='public'
 loop
  execute format('drop trigger if exists ef_preview_write_guard on public.%I',t.tablename);
  execute format('create trigger ef_preview_write_guard before insert or update or delete on public.%I for each statement execute function public.ef_reject_preview_write()',t.tablename);
 end loop;
end $$;

drop policy if exists ef_platform_preview_select on public.organizations;
create policy ef_platform_preview_select on public.organizations for select to authenticated using(id=(select public.ef_preview_org()));

do $$
declare spec text[]; table_name text; predicate text;
begin
 foreach spec slice 1 in array array[
  ['client_contacts','exists(select 1 from public.clients p where p.id=client_id and p.organization_id=(select public.ef_preview_org()))'],
  ['team_members','exists(select 1 from public.teams p where p.id=team_id and p.organization_id=(select public.ef_preview_org()))'],
  ['job_assignments','exists(select 1 from public.jobs p where p.id=job_id and p.organization_id=(select public.ef_preview_org()))'],
  ['job_status_history','exists(select 1 from public.jobs p where p.id=job_id and p.organization_id=(select public.ef_preview_org()))'],
  ['job_checklists','exists(select 1 from public.jobs p where p.id=job_id and p.organization_id=(select public.ef_preview_org()))'],
  ['job_checklist_items','exists(select 1 from public.job_checklists c join public.jobs p on p.id=c.job_id where c.id=job_checklist_id and p.organization_id=(select public.ef_preview_org()))'],
  ['checklist_template_items','exists(select 1 from public.checklist_templates p where p.id=template_id and p.organization_id=(select public.ef_preview_org()))'],
  ['expense_receipts','exists(select 1 from public.expenses p where p.id=expense_id and p.organization_id=(select public.ef_preview_org()))'],
  ['conversation_reads','exists(select 1 from public.conversations p where p.id=conversation_id and p.organization_id=(select public.ef_preview_org()))']
 ] loop
  table_name:=spec[1]; predicate:=spec[2];
  execute format('drop policy if exists ef_platform_preview_select on public.%I',table_name);
  execute format('create policy ef_platform_preview_select on public.%I for select to authenticated using (%s)',table_name,predicate);
 end loop;
end $$;
drop policy if exists ef_platform_preview_read on storage.objects;
create policy ef_platform_preview_read on storage.objects for select to authenticated
using(bucket_id='attachments' and (storage.foldername(name))[1]=(select public.ef_preview_org())::text);

-- Booking administration follows platform membership, not a hard-coded email.
drop policy if exists "programari admin" on public.bookings;
create policy "programari admin" on public.bookings for all to authenticated using((select public.ef_is_platform_admin())) with check((select public.ef_is_platform_admin()));
drop policy if exists "settings admin" on public.booking_settings;
create policy "settings admin" on public.booking_settings for all to authenticated using((select public.ef_is_platform_admin())) with check((select public.ef_is_platform_admin()));
drop policy if exists "zile admin" on public.booking_days;
create policy "zile admin" on public.booking_days for all to authenticated using((select public.ef_is_platform_admin())) with check((select public.ef_is_platform_admin()));
grant select,insert,update,delete on public.bookings,public.booking_settings,public.booking_days to authenticated;

create table if not exists public.platform_usage_sessions(
 id uuid primary key,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 channel text not null check(channel in ('web','mobile')),
 started_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 last_active_at timestamptz,
 ended_at timestamptz,
 end_reason text,
 active_seconds integer not null default 0 check(active_seconds>=0),
 last_route text not null default '/'
);
create index if not exists platform_usage_sessions_org_seen on public.platform_usage_sessions(organization_id,last_seen_at desc);
create table if not exists public.platform_usage_daily(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 day date not null,
 channel text not null check(channel in ('web','mobile')),
 active_seconds integer not null default 0,
 sessions integer not null default 0,
 constraint platform_usage_daily_scope_key unique(organization_id,profile_id,day,channel)
);
alter table public.platform_usage_sessions enable row level security;
alter table public.platform_usage_daily enable row level security;
grant select on public.platform_usage_sessions,public.platform_usage_daily to authenticated;
revoke insert,update,delete on public.platform_usage_sessions,public.platform_usage_daily from anon,authenticated;
drop policy if exists ef_usage_admin_read on public.platform_usage_sessions;
create policy ef_usage_admin_read on public.platform_usage_sessions for select to authenticated using((select public.ef_is_platform_admin()));
drop policy if exists ef_usage_admin_read on public.platform_usage_daily;
create policy ef_usage_admin_read on public.platform_usage_daily for select to authenticated using((select public.ef_is_platform_admin()));

create or replace function public.ef_record_usage(session_id uuid, p_channel text, p_active_seconds integer, p_route text, p_event text default 'ping')
returns void language plpgsql security definer set search_path='' as $$
declare p public.profiles; s public.platform_usage_sessions; credit integer:=0; new_session boolean:=false; local_day date; affected integer; elapsed integer; last_active timestamptz;
begin
 if session_id is null or p_channel is null or p_active_seconds is null or p_route is null or p_event is null then raise exception 'Invalid usage event'; end if;
 if (select auth.uid()) is null then raise exception 'Not authenticated' using errcode='42501'; end if;
 if public.ef_preview_org() is not null then return; end if;
 select * into p from public.profiles where id=(select auth.uid()) and is_active;
 if p.id is null then return; end if;
 if p_channel not in ('web','mobile') or p_event not in ('start','ping','hidden','close','logout') or p_active_seconds not between 0 and 35 then raise exception 'Invalid usage event'; end if;
 if length(p_route)>100 or p_route !~ '^/[a-zA-Z0-9/_:-]*$' then raise exception 'Invalid route'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p.id::text,0));
 insert into public.platform_usage_sessions(id,organization_id,profile_id,channel,last_route)
 values(session_id,p.organization_id,p.id,p_channel,p_route) on conflict do nothing;
 get diagnostics affected = row_count;
 new_session := affected=1;
 select * into s from public.platform_usage_sessions where id=session_id for update;
 if s.profile_id<>p.id or s.organization_id<>p.organization_id or s.channel<>p_channel then raise exception 'Invalid session' using errcode='42501'; end if;
 select max(last_active_at) into last_active from public.platform_usage_sessions where profile_id=p.id;
 elapsed:=greatest(0,least(35,floor(extract(epoch from now()-greatest(s.last_seen_at,coalesce(last_active,s.last_seen_at))))::integer));
 credit:=least(p_active_seconds,elapsed);
 update public.platform_usage_sessions set last_seen_at=now(),last_route=p_route,
 active_seconds=platform_usage_sessions.active_seconds+credit,
 last_active_at=case when credit>0 then now() else last_active_at end,
 ended_at=case when p_event in ('close','logout') then now() else null end,
 end_reason=case when p_event in ('close','logout') then p_event else null end
 where id=session_id;
 local_day:=(now() at time zone 'Europe/Bucharest')::date;
 insert into public.platform_usage_daily(organization_id,profile_id,day,channel,active_seconds,sessions)
 values(p.organization_id,p.id,local_day,p_channel,credit,case when new_session then 1 else 0 end)
 on conflict(organization_id,profile_id,day,channel) do update
 set active_seconds=platform_usage_daily.active_seconds+excluded.active_seconds,sessions=platform_usage_daily.sessions+excluded.sessions;
end $$;
revoke all on function public.ef_record_usage(uuid,text,integer,text,text) from public,anon;
grant execute on function public.ef_record_usage(uuid,text,integer,text,text) to authenticated;

-- Show a selected employee's account email in preview without exposing auth.users broadly.
create or replace function public.ef_preview_employee_email(target_profile_id uuid) returns text
language sql stable security definer set search_path='' as $$
 select u.email::text from auth.users u join public.profiles p on p.id=u.id
 where p.id=target_profile_id and p.organization_id=public.ef_preview_org()
$$;
revoke all on function public.ef_preview_employee_email(uuid) from public,anon;
grant execute on function public.ef_preview_employee_email(uuid) to authenticated;
notify pgrst,'reload schema';

create or replace function public.ef_close_usage() returns void language sql security definer set search_path='' as $$
  update public.platform_usage_sessions set ended_at=now(),end_reason='logout'
  where profile_id=(select auth.uid()) and ended_at is null and public.ef_preview_org() is null;
$$;
revoke all on function public.ef_close_usage() from public,anon;
grant execute on function public.ef_close_usage() to authenticated;

-- Keep detailed activity for 90 days and daily summaries for one year.
create index if not exists ef_usage_profile_active on public.platform_usage_sessions(profile_id,last_active_at desc);
create index if not exists ef_usage_last_seen on public.platform_usage_sessions(last_seen_at);
create index if not exists ef_usage_daily_day_org on public.platform_usage_daily(day,organization_id);
create index if not exists ef_usage_daily_profile on public.platform_usage_daily(profile_id);

select cron.schedule('ef-usage-retention','20 3 * * *', $$
  delete from public.platform_usage_sessions where last_seen_at < now()-interval '90 days';
  delete from public.platform_usage_daily where day < (now() at time zone 'Europe/Bucharest')::date-365;
$$);
