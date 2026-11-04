create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid default auth.uid() references public.profiles(id) on delete set null,
  kind text not null check (kind in ('feature', 'cancellation')),
  details text not null check (char_length(btrim(details)) between 1 and 3000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index subscription_requests_org_created_idx
  on public.subscription_requests (organization_id, created_at desc);
create unique index subscription_requests_pending_cancel_idx
  on public.subscription_requests (organization_id)
  where kind = 'cancellation' and resolved_at is null;

alter table public.subscription_requests enable row level security;
revoke all on public.subscription_requests from public, anon, authenticated;
grant select, insert (organization_id, kind, details), update (resolved_at)
  on public.subscription_requests to authenticated;

create policy subscription_requests_company_read on public.subscription_requests
  for select to authenticated using (
    organization_id = (select public.current_org_id())
    and (select public.current_role()) = 'admin'
  );

create policy subscription_requests_company_insert on public.subscription_requests
  for insert to authenticated with check (
    organization_id = (select public.current_org_id())
    and (select public.current_role()) = 'admin'
    and requested_by = (select auth.uid())
  );

create policy subscription_requests_platform_read on public.subscription_requests
  for select to authenticated using ((select public.ef_is_platform_admin()));

create policy subscription_requests_platform_resolve on public.subscription_requests
  for update to authenticated
  using ((select public.ef_is_platform_admin()) and resolved_at is null)
  with check ((select public.ef_is_platform_admin()) and resolved_at is not null);

create trigger ef_preview_write_guard
  before insert or update or delete on public.subscription_requests
  for each statement execute function public.ef_reject_preview_write();
