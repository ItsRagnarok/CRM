-- Applied via MCP on 2026-11-08. Registry of authorizations/devices/vehicles with expiry,
-- and per-company enabled modules (set by the platform admin).
alter table public.organizations add column if not exists enabled_modules text[] not null default '{conformitate}';
update public.organizations set enabled_modules = '{conformitate}' where enabled_modules is null or enabled_modules = '{}';

create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('person','device','vehicle','company')),
  title text not null check (length(trim(title)) between 1 and 160),
  subject text not null check (length(trim(subject)) between 1 and 160),
  profile_id uuid references public.profiles(id) on delete set null,
  domain text check (domain in ('electric','gaze','fotovoltaic')),
  issued_on date,
  expires_on date not null,
  notes text check (notes is null or length(notes) <= 2000),
  last_alert_days int,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists compliance_items_org_expiry on public.compliance_items (organization_id, expires_on);
alter table public.compliance_items enable row level security;

create policy compliance_select on public.compliance_items for select to authenticated
  using (organization_id = public.current_org_id() and (public.is_back_office() or profile_id = auth.uid()));
create policy compliance_insert on public.compliance_items for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and (profile_id is null or exists (select 1 from public.profiles p where p.id = profile_id and p.organization_id = public.current_org_id())));
create policy compliance_update on public.compliance_items for update to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office()
    and (profile_id is null or exists (select 1 from public.profiles p where p.id = profile_id and p.organization_id = public.current_org_id())));
create policy compliance_delete on public.compliance_items for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office());
revoke all on public.compliance_items from anon;

create or replace function public.platform_admin_set_company_modules(org_id uuid, modules text[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  update public.organizations set enabled_modules = coalesce(modules, '{}') where id = org_id;
end;
$$;
revoke all on function public.platform_admin_set_company_modules(uuid, text[]) from public, anon;
grant execute on function public.platform_admin_set_company_modules(uuid, text[]) to authenticated;

-- A tenant admin must not switch modules on for themselves (applied as 20261108130100 via MCP).
create or replace function public.guard_org_platform_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.current_org_id() is null then
    return new;
  end if;
  if new.subscription_plan is distinct from old.subscription_plan then
    raise exception 'Planul se schimbă doar din platformă.' using errcode = '42501';
  end if;
  if new.enabled_modules is distinct from old.enabled_modules then
    raise exception 'Modulele active se schimbă doar din platformă.' using errcode = '42501';
  end if;
  if new.is_active is distinct from old.is_active then
    if not (old.is_active and not new.is_active and new.terms_declined_at is not null) then
      raise exception 'Starea contului se schimbă doar din platformă.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

-- Platform admin reads a company's domains/modules (organizations RLS only shows the caller's own).
create or replace function public.platform_admin_get_company_config(org_id uuid)
returns table (enabled_domains text[], enabled_modules text[])
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  return query select o.enabled_domains, o.enabled_modules from public.organizations o where o.id = org_id;
end;
$$;
revoke all on function public.platform_admin_get_company_config(uuid) from public, anon;
grant execute on function public.platform_admin_get_company_config(uuid) to authenticated;
