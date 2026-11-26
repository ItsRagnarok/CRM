-- Conturi demo: firma vede tot meniul, dar o parte din module sunt blocate cu un ecran
-- „se configurează pe firma ta”. Super Adminul alege ce deblochează și până când ține demo-ul.
alter table public.organizations
  add column if not exists account_type text not null default 'client' check (account_type in ('client', 'demo')),
  add column if not exists demo_unlocked text[] not null default '{}',
  add column if not exists demo_expires_at timestamptz;

-- Adminul firmei nu-și poate schimba singur tipul contului sau ce e deblocat.
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
  if new.account_type is distinct from old.account_type
     or new.demo_unlocked is distinct from old.demo_unlocked
     or new.demo_expires_at is distinct from old.demo_expires_at then
    raise exception 'Contul demo se schimbă doar din platformă.' using errcode = '42501';
  end if;
  if new.is_active is distinct from old.is_active then
    if not (old.is_active and not new.is_active and new.terms_declined_at is not null) then
      raise exception 'Starea contului se schimbă doar din platformă.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

-- Ce a încercat firma în demo (ce module blocate a deschis), ca Super Adminul să știe despre ce să vorbească.
create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  feature text not null check (length(feature) <= 40),
  area text not null check (area in ('web', 'mobil')),
  created_at timestamptz not null default now()
);
create index if not exists demo_events_org_created on public.demo_events (organization_id, created_at desc);
alter table public.demo_events enable row level security;
revoke all on public.demo_events from anon;
-- Firma doar scrie (propriile evenimente, doar în demo); citirea e doar prin RPC-ul de platformă.
create policy demo_events_insert on public.demo_events for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and profile_id = auth.uid()
    and exists (select 1 from public.organizations o where o.id = organization_id and o.account_type = 'demo')
  );

create or replace function public.platform_admin_set_demo(org_id uuid, p_demo boolean, p_unlocked text[], p_expires timestamptz)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  update public.organizations
     set account_type = case when p_demo then 'demo' else 'client' end,
         demo_unlocked = case when p_demo then coalesce(p_unlocked, '{}') else '{}' end,
         demo_expires_at = case when p_demo then p_expires else null end
   where id = org_id;
end $$;
revoke all on function public.platform_admin_set_demo(uuid, boolean, text[], timestamptz) from public, anon;
grant execute on function public.platform_admin_set_demo(uuid, boolean, text[], timestamptz) to authenticated;

-- Starea demo a companiilor (toate, sau una), pentru lista și pagina companiei din Super Admin.
create or replace function public.platform_admin_get_demo(org_id uuid default null)
returns table (id uuid, account_type text, demo_unlocked text[], demo_expires_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where platform_admins.id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  return query select o.id, o.account_type, o.demo_unlocked, o.demo_expires_at from public.organizations o
    where org_id is null or o.id = org_id;
end $$;
revoke all on function public.platform_admin_get_demo(uuid) from public, anon;
grant execute on function public.platform_admin_get_demo(uuid) to authenticated;

-- Ce module blocate a deschis firma: de câte ori și când ultima dată.
create or replace function public.platform_admin_demo_events(org_id uuid)
returns table (feature text, area text, opens bigint, last_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.platform_admins where id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  return query select e.feature, e.area, count(*), max(e.created_at) from public.demo_events e
    where e.organization_id = org_id group by e.feature, e.area order by max(e.created_at) desc;
end $$;
revoke all on function public.platform_admin_demo_events(uuid) from public, anon;
grant execute on function public.platform_admin_demo_events(uuid) to authenticated;
