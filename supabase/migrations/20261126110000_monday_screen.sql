-- Etapa 3, punctul 14: ecranul „Luni dimineața” pentru patron.
--
-- organizations.monday_config: cele 3 cifre alese de patron și pragurile lor
--   ({"metrics": ["restante","marja","nefacturat"], "thresholds": {"restante": 10000, ...}}).
-- invoices.paid_at: când a fost marcată plătită, ca să existe „încasat săptămâna trecută”.
-- ef_monday_report_for: toate cifrele într-un singur loc (restanțe pe vechime, marjă pe tip și pe echipă…),
--   folosite și de pagină (prin monday_report) și de notificarea de luni dimineață (pg_cron).

alter table public.organizations add column if not exists monday_config jsonb not null default '{}'::jsonb;

alter table public.invoices add column if not exists paid_at timestamptz;
update public.invoices
   set paid_at = least(now(), greatest(issued_at, coalesce(due_date::timestamptz, issued_at) - interval '3 days'))
 where status = 'paid' and paid_at is null;

create or replace function public.ef_invoice_paid_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') and new.paid_at is null then
    new.paid_at := now();
  elsif new.status <> 'paid' then
    new.paid_at := null;
  end if;
  return new;
end $$;
drop trigger if exists invoices_paid_at on public.invoices;
create trigger invoices_paid_at before insert or update of status on public.invoices
  for each row execute function public.ef_invoice_paid_at();

