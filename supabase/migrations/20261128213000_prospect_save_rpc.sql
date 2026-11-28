-- Aplicată prin MCP ca „prospect_save_rpc”. Salvarea firmelor găsite de agentul de prospectare din uneltele lui
-- (scripts/prospect/tool.mts save), cu jetonul de import din private.prospect_import_tokens. Dublurile se sar.
create or replace function public.prospect_save_companies(p_token text, p_campaign uuid, p_run uuid, p_companies jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n_ins integer; n_people integer; n_src integer;
begin
  if not exists (select 1 from private.prospect_import_tokens t where t.token = p_token and t.expires_at > now()) then
    raise exception 'jeton de import invalid';
  end if;
  if not exists (select 1 from public.prospect_campaigns c where c.id = p_campaign) then raise exception 'campanie inexistentă'; end if;
  create temp table src on commit drop as
    select x.* from jsonb_to_recordset(p_companies) as x(name text, cui text, website text, host text, description text, county text, city text, address text,
      phone text, caen text, employees integer, turnover numeric, profit numeric, fin_year integer, reg_date date, fit_score integer, fit_reason text,
      signals text[], emails jsonb, mx boolean, source text, source_detail text, people jsonb)
    where coalesce(trim(x.name), '') <> '';
  select count(*) into n_src from src;
  create temp table ins on commit drop as select null::uuid id, null::text cui, null::text host limit 0;
  with i as (
    insert into public.prospect_companies (campaign_id, run_id, name, cui, website, host, description, county, city, address, phone, caen, employees, turnover, profit,
      fin_year, reg_date, fit_score, fit_reason, signals, emails, mx, source, source_detail)
    select p_campaign, p_run, left(name, 200), case when cui ~ '^[0-9]{2,10}$' then cui end, left(website, 300), lower(host), left(description, 1500), county, city, address, left(phone, 40),
      caen, employees, turnover, profit, fin_year, reg_date, greatest(0, least(100, fit_score)), left(fit_reason, 1500), coalesce(signals, '{}'), coalesce(emails, '[]'::jsonb), mx,
      case when source in ('anre','cautare','onrc','manual','altul') then source else 'altul' end, left(source_detail, 500)
    from src
    on conflict do nothing returning id, cui, host)
  insert into ins select * from i;
  select count(*) into n_ins from ins;
  with p as (
    insert into public.prospect_people (company_id, name, role, email, email_status, linkedin, source_url)
    select ins.id, left(pp.name, 160), left(pp.role, 160), left(pp.email, 160),
      case when pp.email_status in ('pe_site','ghicit') then pp.email_status when pp.email is not null then 'pe_site' else 'lipsa' end, left(pp.linkedin, 300), left(pp.source_url, 500)
    from ins join src on (ins.cui is not null and ins.cui = src.cui) or (ins.cui is null and ins.host is not null and ins.host = lower(src.host))
    cross join lateral jsonb_to_recordset(coalesce(src.people, '[]'::jsonb)) as pp(name text, role text, email text, email_status text, linkedin text, source_url text)
    where coalesce(trim(pp.name), '') <> '' returning 1)
  select count(*) into n_people from p;
  return jsonb_build_object('firme_salvate', n_ins, 'dubluri_sarite', n_src - n_ins, 'oameni', n_people);
end $$;
revoke all on function public.prospect_save_companies(text, uuid, uuid, jsonb) from public;
grant execute on function public.prospect_save_companies(text, uuid, uuid, jsonb) to anon, authenticated;
