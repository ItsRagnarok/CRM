-- Analitice v2 (Super Admin → Analitice): județ și oraș, sursa pe înțeles (canal), pagina de intrare,
-- timpul petrecut pe pagină, cererile de demo legate de vizită și drumul fiecărui vizitator.
-- Tot fără cookie-uri și fără IP: vizitatorul e un cod care se schimbă zilnic.

alter table public.site_events
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists kind text not null default 'view',
  add column if not exists seconds int;
alter table public.site_events drop constraint if exists site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check check (kind in ('view','lead'));
create index if not exists site_events_visitor_time on public.site_events (visitor, occurred_at);

drop function if exists public.ef_record_site_view(text, text, text, text, text, text);
create or replace function public.ef_record_site_view(
  p_path text, p_referrer_host text, p_utm_source text, p_country text, p_device text, p_visitor text,
  p_region text default null, p_city text default null, p_kind text default 'view')
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_path is null or p_path !~ '^/[A-Za-z0-9/_.-]{0,198}$' then return; end if;
  if p_visitor is null or length(p_visitor) < 16 or length(p_visitor) > 64 then return; end if;
  if (select count(*) from public.site_events where visitor = p_visitor and occurred_at > now() - interval '1 hour') >= 120 then return; end if;
  insert into public.site_events (path, referrer_host, utm_source, country, device, visitor, region, city, kind)
  values (p_path, nullif(left(p_referrer_host, 120), ''), nullif(left(p_utm_source, 60), ''),
          case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) end,
          case when p_device in ('desktop','mobile','tablet') then p_device else 'desktop' end, p_visitor,
          case when p_region ~ '^[A-Za-z0-9]{1,3}$' then upper(p_region) end,
          nullif(left(regexp_replace(coalesce(p_city, ''), '[^[:alpha:][:space:].''-]', '', 'g'), 80), ''),
          case when p_kind = 'lead' then 'lead' else 'view' end);
end $$;
revoke all on function public.ef_record_site_view(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.ef_record_site_view(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Cât a stat pe pagină: se trimite la plecare și actualizează ultima afișare a aceleiași pagini.
create or replace function public.ef_record_site_time(p_visitor text, p_path text, p_seconds int)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_visitor is null or length(p_visitor) < 16 or p_path is null or p_seconds is null or p_seconds < 1 then return; end if;
  update public.site_events e set seconds = greatest(coalesce(e.seconds, 0), least(p_seconds, 3600))
   where e.id = (select id from public.site_events where visitor = p_visitor and path = p_path and kind = 'view'
                  and occurred_at > now() - interval '3 hours' order by occurred_at desc limit 1);
end $$;
revoke all on function public.ef_record_site_time(text, text, int) from public;
grant execute on function public.ef_record_site_time(text, text, int) to anon, authenticated;

-- Sursa pe înțeles, din site-ul de unde vine și din campanie.
create or replace function public.ef_site_channel(p_referrer text, p_utm text)
returns text language sql immutable set search_path to '' as $$
  select case
    when p_utm is not null and p_utm <> '' then 'Campanie: ' || p_utm
    when p_referrer is null or p_referrer = '' then 'Direct'
    when p_referrer ~* '(^|\.)google\.' then 'Google'
    when p_referrer ~* '(^|\.)bing\.com$|(^|\.)duckduckgo\.com$|(^|\.)yahoo\.|(^|\.)yandex\.' then 'Alte motoare de căutare'
    when p_referrer ~* 'facebook\.com$|fb\.com$|fb\.me$|instagram\.com$' then 'Facebook / Instagram'
    when p_referrer ~* 'linkedin\.com$|lnkd\.in$' then 'LinkedIn'
    when p_referrer ~* 'whatsapp|wa\.me$' then 'WhatsApp'
    when p_referrer ~* 'chatgpt\.com$|openai\.com$|perplexity\.ai$|claude\.ai$|gemini\.google\.com$|copilot\.microsoft\.com$' then 'Asistenți AI'
    when p_referrer ~* 'youtube\.com$|youtu\.be$|tiktok\.com$' then 'Video (YouTube / TikTok)'
    else 'Alte site-uri: ' || p_referrer
  end
$$;

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
  firsts as (select distinct on (visitor) visitor, occurred_at, path, referrer_host, utm_source, country, region, city, device,
                    public.ef_site_channel(referrer_host, utm_source) channel
             from cur order by visitor, occurred_at),
  journeys as (
    select f.visitor, f.occurred_at first_at, f.path entry, f.channel, f.country, f.region, f.city, f.device,
           (select count(*) from cur c where c.visitor = f.visitor) pages,
           (select coalesce(sum(c.seconds), 0) from cur c where c.visitor = f.visitor) seconds,
           (select coalesce(jsonb_agg(c.path order by c.occurred_at), '[]'::jsonb) from (select path, occurred_at from cur c where c.visitor = f.visitor order by occurred_at limit 12) c) trail,
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
    'journeys', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select first_at, last_at, entry, channel, country, region, city, device, pages, seconds, trail, lead from journeys order by lead desc, last_at desc limit 30) x),
    'recent', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select occurred_at t, path, country, region, city, device, referrer_host, kind from public.site_events order by occurred_at desc limit 15) x)
  ) into result;
  return result;
end $$;
