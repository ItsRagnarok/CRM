-- Analitice: analiză automată și recomandări (Super Admin → Analitice).
-- ef_site_stats primește și perioada „1h” (ultima oră) și numără programările făcute în perioadă.
-- site_insights păstrează fiecare analiză (cifrele, recomandările din reguli și cele de la AI) și ce a fost aplicat.

create table if not exists public.site_insights (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('1h', '24h', '7d', '30d')),
  created_at timestamptz not null default now(),
  created_by uuid,
  summary jsonb not null default '{}'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  ai jsonb,
  ai_model text,
  ai_error text,
  applied jsonb not null default '[]'::jsonb
);
create index if not exists site_insights_created on public.site_insights (created_at desc);
alter table public.site_insights enable row level security;
revoke all on public.site_insights from anon;
create policy site_insights_admin on public.site_insights for all to authenticated
  using (public.ef_is_platform_admin()) with check (public.ef_is_platform_admin());

create or replace function public.ef_site_stats(p_period text default '24h', p_from date default null, p_to date default null)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare
  tz constant text := 'Europe/Bucharest';
  since timestamptz; until_ts timestamptz; prev_since timestamptz; span interval; daily boolean; result jsonb;
  today_start timestamptz := date_trunc('day', now() at time zone tz) at time zone tz;
