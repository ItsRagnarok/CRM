-- 1) Vizitele făcute de un browser controlat de un program (teste automate, roboți care imită un om:
--    navigator.webdriver = true) nu intră în statistici; se țin separat, ca să se vadă câte au fost.
create table if not exists public.site_events_automated (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  path text not null,
  country text, city text, device text, browser text
);
create index if not exists site_events_automated_at on public.site_events_automated (occurred_at desc);
alter table public.site_events_automated enable row level security;
revoke all on public.site_events_automated from anon, authenticated;

create or replace function public.ef_record_site_automated(p_path text, p_country text, p_city text, p_device text, p_browser text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_path is null or p_path !~ '^/[A-Za-z0-9/_.-]{0,198}$' then return; end if;
  if (select count(*) from public.site_events_automated where occurred_at > now() - interval '1 hour') >= 2000 then return; end if;
  insert into public.site_events_automated (path, country, city, device, browser)
  values (p_path, case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) end,
          nullif(left(regexp_replace(coalesce(p_city, ''), '[^[:alpha:][:space:].''-]', '', 'g'), 80), ''),
          case when p_device in ('desktop','mobile','tablet') then p_device else 'desktop' end,
          nullif(left(regexp_replace(coalesce(p_browser, ''), '[^[:alpha:][:space:]()-]', '', 'g'), 40), ''));
  delete from public.site_events_automated where occurred_at < now() - interval '30 days';
end $$;
revoke all on function public.ef_record_site_automated(text, text, text, text, text) from public;
grant execute on function public.ef_record_site_automated(text, text, text, text, text) to anon, authenticated;

-- 2) Cine e online acum (o afișare în ultimele 5 minute), cu tot drumul lui de azi: de unde e,
--    de unde a venit, pe ce dispozitiv, pe ce pagini a fost și cât a stat. Plus câte vizite automate au fost.
create or replace function public.ef_site_online()
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare result jsonb;
begin
  if not public.ef_is_platform_admin() then raise exception 'Fără acces' using errcode = '42501'; end if;
  with online as (
    select distinct visitor from public.site_events where occurred_at > now() - interval '5 minutes' and kind = 'view'
  ), ev as (
    select e.* from public.site_events e join online o on o.visitor = e.visitor where e.occurred_at > now() - interval '24 hours'
  ), per as (
    select visitor,
      min(occurred_at) first_at, max(occurred_at) last_at,
      (array_agg(path order by occurred_at) filter (where kind = 'view'))[1] entry,
      (array_agg(referrer_host order by occurred_at) filter (where referrer_host is not null))[1] referrer,
      (array_agg(utm_source order by occurred_at) filter (where utm_source is not null))[1] utm,
      max(country) country, max(region) region, max(city) city, max(device) device, max(os) os, max(browser) browser,
      max(model) model, max(screen) screen, max(lang) lang,
      count(*) filter (where kind = 'view') pages, coalesce(sum(seconds), 0) seconds, bool_or(kind = 'lead') lead,
      jsonb_agg(jsonb_build_object('p', path, 't', occurred_at, 's', seconds, 'k', kind) order by occurred_at) steps
    from ev group by visitor
  )
  select jsonb_build_object(
    'visitors', coalesce((select jsonb_agg(to_jsonb(per) - 'visitor' || jsonb_build_object('id', left(visitor, 6)) order by last_at desc) from per), '[]'::jsonb),
    'automated_hour', (select count(*) from public.site_events_automated where occurred_at > now() - interval '1 hour'),
    'automated_day', (select count(*) from public.site_events_automated where occurred_at > now() - interval '24 hours'),
    'automated_last', (select max(occurred_at) from public.site_events_automated)
  ) into result;
  return result;
end $$;
revoke all on function public.ef_site_online() from public, anon;
grant execute on function public.ef_site_online() to authenticated;
