-- Aplicată prin MCP ca „prospect_ro_firms” (vezi istoricul bazei). Universul de firme pentru prospectare.
create table if not exists public.ro_firms (
  cui text primary key check (cui ~ '^[0-9]{2,10}$'),
  caen text not null,
  employees integer not null,
  turnover numeric(16,2),
  profit numeric(16,2),
  year integer not null,
  imported_at timestamptz not null default now()
);
create index if not exists ro_firms_caen_emp on public.ro_firms (caen, employees);
alter table public.ro_firms enable row level security;
revoke all on public.ro_firms from anon;
drop policy if exists ro_firms_admin on public.ro_firms;
create policy ro_firms_admin on public.ro_firms for select to authenticated using ((select public.ef_is_platform_admin()));

create schema if not exists private;
create table if not exists private.prospect_import_tokens (token text primary key, expires_at timestamptz not null);
revoke all on private.prospect_import_tokens from anon, authenticated;

create or replace function public.prospect_import_firms(p_token text, p_rows jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if not exists (select 1 from private.prospect_import_tokens t where t.token = p_token and t.expires_at > now()) then
    raise exception 'jeton de import invalid';
  end if;
  insert into public.ro_firms (cui, caen, employees, turnover, profit, year)
  select r.cui, r.caen, r.employees, r.turnover, r.profit, r.year
  from jsonb_to_recordset(p_rows) as r(cui text, caen text, employees integer, turnover numeric, profit numeric, year integer)
  where r.cui ~ '^[0-9]{2,10}$'
  on conflict (cui) do update set caen = excluded.caen, employees = excluded.employees, turnover = excluded.turnover,
    profit = excluded.profit, year = excluded.year, imported_at = now()
    where public.ro_firms.year <= excluded.year;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.prospect_import_firms(text, jsonb) from public;
grant execute on function public.prospect_import_firms(text, jsonb) to anon, authenticated;
-- Un jeton nou (3 ore): insert into private.prospect_import_tokens values (encode(gen_random_bytes(24), 'hex'), now() + interval '3 hours');
