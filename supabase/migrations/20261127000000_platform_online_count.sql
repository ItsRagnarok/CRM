-- Câți oameni sunt conectați acum pe ElectroField (toate firmele, web și telefon): sesiuni care au
-- trimis semn de viață în ultimele 2 minute. Doar un număr, fără nume sau firme.
create or replace function public.ef_platform_online_count()
returns integer language sql stable security definer set search_path to '' as $$
  select count(distinct profile_id)::integer from public.platform_usage_sessions
   where last_seen_at > now() - interval '2 minutes' and ended_at is null;
$$;
revoke all on function public.ef_platform_online_count() from public, anon;
grant execute on function public.ef_platform_online_count() to authenticated;