create or replace function public.ef_monday_report_for(p_org uuid, p_today date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  week_start date := p_today - ((extract(isodow from p_today)::int) - 1);
  result jsonb;
begin
  with
  open_inv as (
    select i.id, i.client_id, i.total_amount amount, (p_today - coalesce(i.due_date, i.issued_at::date)) days
    from public.invoices i
    where i.organization_id = p_org and i.status in ('unpaid', 'overdue')
  ),
  overdue as (select * from open_inv where days > 0),
  per_client as (
    select o.client_id, c.name, c.phone, sum(o.amount) amount, max(o.days) oldest, count(*) n
    from overdue o join public.clients c on c.id = o.client_id
    group by 1, 2, 3 order by max(o.days) desc, sum(o.amount) desc limit 8
  ),
  -- Marja pe lucrare, ca în dosarul lucrării: facturat − (ore pe teren × tarifele echipei + materiale + cheltuieli aprobate).
  billed as (
    select i.job_id, sum(i.total_amount) billed, min(i.issued_at) issued_at
    from public.invoices i
    where i.organization_id = p_org and i.job_id is not null and i.status <> 'cancelled'
    group by 1
    having min(i.issued_at) >= (p_today - 90)
  ),
  jm as (
    select j.id, j.job_type::text job_type, coalesce(t.name, 'Fără echipă') team, b.billed,
      case when j.work_started_at is not null and j.work_ended_at is not null then
        greatest(0, extract(epoch from (j.work_ended_at - j.work_started_at)) / 3600)
        * coalesce((select sum(coalesce(p.hourly_rate, 0)) from public.job_assignments a join public.profiles p on p.id = a.profile_id where a.job_id = j.id), 0)
      end labor,
      coalesce((select sum(mu.quantity * coalesce(m.unit_cost, 0)) from public.material_usage mu join public.materials m on m.id = mu.material_id where mu.job_id = j.id), 0) materials,
      coalesce((select sum(e.amount) from public.expenses e where e.job_id = j.id and e.status = 'approved'), 0) expenses
    from billed b join public.jobs j on j.id = b.job_id left join public.teams t on t.id = j.team_id
    where j.organization_id = p_org
  ),
  jmc as (select *, labor + materials + expenses cost from jm where labor is not null and billed > 0),
  unbilled as (
    select j.id,
      coalesce(extract(epoch from (j.work_ended_at - j.work_started_at)) / 3600, 0)
        * coalesce((select sum(coalesce(p.hourly_rate, 0)) from public.job_assignments a join public.profiles p on p.id = a.profile_id where a.job_id = j.id), 0)
      + coalesce((select sum(mu.quantity * coalesce(m.unit_cost, 0)) from public.material_usage mu join public.materials m on m.id = mu.material_id where mu.job_id = j.id), 0) est,
      (p_today - coalesce(j.work_ended_at::date, j.scheduled_date)) days
    from public.jobs j
    where j.organization_id = p_org and j.status = 'finalizata'
      and not exists (select 1 from public.invoices i where i.job_id = j.id)
  )
  select jsonb_build_object(
    'today', p_today,
    'restante', jsonb_build_object(
      'total', coalesce((select sum(amount) from overdue), 0),
      'count', (select count(*) from overdue),
      'over60', coalesce((select sum(amount) from overdue where days > 60), 0),
      'not_due', coalesce((select sum(amount) from open_inv where days <= 0), 0),
      'not_due_count', (select count(*) from open_inv where days <= 0),
      'buckets', jsonb_build_array(
        jsonb_build_object('label', '1–30 zile', 'amount', coalesce((select sum(amount) from overdue where days between 1 and 30), 0), 'count', (select count(*) from overdue where days between 1 and 30)),
        jsonb_build_object('label', '31–60 zile', 'amount', coalesce((select sum(amount) from overdue where days between 31 and 60), 0), 'count', (select count(*) from overdue where days between 31 and 60)),
        jsonb_build_object('label', '61–90 zile', 'amount', coalesce((select sum(amount) from overdue where days between 61 and 90), 0), 'count', (select count(*) from overdue where days between 61 and 90)),
        jsonb_build_object('label', 'peste 90 zile', 'amount', coalesce((select sum(amount) from overdue where days > 90), 0), 'count', (select count(*) from overdue where days > 90))),
      'clients', coalesce((select jsonb_agg(jsonb_build_object('id', client_id, 'name', name, 'phone', phone, 'amount', amount, 'oldest', oldest, 'count', n)) from per_client), '[]'::jsonb)),
    'nefacturat', jsonb_build_object(
      'count', (select count(*) from unbilled),
      'estimate', coalesce((select sum(est) from unbilled), 0),
      'oldest', coalesce((select max(days) from unbilled), 0)),
    'incasat', jsonb_build_object(
      'last7', coalesce((select sum(total_amount) from public.invoices where organization_id = p_org and status = 'paid' and paid_at >= (p_today - 7)::timestamptz and paid_at < p_today::timestamptz + interval '1 day'), 0),
      'prev7', coalesce((select sum(total_amount) from public.invoices where organization_id = p_org and status = 'paid' and paid_at >= (p_today - 14)::timestamptz and paid_at < (p_today - 7)::timestamptz), 0)),
    'facturat', jsonb_build_object(
      'last30', coalesce((select sum(total_amount) from public.invoices where organization_id = p_org and status <> 'cancelled' and issued_at >= (p_today - 30)), 0),
      'prev30', coalesce((select sum(total_amount) from public.invoices where organization_id = p_org and status <> 'cancelled' and issued_at >= (p_today - 60) and issued_at < (p_today - 30)), 0)),
    'marja', jsonb_build_object(
      'billed', coalesce((select sum(billed) from jmc), 0),
      'cost', coalesce((select sum(cost) from jmc), 0),
      'jobs', (select count(*) from jmc),
      'missing', (select count(*) from jm where labor is null),
      'by_type', coalesce((select jsonb_agg(x order by x.billed desc) from (select job_type key, count(*) jobs, sum(billed) billed, sum(cost) cost from jmc group by 1) x), '[]'::jsonb),
      'by_team', coalesce((select jsonb_agg(x order by x.billed desc) from (select team key, count(*) jobs, sum(billed) billed, sum(cost) cost from jmc group by 1) x), '[]'::jsonb)),
    'cereri', jsonb_build_object(
      'count', (select count(*) from public.service_requests where organization_id = p_org and status = 'noua'),
      'old', (select count(*) from public.service_requests where organization_id = p_org and status = 'noua' and created_at < now() - interval '24 hours')),
    'saptamana', jsonb_build_object(
      'jobs', (select count(*) from public.jobs where organization_id = p_org and scheduled_date between week_start and week_start + 6),
      'no_team', (select count(*) from public.jobs j where j.organization_id = p_org and j.scheduled_date between week_start and week_start + 6 and j.status = 'programata'
                    and j.team_id is null and not exists (select 1 from public.job_assignments a where a.job_id = j.id)))
  ) into result;
  return result;
end $$;
revoke all on function public.ef_monday_report_for(uuid, date) from public, anon, authenticated;

-- Pentru pagină: doar biroul firmei, doar firma proprie.
create or replace function public.monday_report(p_today date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_back_office() then raise exception 'Fără acces' using errcode = '42501'; end if;
  return public.ef_monday_report_for(public.current_org_id(), p_today);
end $$;
revoke all on function public.monday_report(date) from public, anon;
grant execute on function public.monday_report(date) to authenticated;

-- Cifrele alese și pragurile (fără praguri setate, alegerea implicită).
create or replace function public.ef_monday_breaches(r jsonb, cfg jsonb) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  metrics text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(cfg->'metrics') x), array['restante','marja','nefacturat']);
  th jsonb := coalesce(cfg->'thresholds', '{}'::jsonb);
  out text[] := '{}';
  m text;
  billed numeric := (r->'marja'->>'billed')::numeric;
  pct numeric;
