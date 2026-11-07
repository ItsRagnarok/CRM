-- Notifications + technician messaging.
--
-- 1. notifications.link: where tapping a notification (bell or push) goes.
-- 2. profiles.notification_prefs: per-category push preferences
--    ({"messages":false} style; a missing key means enabled).
-- 3. Conversations/messages were readable and writable by EVERY non-client
--    role in the organization (is_staff() is true for technicians too), so a
--    technician could read other people's direct messages through the API.
--    Now admins/managers keep full access and field roles (technician,
--    team_leader) only see their own direct conversation and their teams'
--    conversations, and can only write messages as themselves into them.

alter table public.notifications add column if not exists link text;
alter table public.profiles add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

create or replace function public.my_team_ids()
returns setof uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select team_id from public.team_members where profile_id = auth.uid()
$$;

revoke all on function public.my_team_ids() from public, anon;
grant execute on function public.my_team_ids() to authenticated;

-- conversations
drop policy if exists conversations_all on public.conversations;

create policy conversations_manage on public.conversations
  for all
  using (organization_id = public.current_org_id() and public."current_role"() in ('admin', 'manager'))
  with check (organization_id = public.current_org_id() and public."current_role"() in ('admin', 'manager'));

create policy conversations_member_select on public.conversations
  for select
  using (
    organization_id = public.current_org_id()
    and public."current_role"() in ('technician', 'team_leader')
    and (profile_id = auth.uid() or team_id in (select public.my_team_ids()))
  );

-- conversation_messages
drop policy if exists conversation_messages_all on public.conversation_messages;

create policy conversation_messages_manage on public.conversation_messages
  for all
  using (organization_id = public.current_org_id() and public."current_role"() in ('admin', 'manager'))
  with check (organization_id = public.current_org_id() and public."current_role"() in ('admin', 'manager'));

create policy conversation_messages_member_select on public.conversation_messages
  for select
  using (
    organization_id = public.current_org_id()
    and public."current_role"() in ('technician', 'team_leader')
    and exists (select 1 from public.conversations c where c.id = conversation_messages.conversation_id)
  );

create policy conversation_messages_member_insert on public.conversation_messages
  for insert
  with check (
    organization_id = public.current_org_id()
    and public."current_role"() in ('technician', 'team_leader')
    and sender_profile_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_messages.conversation_id)
  );

-- conversation_reads: each person only ever touches their own read marker
drop policy if exists conversation_reads_all on public.conversation_reads;

create policy conversation_reads_own on public.conversation_reads
  for all
  using (
    profile_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_reads.conversation_id)
  )
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_reads.conversation_id)
  );

-- Technicians cannot UPDATE conversations (read-only for them), but the
-- admin-side unread badge compares conversations.last_message_at with each
-- admin's last read time. Keep it current from the database itself, no matter
-- who inserted the message.
create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id
     and last_message_at < new.created_at;
  return new;
end;
$$;

revoke all on function public.bump_conversation_last_message() from public, anon, authenticated;

drop trigger if exists conversation_messages_bump_last on public.conversation_messages;
create trigger conversation_messages_bump_last
  after insert on public.conversation_messages
  for each row execute function public.bump_conversation_last_message();

-- The bells (platform topbar and the mobile header) update live when a new
-- notification arrives, via Supabase Realtime. RLS still applies: each person
-- only receives their own rows.
alter publication supabase_realtime add table public.notifications;