begin
  if not public.ef_is_platform_admin() then raise exception 'Fără acces' using errcode = '42501'; end if;
  if p_period = 'custom' then
    if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 365 then raise exception 'Interval invalid' using errcode = '22023'; end if;
    since := p_from::timestamp at time zone tz;
    until_ts := least((p_to + 1)::timestamp at time zone tz, now());
    if until_ts <= since then until_ts := since + interval '1 hour'; end if;
  elsif p_period = '1h' then since := now() - interval '1 hour'; until_ts := now();
  elsif p_period = 'today' then since := today_start; until_ts := now();
  elsif p_period = 'yesterday' then since := today_start - interval '1 day'; until_ts := today_start;
  elsif p_period = '7d' then since := now() - interval '7 days'; until_ts := now();
  elsif p_period = '30d' then since := now() - interval '30 days'; until_ts := now();
  else since := now() - interval '24 hours'; until_ts := now();
  end if;
  span := until_ts - since;
  prev_since := since - span;
  daily := span > interval '48 hours';
  with ev as (select * from public.site_events where occurred_at >= since and occurred_at < until_ts),
  cur as (select * from ev where kind = 'view'),
  prev as (select * from public.site_events where occurred_at >= prev_since and occurred_at < since and kind = 'view'),
  per_visitor as (select visitor, count(*) n from cur group by visitor),
  -- Prima afișare a fiecărui vizitator în perioadă: pagina de intrare și sursa.
  firsts as (select distinct on (visitor) visitor, occurred_at, path, referrer_host, utm_source, country, region, city, device, os, browser, model, screen,
                    public.ef_site_channel(referrer_host, utm_source) channel
             from cur order by visitor, occurred_at),
  journeys as (
    select f.visitor, f.occurred_at first_at, f.path entry, f.channel, f.country, f.region, f.city, f.device, f.os, f.browser, f.model, f.screen,
           (select count(*) from cur c where c.visitor = f.visitor) pages,
           (select coalesce(sum(c.seconds), 0) from cur c where c.visitor = f.visitor) seconds,
           (select coalesce(jsonb_agg(jsonb_build_object('p', c.path, 's', c.seconds, 't', c.occurred_at) order by c.occurred_at), '[]'::jsonb) from (select path, occurred_at, seconds from cur c where c.visitor = f.visitor order by occurred_at limit 20) c) steps,
           exists (select 1 from ev l where l.visitor = f.visitor and l.kind = 'lead') lead,
           (select max(c.occurred_at) from ev c where c.visitor = f.visitor) last_at
    from firsts f)
  select jsonb_build_object(
    'online', (select count(distinct visitor) from public.site_events where occurred_at > now() - interval '5 minutes' and kind = 'view'),
    'last30', (select coalesce(jsonb_agg(jsonb_build_object('t', g, 'views', coalesce(c.n, 0)) order by g), '[]'::jsonb)
               from generate_series(date_trunc('minute', now()) - interval '29 minutes', date_trunc('minute', now()), interval '1 minute') g
               left join (select date_trunc('minute', occurred_at) m, count(*) n from public.site_events where occurred_at > now() - interval '30 minutes' and kind = 'view' group by 1) c on c.m = g),
    'visitors', (select count(*) from per_visitor),
    'views', (select count(*) from cur),
    'bounce', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where n = 1) / count(*)) end from per_visitor),
    'avg_seconds', (select round(avg(s)) from (select sum(seconds) s from cur where seconds is not null group by visitor) x),
    'leads_count', (select count(*) from ev where kind = 'lead'),
    'bookings', (select count(*) from public.bookings b where b.created_at >= since and b.created_at < until_ts),
    'prev_visitors', (select count(distinct visitor) from prev),
    'prev_views', (select count(*) from prev),
    'daily', daily,
    'from', since,
    'to', until_ts,
    'series', (select coalesce(jsonb_agg(jsonb_build_object('t', g, 'views', coalesce(c.views, 0), 'visitors', coalesce(c.visitors, 0)) order by g), '[]'::jsonb)
               from generate_series(
                      case when daily then date_trunc('day', since at time zone tz) at time zone tz else date_trunc('hour', since) end,
                      case when daily then date_trunc('day', (until_ts - interval '1 second') at time zone tz) at time zone tz else date_trunc('hour', until_ts - interval '1 second') end,
                      case when daily then interval '1 day' else interval '1 hour' end) g
               left join (select case when daily then date_trunc('day', occurred_at at time zone tz) at time zone tz else date_trunc('hour', occurred_at) end b,
                                 count(*) views, count(distinct visitor) visitors from cur group by 1) c on c.b = g),
    'pages', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select path, count(distinct visitor) visitors, count(*) views, round(avg(seconds)) avg_seconds from cur group by path order by 2 desc, 3 desc limit 12) x),
    'entries', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select path, count(*) visitors from firsts group by path order by 2 desc limit 10) x),
    'channels', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select channel name, count(*) visitors, count(*) filter (where lead) leads from journeys group by 1 order by 2 desc limit 12) x),
    'referrers', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(referrer_host, 'Direct') name, count(distinct visitor) visitors from cur group by 1 order by 2 desc limit 8) x),
    'sources', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select utm_source name, count(distinct visitor) visitors from cur where utm_source is not null group by 1 order by 2 desc limit 8) x),
    'countries', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(country, '??') code, count(distinct visitor) visitors from cur group by 1 order by 2 desc limit 8) x),
    'regions', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select country, region, count(*) visitors from firsts where region is not null group by 1, 2 order by 3 desc limit 15) x),
    'cities', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select country, region, city, count(*) visitors from firsts where city is not null group by 1, 2, 3 order by 4 desc limit 12) x),
    'devices', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select device name, count(distinct visitor) visitors from cur group by 1 order by 2 desc) x),
    'systems', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(os, 'Necunoscut') name, count(*) visitors from firsts group by 1 order by 2 desc limit 10) x),
    'models', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(model, 'Necunoscut') name, count(*) visitors from firsts group by 1 order by 2 desc limit 12) x),
    'browsers', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(browser, 'Necunoscut') name, count(*) visitors from firsts group by 1 order by 2 desc limit 10) x),
    'journeys', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select first_at, last_at, entry, channel, country, region, city, device, os, browser, model, screen, pages, seconds, steps, (select coalesce(jsonb_agg(e->>'p'), '[]'::jsonb) from jsonb_array_elements(steps) e) trail, lead from journeys order by lead desc, last_at desc limit 40) x),
    'recent', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select occurred_at t, path, country, region, city, device, model, referrer_host, kind from public.site_events order by occurred_at desc limit 15) x)
  ) into result;
  return result;
end $$;
