begin;
create function private.billing_save_oblio(p_email text, p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if not private.billing_is_admin() then raise exception 'Super Admin required' using errcode='42501'; end if;
  if length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_secret is null or length(p_secret) not between 8 and 4096 then raise exception 'Invalid credentials' using errcode='22023'; end if;
  perform 1 from public.billing_company_settings where id=1 for update;
  if not found then raise exception 'Company settings required'; end if;
  select secret_id into sid from private.billing_oblio_credentials where company_id=1;
  if sid is null then sid := vault.create_secret(p_secret, null, 'ElectroField platform billing Oblio');
  else perform vault.update_secret(sid, p_secret); end if;
  insert into public.billing_oblio_connections(company_id,account_email,verified_at,enabled)
    values(1,lower(trim(p_email)),now(),true)
    on conflict(company_id) do update set account_email=excluded.account_email,verified_at=excluded.verified_at,enabled=true;
  insert into private.billing_oblio_credentials(company_id,secret_id) values(1,sid)
    on conflict(company_id) do update set secret_id=excluded.secret_id;
end $$;
revoke all on function private.billing_save_oblio(text,text) from public,anon,authenticated;
grant execute on function private.billing_save_oblio(text,text) to authenticated;
create function public.billing_save_oblio(p_email text,p_secret text)
returns void language sql security invoker set search_path='' as $$
 select private.billing_save_oblio(p_email,p_secret);
$$;
revoke all on function public.billing_save_oblio(text,text) from public,anon;
grant execute on function public.billing_save_oblio(text,text) to authenticated;

create function public.billing_client_balances(p_search text default '', p_offset integer default 0)
returns table(id uuid,name text,cui text,email text,phone text,address text,client_type text,balance text)
language sql stable security invoker set search_path='' as $$
  select c.id,c.name,c.cui,c.email,c.phone,c.address,c.client_type,
    (coalesce((select sum(i.total) from public.billing_invoices i where i.client_id=c.id and i.status='issued' and i.document_type<>'proforma'),0)
     -coalesce((select sum(p.amount) from public.billing_payments p join public.billing_invoices i on i.id=p.invoice_id where i.client_id=c.id),0))::text
  from public.billing_clients c
  where not c.archived and (p_search='' or strpos(lower(coalesce(c.name,'')),lower(p_search))>0 or strpos(lower(coalesce(c.cui,'')),lower(p_search))>0)
  order by c.name nulls last,c.id limit 26 offset greatest(0,least(p_offset,100000));
$$;
revoke all on function public.billing_client_balances(text,integer) from public,anon;
grant execute on function public.billing_client_balances(text,integer) to authenticated;
commit;