begin
  foreach m in array metrics loop
    if th ? m and jsonb_typeof(th->m) = 'number' then
      if m = 'restante' and (r->'restante'->>'total')::numeric > (th->>m)::numeric then out := out || 'Restanțe';
      elsif m = 'restante60' and (r->'restante'->>'over60')::numeric > (th->>m)::numeric then out := out || 'Restanțe peste 60 de zile';
      elsif m = 'nefacturat' and (r->'nefacturat'->>'count')::numeric > (th->>m)::numeric then out := out || 'Lucrări nefacturate';
      elsif m = 'incasat' and (r->'incasat'->>'last7')::numeric < (th->>m)::numeric then out := out || 'Încasat săptămâna trecută';
      elsif m = 'facturat' and (r->'facturat'->>'last30')::numeric < (th->>m)::numeric then out := out || 'Facturat în 30 de zile';
      elsif m = 'marja' and billed > 0 then
        pct := round(100 * (billed - (r->'marja'->>'cost')::numeric) / billed);
        if pct < (th->>m)::numeric then out := out || 'Marja'; end if;
      elsif m = 'cereri' and (r->'cereri'->>'old')::numeric > (th->>m)::numeric then out := out || 'Cereri fără răspuns';
      elsif m = 'saptamana' and (r->'saptamana'->>'no_team')::numeric > (th->>m)::numeric then out := out || 'Lucrări fără echipă';
      end if;
    end if;
  end loop;
  return out;
end $$;

-- Luni dimineață: notificare pentru administratori, cu cifrele care au trecut de prag.
create or replace function public.ef_monday_notify() returns void
language plpgsql security definer set search_path = '' as $$
declare
  o record;
  r jsonb;
  b text[];
  today date := (now() at time zone 'Europe/Bucharest')::date;
begin
  for o in select id, monday_config from public.organizations where is_active loop
    if not exists (select 1 from public.jobs where organization_id = o.id and created_at > now() - interval '60 days')
       and not exists (select 1 from public.invoices where organization_id = o.id and issued_at > now() - interval '60 days') then
      continue;
    end if;
    r := public.ef_monday_report_for(o.id, today);
    b := public.ef_monday_breaches(r, o.monday_config);
    insert into public.notifications (organization_id, profile_id, type, title, body, link)
    select o.id, p.id, 'monday_report',
      case when cardinality(b) = 0 then 'Luni dimineața: totul în prag' else 'Luni dimineața: ' || cardinality(b) || (case when cardinality(b) = 1 then ' cifră peste prag' else ' cifre peste prag' end) end,
      case when cardinality(b) = 0 then 'Cifrele alese de tine sunt în pragurile setate.' else array_to_string(b, ', ') end,
      '/luni'
    from public.profiles p
    where p.organization_id = o.id and p.role = 'admin' and p.is_active;
  end loop;
end $$;
revoke all on function public.ef_monday_notify() from public, anon, authenticated;
revoke all on function public.ef_monday_breaches(jsonb, jsonb) from public, anon;

-- Luni, 05:40 UTC = 07:40 (iarna) / 08:40 (vara), ora României.
select cron.unschedule('ef-monday-report') where exists (select 1 from cron.job where jobname = 'ef-monday-report');
select cron.schedule('ef-monday-report', '40 5 * * 1', 'select public.ef_monday_notify()');
