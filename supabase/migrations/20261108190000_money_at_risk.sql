-- Applied via MCP on 2026-11-08. One-row summary of money the company risks losing, for the dashboard.
-- unbilled_estimate is an ESTIMATE (hours x hourly rates of assigned people + material cost); the app labels it so.
create or replace function public.money_at_risk(p_today date)
returns table (
  unbilled_jobs bigint, unbilled_estimate numeric,
  overdue_count bigint, overdue_amount numeric, overdue_oldest_days integer,
  cash_open_count bigint, cash_open_amount numeric,
  pending_expenses_count bigint, pending_expenses_amount numeric
)
language sql
stable
security invoker
set search_path to 'public'
as $$
  with org as (select public.current_org_id() as id),
  unbilled as (
    select j.id,
      coalesce(extract(epoch from (j.work_ended_at - j.work_started_at)) / 3600, 0)
        * coalesce((select sum(coalesce(p.hourly_rate, 0)) from public.job_assignments a join public.profiles p on p.id = a.profile_id where a.job_id = j.id), 0)
      + coalesce((select sum(mu.quantity * coalesce(m.unit_cost, 0)) from public.material_usage mu join public.materials m on m.id = mu.material_id where mu.job_id = j.id), 0) as est
    from public.jobs j, org
    where j.organization_id = org.id and j.status = 'finalizata'
      and not exists (select 1 from public.invoices i where i.job_id = j.id)
  ),
  overdue as (
    select i.total_amount, (p_today - coalesce(i.due_date, i.issued_at)) as days
    from public.invoices i, org
    where i.organization_id = org.id and i.status in ('unpaid', 'overdue') and coalesce(i.due_date, i.issued_at) < p_today
  )
  select
    (select count(*) from unbilled),
    coalesce((select sum(est) from unbilled), 0),
    (select count(*) from overdue),
    coalesce((select sum(total_amount) from overdue), 0),
    coalesce((select max(days) from overdue), 0)::integer,
    (select count(*) from public.billing_requests b, org where b.organization_id = org.id and b.status = 'new' and coalesce(b.collected_amount, 0) > 0),
    coalesce((select sum(b.collected_amount) from public.billing_requests b, org where b.organization_id = org.id and b.status = 'new'), 0),
    (select count(*) from public.expenses e, org where e.organization_id = org.id and e.status = 'pending'),
    coalesce((select sum(e.amount) from public.expenses e, org where e.organization_id = org.id and e.status = 'pending'), 0);
$$;
revoke all on function public.money_at_risk(date) from public, anon;
grant execute on function public.money_at_risk(date) to authenticated;
