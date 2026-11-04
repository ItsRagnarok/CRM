create function public.apply_booking_rotation(p_start date, p_end date, p_pattern jsonb)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  today date := (statement_timestamp() at time zone 'Europe/Bucharest')::date;
  first_day date;
  duration integer;
  item jsonb;
  changed integer;
begin
  if not public.ef_is_platform_admin() or public.ef_preview_org() is not null then
    raise exception 'Acces rezervat administratorului platformei.' using errcode = '42501';
  end if;
  if p_start is null or p_end is null or p_end < greatest(today, p_start)
    or p_end - p_start > 731 or p_end - today > 731 then
    raise exception 'Alege o perioadă viitoare de maximum doi ani.';
  end if;
  if jsonb_typeof(p_pattern) is distinct from 'array' or jsonb_array_length(p_pattern) <> 4 then
    raise exception 'Rotația trebuie să conțină patru zile.';
  end if;

  perform pg_advisory_xact_lock(18703, 1);
  select slot_minutes into strict duration from public.booking_settings where id = 1 for update;
  if duration not between 10 and 240 then raise exception 'Durata programării trebuie să fie între 10 și 240 de minute.'; end if;

  for item in select value from jsonb_array_elements(p_pattern) loop
    if item = 'null'::jsonb then continue; end if;
    if (item->>'from') is null or (item->>'to') is null
      or (item->>'from') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (item->>'to') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      raise exception 'Completează orele de început și de final pentru zilele disponibile.';
    end if;
    if (item->>'to')::time - (item->>'from')::time < make_interval(mins => duration) then
      raise exception 'Fiecare interval disponibil trebuie să permită cel puțin o programare.';
    end if;
  end loop;

  first_day := greatest(today, p_start);
  insert into public.booking_days (day, slots)
  select d.day, coalesce((
    select jsonb_agg(to_char(s.slot, 'HH24:MI') order by s.slot)
    from generate_series(
      d.day + (r.item->>'from')::time,
      d.day + (r.item->>'to')::time - make_interval(mins => duration),
      make_interval(mins => duration)
    ) s(slot)
  ), '[]'::jsonb)
  from (select first_day + i as day from generate_series(0, p_end - first_day) i) d
  cross join lateral (select p_pattern -> ((d.day - p_start) % 4) as item) r
  on conflict (day) do update set slots = excluded.slots;
  get diagnostics changed = row_count;

  update public.booking_settings
    set days_ahead = greatest(days_ahead, p_end - today),
        weekly = (select jsonb_object_agg(key, case when key ~ '^[0-6]$'
          then jsonb_build_object('on', false, 'from', '10:00', 'to', '19:00') else value end)
          from jsonb_each(weekly)) || jsonb_build_object('_rotation', jsonb_build_object(
            'start', p_start, 'end', p_end, 'pattern', p_pattern))
    where id = 1;
  return changed;
end $$;

revoke all on function public.apply_booking_rotation(date,date,jsonb) from public, anon;
grant execute on function public.apply_booking_rotation(date,date,jsonb) to authenticated;

create function public.validate_booking_slot()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  local_slot timestamp := new.slot_start at time zone 'Europe/Bucharest';
  today date := (statement_timestamp() at time zone 'Europe/Bucharest')::date;
  config public.booking_settings%rowtype;
  custom_slots jsonb;
  weekday jsonb;
  start_time time;
  end_time time;
begin
  perform pg_advisory_xact_lock_shared(18703, 1);
  select * into strict config from public.booking_settings where id = 1;
  if new.slot_start <= clock_timestamp() or local_slot::date > today + config.days_ahead
    or date_trunc('minute', local_slot) <> local_slot then
    raise exception 'Ora nu mai este disponibilă.' using errcode = '23514';
  end if;

  select slots into custom_slots from public.booking_days where day = local_slot::date;
  if found then
    if custom_slots ? to_char(local_slot, 'HH24:MI') then return new; end if;
  else
    weekday := config.weekly -> (extract(dow from local_slot)::integer::text);
    if weekday->>'on' = 'true' and config.slot_minutes between 10 and 240 then
      start_time := (weekday->>'from')::time;
      end_time := (weekday->>'to')::time;
      if local_slot::time >= start_time
        and local_slot::time + make_interval(mins => config.slot_minutes) <= end_time
        and mod(extract(epoch from local_slot::time - start_time), config.slot_minutes * 60) = 0 then
        return new;
      end if;
    end if;
  end if;
  raise exception 'Ora nu mai este disponibilă.' using errcode = '23514';
end $$;

create trigger validate_booking_slot before insert or update of slot_start on public.bookings
for each row execute function public.validate_booking_slot();
