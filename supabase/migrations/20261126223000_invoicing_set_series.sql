-- Seriile pentru proforme și chitanțe (opționale), salvate de administrator lângă conexiunea de facturare.
create or replace function public.invoicing_set_series(p_proforma text, p_receipt text) returns void
language plpgsql security definer set search_path to '' as $$
declare org uuid := public.current_org_id();
begin
  if org is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Doar administratorul poate schimba seriile' using errcode = '42501';
  end if;
  update public.invoicing_connections
     set proforma_series = nullif(left(trim(coalesce(p_proforma, '')), 20), ''),
         receipt_series = nullif(left(trim(coalesce(p_receipt, '')), 20), ''),
         updated_at = now()
   where organization_id = org;
end $$;
revoke all on function public.invoicing_set_series(text, text) from public, anon;
grant execute on function public.invoicing_set_series(text, text) to authenticated;
