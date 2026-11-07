-- P2 (audit): notifications_insert permitea destinatari din alte organizații.
-- Destinatarul trebuie să fie în organizația apelantului.
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
  with check (
    organization_id = current_org_id()
    and exists (select 1 from public.profiles p where p.id = notifications.profile_id and p.organization_id = current_org_id())
  );
