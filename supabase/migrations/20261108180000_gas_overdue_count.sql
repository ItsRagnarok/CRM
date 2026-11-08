-- Applied via MCP on 2026-11-08. Counts overdue gas units in SQL so the dashboard does not download every row.
create or replace function public.gas_overdue_count(p_today date)
returns bigint
language sql
stable
security invoker
set search_path to 'public'
as $$
  select count(*)
  from public.gas_units u
  join public.organizations o on o.id = u.organization_id
  where u.organization_id = public.current_org_id()
    and (
      (u.last_inspection_on is not null and u.last_inspection_on + make_interval(months => o.gas_inspection_months) < p_today)
      or (u.last_revision_on is not null and u.last_revision_on + make_interval(months => o.gas_revision_months) < p_today)
    );
$$;
revoke all on function public.gas_overdue_count(date) from public, anon;
grant execute on function public.gas_overdue_count(date) to authenticated;
