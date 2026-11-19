begin;
create table public.billing_oblio_documents (
 id uuid primary key default gen_random_uuid(), provider_id text not null unique,
 client_id uuid not null references public.billing_clients(id),
 series text not null, number text not null, currency text not null,
 issue_date date not null,due_date date not null,total numeric(18,2) not null,
 subtotal numeric(18,2),vat_total numeric(18,2),paid numeric(18,2) not null default 0,
 canceled boolean not null default false, raw jsonb not null, synced_at timestamptz not null default now(),
 unique(series,number)
);
create index billing_oblio_documents_client on public.billing_oblio_documents(client_id);
create table public.billing_oblio_sync_state (
 id smallint primary key default 1 check(id=1), phase text not null default 'clients', page_offset integer not null default 0,
 run_key uuid not null default gen_random_uuid(), completed_at timestamptz, updated_at timestamptz not null default now(),
 clients_seen integer not null default 0,documents_seen integer not null default 0,
 check(phase in ('clients','invoices','done'))
);
alter table public.billing_oblio_documents enable row level security;
alter table public.billing_oblio_sync_state enable row level security;
revoke all on public.billing_oblio_documents,public.billing_oblio_sync_state from public,anon,authenticated;
grant select on public.billing_oblio_documents,public.billing_oblio_sync_state to authenticated;
create policy billing_admin_only on public.billing_oblio_documents for select to authenticated using ((select private.billing_is_admin()));
create policy billing_admin_only on public.billing_oblio_sync_state for select to authenticated using ((select private.billing_is_admin()));

create function private.billing_import_client(c jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; taxid text:=nullif(trim(c->>'cif'),'');
begin
 if not private.billing_is_admin() then raise exception 'Acces interzis' using errcode='42501'; end if;
 if taxid is not null then
  select id into target from public.billing_clients where regexp_replace(upper(cui),'^RO','')=regexp_replace(upper(taxid),'^RO','') order by created_at limit 1;
 else
  select id into target from public.billing_clients where cui is null and name=c->>'name' and coalesce(email,'')=coalesce(c->>'email','') and coalesce(address,'')=coalesce(c->>'address','') order by created_at limit 1;
 end if;
 if target is null then
  insert into public.billing_clients(client_type,name,cui,email,phone,address,city,county,country,registration_number,vat_payer)
  values(case when taxid is null then 'person' else 'company' end,coalesce(nullif(c->>'name',''),taxid,'Client Oblio'),taxid,nullif(c->>'email',''),nullif(c->>'phone',''),nullif(c->>'address',''),nullif(c->>'city',''),nullif(c->>'state',''),coalesce(nullif(c->>'country',''),'Romania'),nullif(c->>'rc',''),coalesce(c->>'vatPayer','0') in ('true','1')) returning id into target;
 end if;
 return target;
end $$;
revoke all on function private.billing_import_client(jsonb) from public,anon,authenticated;

create function public.billing_sync(operation text,input jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.billing_oblio_sync_state; d jsonb; cid uuid; net numeric; vat numeric; gross numeric; p jsonb; amount numeric; qty numeric; price numeric; rate numeric; included boolean; valid boolean; n integer;
begin
 if not private.billing_is_admin() then raise exception 'Acces interzis' using errcode='42501'; end if;
 perform 1 from public.billing_company_settings where id=1 for update;
 if operation='begin' then
  if not exists(select from public.billing_oblio_connections where enabled and company_id=1) then raise exception 'Conectează Oblio în Setări.'; end if;
  insert into public.billing_oblio_sync_state(id) values(1) on conflict do nothing;
  select * into s from public.billing_oblio_sync_state where id=1 for update;
  if s.phase='done' and ((input->>'force')='true' or s.completed_at<now()-interval '15 minutes') then
   update public.billing_oblio_sync_state set phase='clients',page_offset=0,run_key=gen_random_uuid(),clients_seen=0,documents_seen=0,updated_at=now() where id=1 returning * into s;
  end if;
  return to_jsonb(s);
 end if;
 select * into s from public.billing_oblio_sync_state where id=1 for update;
 if operation='status' then return to_jsonb(s); end if;
 if operation<>'apply' or s.run_key::text is distinct from input->>'key' or s.phase is distinct from input->>'phase' or s.page_offset is distinct from (input->>'offset')::integer then raise exception 'Sincronizarea a avansat. Reîncearcă.'; end if;
 if jsonb_typeof(input->'rows') is distinct from 'array' or jsonb_array_length(input->'rows')>250 then raise exception 'Pagina Oblio nu este validă.'; end if;
 n:=jsonb_array_length(input->'rows');
 for d in select value from jsonb_array_elements(input->'rows') loop
  if s.phase='clients' then perform private.billing_import_client(d);
  elsif s.phase='invoices' then
   if coalesce(d->>'draft','0') in ('1','true') then continue; end if;
   if nullif(d->>'id','') is null or nullif(d->>'seriesName','') is null or nullif(d->>'number','') is null or d->>'total' !~ '^-?[0-9]+(\.[0-9]+)?$' then raise exception 'Oblio a returnat o factură incompletă. Importul paginii a fost oprit.'; end if;
   cid:=private.billing_import_client(d->'client');
   net:=0;vat:=0;valid:=jsonb_typeof(d->'products')='array' and jsonb_array_length(d->'products')>0;
   if valid then
    for p in select value from jsonb_array_elements(d->'products') loop
     if p->>'quantity' is null or p->>'price' is null or p->>'vatPercentage' is null then valid:=false;exit; end if;
     qty:=(p->>'quantity')::numeric;price:=(p->>'price')::numeric;rate:=(p->>'vatPercentage')::numeric;
     included:=coalesce(p->>'vatIncluded','1') in ('1','true');
     amount:=round(qty*price/(case when included then 1+rate/100 else 1 end),2);
     net:=net+amount;vat:=vat+round(amount*rate/100,2);
    end loop;
   end if;
   gross:=round((d->>'total')::numeric,2);
   if valid is not true or abs(net+vat-gross)>0.01 then net:=null;vat:=null; end if;
   insert into public.billing_oblio_documents(provider_id,client_id,series,number,currency,issue_date,due_date,total,subtotal,vat_total,paid,canceled,raw)
   values(d->>'id',cid,d->>'seriesName',d->>'number',coalesce(d->>'currency','RON'),(d->>'issueDate')::date,coalesce(nullif(d->>'dueDate','')::date,(d->>'issueDate')::date),gross,net,vat,
    coalesce((select sum((c->>'value')::numeric) from jsonb_array_elements(coalesce(d->'collects','[]')) c),0),coalesce(d->>'canceled','0') in ('true','1'),d)
   on conflict(provider_id) do update set client_id=excluded.client_id,currency=excluded.currency,issue_date=excluded.issue_date,due_date=excluded.due_date,total=excluded.total,subtotal=excluded.subtotal,vat_total=excluded.vat_total,paid=excluded.paid,canceled=excluded.canceled,raw=excluded.raw,synced_at=now();
  end if;
 end loop;
 if s.phase='clients' then
  update public.billing_oblio_sync_state set clients_seen=clients_seen+n,page_offset=case when n<250 then 0 else page_offset+250 end,phase=case when n<250 then 'invoices' else 'clients' end,updated_at=now() where id=1;
 else
  update public.billing_oblio_sync_state set documents_seen=documents_seen+n,page_offset=page_offset+100,phase=case when n<100 then 'done' else 'invoices' end,completed_at=case when n<100 then now() else completed_at end,updated_at=now() where id=1;
 end if;
 return (select to_jsonb(t) from public.billing_oblio_sync_state t where id=1);
end $$;
revoke all on function public.billing_sync(text,jsonb) from public,anon;
grant execute on function public.billing_sync(text,jsonb) to authenticated;

create or replace view public.billing_invoice_overview with (security_invoker = true) as
select i.id,i.client_id,i.document_type,i.original_invoice_id,i.status,i.issue_date,i.due_date,
 i.provider_series,i.provider_number,i.provider_url,i.created_at,
 coalesce(i.client_snapshot->>'name',c.name,c.cui,'Client') as client_name,
 coalesce(i.client_snapshot->>'email',c.email) as client_email,
 i.total::text as total, i.subtotal::text as subtotal,i.vat_total::text as vat_total,
 coalesce(p.paid,0)::text as paid,
 (case when credited.n>0 then 0 when i.document_type='credit_note' then i.total-coalesce(p.paid,0)+greatest(coalesce(original.total,0)-coalesce(op.paid,0),0) else i.total-coalesce(p.paid,0) end)::numeric(18,2)::text as balance,
 case when i.status='draft' then 'draft' when i.status='pending' then 'pending'
 when i.document_type='proforma' then 'proforma'
 when i.document_type='credit_note' then 'credit_note'
 when credited.n>0 then 'credit_note' when (case when credited.n>0 then 0 when i.document_type='credit_note' then i.total-coalesce(p.paid,0)+greatest(coalesce(original.total,0)-coalesce(op.paid,0),0) else i.total-coalesce(p.paid,0) end)<=0 then 'paid'
 when i.due_date < (now() at time zone 'Europe/Bucharest')::date then 'overdue'
 else 'outstanding' end as payment_status,
 coalesce(d.email_status,'not_sent') as email_status,i.currency
from public.billing_invoices i join public.billing_clients c on c.id=i.client_id
left join lateral (select sum(amount) paid from public.billing_payments where invoice_id=i.id) p on true
left join public.billing_invoice_delivery d on d.invoice_id=i.id
left join public.billing_invoices original on original.id=i.original_invoice_id
left join lateral (select sum(amount) paid from public.billing_payments where invoice_id=original.id) op on true
left join lateral (select count(*) n from public.billing_invoices where original_invoice_id=i.id and status='issued') credited on true
union all
select r.id,r.client_id,case when r.total<0 then 'credit_note' else 'invoice' end,null::uuid,'issued',r.issue_date,r.due_date,
 r.series,r.number,r.raw->>'link',r.issue_date::timestamptz,
 coalesce(r.raw->'client'->>'name','Client Oblio'),r.raw->'client'->>'email',
 r.total::text,r.subtotal::text,r.vat_total::text,r.paid::text,(r.total-r.paid)::numeric(18,2)::text,
 case when r.canceled then 'canceled' when r.total<0 then 'credit_note' when r.total-r.paid<=0 then 'paid' when r.due_date<(now() at time zone 'Europe/Bucharest')::date then 'overdue' else 'outstanding' end,
 'not_sent',r.currency
from public.billing_oblio_documents r
where not exists(select 1 from public.billing_invoices i where i.status='issued' and i.document_type<>'proforma' and i.provider_series=r.series and ltrim(i.provider_number,'0')=ltrim(r.number,'0'));

create or replace function public.billing_workflow(operation text, input jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 doc public.billing_invoices; c public.billing_clients; company public.billing_company_settings;
 req public.billing_issue_requests; s public.billing_series; original public.billing_invoices;
 target uuid; line jsonb; pos integer := 0; payload jsonb; result jsonb; secret text;
 today date := (now() at time zone 'Europe/Bucharest')::date;
begin
 if not private.billing_is_admin() then raise exception 'Acces interzis.' using errcode='42501'; end if;
 if operation='detail' and exists(select from public.billing_oblio_documents where id=(input->>'id')::uuid) then
   return (select to_jsonb(v)||jsonb_build_object('imported',true,'vat_known',r.vat_total is not null,'series_id',null,'notes',r.raw->>'mentions','company','{}'::jsonb,
    'client',r.raw->'client'||jsonb_build_object('cui',r.raw->'client'->>'cif'),'lines','[]'::jsonb,
    'payments',(select coalesce(jsonb_agg(jsonb_build_object('id',ord,'amount',(collection.item->>'value')::numeric(18,2)::text,'paid_on',collection.item->>'issueDate','method',collection.item->>'type')),'[]') from jsonb_array_elements(coalesce(r.raw->'collects','[]')) with ordinality as collection(item,ord)))
    from public.billing_oblio_documents r join public.billing_invoice_overview v on v.id=r.id where r.id=(input->>'id')::uuid);
 elsif operation = 'credentials' then
   select v.decrypted_secret into secret from private.billing_oblio_credentials k
   join vault.decrypted_secrets v on v.id=k.secret_id
   join public.billing_oblio_connections o on o.company_id=k.company_id and o.enabled where k.company_id=1;
   if secret is null then raise exception 'Conectează contul Oblio în Setări.'; end if;
   return jsonb_build_object('secret',secret,'email',(select account_email from public.billing_oblio_connections where company_id=1));
 elsif operation = 'save_draft' then
   target := coalesce(nullif(input->>'id','')::uuid,gen_random_uuid());
   select * into doc from public.billing_invoices where id=target for update;
   if found and doc.status<>'draft' then raise exception 'Documentul nu mai poate fi editat.'; end if;
   if input->>'kind' not in ('invoice','proforma') then raise exception 'Tip document invalid.'; end if;
   if jsonb_typeof(input->'lines') is distinct from 'array' or jsonb_array_length(input->'lines') not between 1 and 100 then raise exception 'Adaugă între 1 și 100 de linii.'; end if;
   insert into public.billing_invoices(id,client_id,series_id,document_type,issue_date,due_date,notes)
   values(target,(input->>'clientId')::uuid,nullif(input->>'seriesId','')::uuid,input->>'kind',(input->>'date')::date,(input->>'due')::date,left(input->>'notes',2000))
   on conflict(id) do update set client_id=excluded.client_id,series_id=excluded.series_id,issue_date=excluded.issue_date,due_date=excluded.due_date,notes=excluded.notes;
   delete from public.billing_invoice_lines where invoice_id=target;
   for line in select value from jsonb_array_elements(input->'lines') loop
     pos:=pos+1;
     if (line->>'quantity') !~ '^\d{1,8}(\.\d{1,4})?$' or (line->>'price') !~ '^\d{1,10}(\.\d{1,4})?$' or (line->>'vat') !~ '^\d{1,3}(\.\d{1,2})?$' then raise exception 'Cantitatea, prețul sau TVA-ul nu sunt valide.'; end if;
     insert into public.billing_invoice_lines(invoice_id,position,name,unit,is_service,quantity,unit_price,vat_rate)
     values(target,pos,left(trim(line->>'name'),300),coalesce(nullif(trim(line->>'unit'),''),'buc'),coalesce((line->>'service')::boolean,true),(line->>'quantity')::numeric,(line->>'price')::numeric,(line->>'vat')::numeric);
   end loop;
   return jsonb_build_object('id',target);
 elsif operation='credit' then
   select * into original from public.billing_invoices where id=(input->>'id')::uuid for update;
   if not found or original.status<>'issued' or original.document_type<>'invoice' then raise exception 'Alege o factură emisă pentru stornare.'; end if;
   if exists(select from public.billing_invoices where original_invoice_id=original.id) then raise exception 'Există deja o stornare pentru această factură.'; end if;
   select * into s from public.billing_series where company_id=1 and document_type='credit_note' and active order by name limit 1;
   if not found then raise exception 'Sincronizează seriile Oblio în Setări.'; end if;
   insert into public.billing_invoices(client_id,series_id,document_type,original_invoice_id,issue_date,due_date,notes)
   values(original.client_id,s.id,'credit_note',original.id,today,today,'Stornare integrală '||original.provider_series||' '||original.provider_number) returning * into doc;
   insert into public.billing_invoice_lines(invoice_id,position,name,unit,is_service,quantity,unit_price,vat_rate)
   select doc.id,position,name,unit,is_service,-quantity,unit_price,vat_rate from public.billing_invoice_lines where invoice_id=original.id;
   return jsonb_build_object('id',doc.id);
 elsif operation='prepare' then
   select * into doc from public.billing_invoices where id=(input->>'id')::uuid for update;
   if not found then raise exception 'Factura nu există.'; end if;
   if doc.status='issued' then return jsonb_build_object('issued',true); end if;
   select * into req from public.billing_issue_requests where invoice_id=doc.id for update;
   if found then
     if req.status='rejected' then raise exception 'Oblio a refuzat documentul. Verifică datele și creează o ciornă corectată.'; end if;
     if req.status='sending' and req.updated_at>now()-interval '2 minutes' then raise exception 'Emiterea este deja în curs. Verifică din nou peste două minute.'; end if;
     update public.billing_issue_requests set status='sending',updated_at=now() where id=req.id;
     return jsonb_build_object('payload',req.request_payload,'kind',doc.document_type);
   end if;
   select * into company from public.billing_company_settings where id=doc.company_id;
   select * into c from public.billing_clients where id=doc.client_id;
   select * into s from public.billing_series where id=doc.series_id and active;
   if s.id is null then raise exception 'Alege o serie activă din Oblio.'; end if;
   if nullif(trim(c.name),'') is null or nullif(trim(c.address),'') is null then raise exception 'Completează denumirea și adresa clientului înainte de emitere.'; end if;
   if input->>'sendEmail'='true' and nullif(c.email,'') is null then raise exception 'Completează e-mailul clientului sau alege «Emite fără e-mail».'; end if;
   if not company.vat_payer and exists(select from public.billing_invoice_lines where invoice_id=doc.id and vat_rate<>0) then raise exception 'Firma este neplătitoare de TVA. Folosește cota 0%%.'; end if;
   if not exists(select from public.billing_oblio_connections where company_id=1 and enabled) then raise exception 'Conectează contul Oblio în Setări.'; end if;
   if exists(select from public.billing_invoice_lines where invoice_id=doc.id and nullif(input->'vatNames'->>vat_rate::text,'') is null) then raise exception 'O cotă TVA nu există în contul Oblio. Verifică Setări → Cote TVA în Oblio.'; end if;
   if doc.document_type='credit_note' then
     select * into original from public.billing_invoices where id=doc.original_invoice_id;
   end if;
   update public.billing_invoices set status='pending',
     company_snapshot=case when doc.document_type='credit_note' then original.company_snapshot else to_jsonb(company)||jsonb_build_object('banks',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.billing_bank_accounts b where company_id=1)) end,
     client_snapshot=case when doc.document_type='credit_note' then original.client_snapshot else to_jsonb(c) end
   where id=doc.id returning * into doc;
   payload:=jsonb_build_object('cif',doc.company_snapshot->>'cui',
     'client',jsonb_build_object('name',doc.client_snapshot->>'name','cif',coalesce(doc.client_snapshot->>'cui',''),
       'rc',coalesce(doc.client_snapshot->>'registration_number',''),'address',doc.client_snapshot->>'address',
       'state',coalesce(doc.client_snapshot->>'county',''),'city',coalesce(doc.client_snapshot->>'city',''),
       'country',coalesce(doc.client_snapshot->>'country','Romania'),'email',coalesce(doc.client_snapshot->>'email',''),
       'phone',coalesce(doc.client_snapshot->>'phone',''),'vatPayer',case when (doc.client_snapshot->>'vat_payer')::boolean then 1 else 0 end,'save',0),
     'issueDate',doc.issue_date,'dueDate',doc.due_date,'seriesName',s.name,'currency',doc.currency,
     'precision',2,'useStock',0,'sendEmail',case when input->>'sendEmail'='true' then 1 else 0 end,
     'mentions',coalesce(doc.notes,''),'internalNote','ElectroField '||doc.id::text,'idempotencyKey',gen_random_uuid()::text,
     'products',(select jsonb_agg(jsonb_build_object('name',name,'measuringUnit',unit,'quantity',quantity::text,'price',unit_price::text,
       'vatPercentage',vat_rate::text,'vatName',input->'vatNames'->>vat_rate::text,'vatIncluded',0,
       'productType',case when is_service then 'Serviciu' else 'Marfa' end,'save',0) order by position) from public.billing_invoice_lines where invoice_id=doc.id));
   if doc.document_type='credit_note' then
     payload:=payload||jsonb_build_object('referenceDocument',jsonb_build_object('type','Factura','refund',0,'seriesName',original.provider_series,'number',original.provider_number));
   end if;
   insert into public.billing_issue_requests(invoice_id,status,request_payload,request_fingerprint)
   values(doc.id,'sending',payload,encode(sha256(convert_to(payload::text,'UTF8')),'hex'));
   insert into public.billing_invoice_delivery(invoice_id) values(doc.id);
   return jsonb_build_object('payload',payload,'kind',doc.document_type);
 elsif operation='confirm' then
   select * into doc from public.billing_invoices where id=(input->>'id')::uuid for update;
   if doc.status='issued' then return jsonb_build_object('id',doc.id); end if;
   select * into req from public.billing_issue_requests where invoice_id=doc.id for update;
   if doc.status<>'pending' or req.id is null then raise exception 'Nu există cerere de emitere.'; end if;
   if nullif(input->>'number','') is null or input->>'series' is distinct from req.request_payload->>'seriesName' then raise exception 'Răspunsul Oblio nu corespunde seriei solicitate.'; end if;
   update public.billing_invoices set status='issued',issued_at=now(),provider_series=input->>'series',provider_number=input->>'number',provider_url=input->>'url' where id=doc.id;
   update public.billing_issue_requests set status='confirmed',provider_reference=input-'id',updated_at=now() where id=req.id;
   -- Oblio confirms document issuance, not email delivery. Never show "sent" without a receipt.
   update public.billing_invoice_delivery set email_status=case when req.request_payload->>'sendEmail'='1' then 'unknown' else 'not_sent' end where invoice_id=doc.id;
   return jsonb_build_object('id',doc.id);
 elsif operation='reject' then
   update public.billing_issue_requests set status='rejected',error_code='provider_rejected',updated_at=now() where invoice_id=(input->>'id')::uuid and status<>'confirmed';
   return '{}';
 elsif operation='correct_rejected' then
   select * into doc from public.billing_invoices where id=(input->>'id')::uuid for update;
   if doc.status<>'pending' or not exists(select from public.billing_issue_requests where invoice_id=doc.id and status='rejected') then raise exception 'Emiterea trebuie confirmată înainte de modificare.'; end if;
   update public.billing_invoices set status='draft',company_snapshot=null,client_snapshot=null where id=doc.id;
   delete from public.billing_issue_requests where invoice_id=doc.id;
   delete from public.billing_invoice_delivery where invoice_id=doc.id;
   return jsonb_build_object('id',doc.id);
 elsif operation='uncertain' then
   update public.billing_issue_requests set status='unknown',error_code='provider_unconfirmed',updated_at=now() where invoice_id=(input->>'id')::uuid and status<>'confirmed';
   return '{}';
 elsif operation='detail' then
   select * into doc from public.billing_invoices where id=(input->>'id')::uuid;
   if not found then return null; end if;
   select to_jsonb(v) into result from public.billing_invoice_overview v where id=doc.id;
   return result||jsonb_build_object('request_status',(select status from public.billing_issue_requests where invoice_id=doc.id),'series_id',doc.series_id,'notes',doc.notes,
    'company',coalesce(doc.company_snapshot,(select to_jsonb(t) from public.billing_company_settings t where id=1)),
    'client',coalesce(doc.client_snapshot,(select to_jsonb(t) from public.billing_clients t where id=doc.client_id)),
    'lines',(select coalesce(jsonb_agg(to_jsonb(l)||jsonb_build_object('quantity',quantity::text,'unit_price',unit_price::text,'vat_rate',vat_rate::text,'net_amount',net_amount::text,'vat_amount',vat_amount::text) order by position),'[]') from public.billing_invoice_lines l where invoice_id=doc.id),
    'payments',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('amount',amount::text) order by paid_on desc),'[]') from public.billing_payments p where invoice_id=doc.id));
 elsif operation='list' then
   select coalesce(jsonb_agg(to_jsonb(v)),'[]') into result from (
     select * from public.billing_invoice_overview
     where (coalesce(input->>'q','')='' or strpos(lower(client_name||' '||coalesce(provider_series,'')||' '||coalesce(provider_number,'')),lower(left(input->>'q',100)))>0)
       and (coalesce(input->>'filter','all')='all' or payment_status=input->>'filter' or (input->>'filter'='outstanding' and payment_status='overdue'))
       and (coalesce(input->>'month','')='' or to_char(issue_date,'YYYY-MM')=input->>'month')
     order by issue_date desc,created_at desc limit least(greatest(coalesce((input->>'limit')::integer,26),1),1001)
     offset least(greatest(coalesce((input->>'offset')::integer,0),0),100000)
   ) v;
   return result;
 elsif operation='export' then
   if (select count(*) from public.billing_invoice_overview where status='issued' and payment_status<>'canceled' and document_type<>'proforma' and to_char(issue_date,'YYYY-MM')=input->>'month')>1000 then raise exception 'Exportul depășește 1.000 de documente.'; end if;
   return (select coalesce(jsonb_agg(public.billing_workflow('detail',jsonb_build_object('id',id)) order by issue_date,created_at),'[]') from public.billing_invoice_overview where status='issued' and payment_status<>'canceled' and document_type<>'proforma' and to_char(issue_date,'YYYY-MM')=input->>'month');
 elsif operation='dashboard' then
   return jsonb_build_object(
    'collected',((select coalesce(sum(amount),0) from public.billing_payments where paid_on>=date_trunc('month',today)::date and paid_on<date_trunc('month',today)::date+interval '1 month')+
    (select coalesce(sum((collection.item->>'value')::numeric),0) from public.billing_oblio_documents r join public.billing_invoice_overview v on v.id=r.id cross join lateral jsonb_array_elements(coalesce(r.raw->'collects','[]')) as collection(item) where not r.canceled and r.currency='RON' and (collection.item->>'issueDate')::date>=date_trunc('month',today)::date and (collection.item->>'issueDate')::date<date_trunc('month',today)::date+interval '1 month'))::numeric(18,2)::text,
    'outstanding',(select coalesce(sum(greatest(b,0)),0)::numeric(18,2)::text from (select sum(balance::numeric) b from public.billing_invoice_overview where currency='RON' and status='issued' and payment_status<>'canceled' and document_type<>'proforma' group by client_id) balances),
    'overdue',(select coalesce(sum(balance::numeric),0)::text from public.billing_invoice_overview where currency='RON' and payment_status='overdue'),
    'attention',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from (select * from public.billing_invoice_overview where payment_status in ('overdue','pending') order by due_date limit 5) v),
    'latest',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from (select * from public.billing_invoice_overview order by created_at desc limit 5) v));
 elsif operation='report' then
   return jsonb_build_object('months',(select jsonb_agg(jsonb_build_object('month',to_char(m,'YYYY-MM'),'revenue',coalesce(v.revenue,0)::text) order by m)
     from generate_series(date_trunc('month',today)-interval '5 months',date_trunc('month',today),interval '1 month') m
     left join lateral (select sum(subtotal::numeric) revenue from public.billing_invoice_overview where currency='RON' and payment_status<>'canceled' and status='issued' and document_type<>'proforma' and issue_date>=m and issue_date<m+interval '1 month') v on true),
     'vat',(select coalesce(sum(vat_total::numeric),0)::text from public.billing_invoice_overview where currency='RON' and payment_status<>'canceled' and status='issued' and document_type<>'proforma' and to_char(issue_date,'YYYY-MM')=coalesce(input->>'month',to_char(today,'YYYY-MM'))),
     'unknownVat',(select count(*) from public.billing_invoice_overview where vat_total is null and currency='RON' and payment_status<>'canceled' and to_char(issue_date,'YYYY-MM')=coalesce(input->>'month',to_char(today,'YYYY-MM'))),
     'count',(select count(*) from public.billing_invoice_overview where currency='RON' and payment_status<>'canceled' and status='issued' and document_type<>'proforma' and to_char(issue_date,'YYYY-MM')=coalesce(input->>'month',to_char(today,'YYYY-MM'))));
 elsif operation='payment' then
   select * into doc from public.billing_invoices where id=(input->>'id')::uuid for update;
   if doc.status<>'issued' or doc.document_type='proforma' then raise exception 'Încasarea necesită o factură emisă.'; end if;
   if input->>'amount' !~ '^-?\d{1,10}(\.\d{1,2})?$' then raise exception 'Suma trebuie să aibă cel mult două zecimale.'; end if;
   if exists(select from public.billing_payments where id=(input->>'paymentId')::uuid and invoice_id=doc.id) then return '{}'; end if;
   if abs((input->>'amount')::numeric)>abs(doc.total-coalesce((select sum(amount) from public.billing_payments where invoice_id=doc.id),0)) then raise exception 'Suma depășește soldul facturii.'; end if;
   insert into public.billing_payments(id,invoice_id,amount,paid_on,method,notes)
   values((input->>'paymentId')::uuid,doc.id,(input->>'amount')::numeric,(input->>'date')::date,input->>'method',left(input->>'notes',500)) on conflict(id) do nothing;
   return '{}';
 else raise exception 'Operație necunoscută.';
 end if;
end;
$$;

create or replace function public.billing_client_balances(p_search text default '',p_offset integer default 0)
returns table(id uuid,name text,cui text,email text,phone text,address text,client_type text,balance text)
language sql stable security invoker set search_path='' as $$
 select c.id,c.name,c.cui,c.email,c.phone,c.address,c.client_type,
 coalesce((select sum(v.balance::numeric) from public.billing_invoice_overview v where v.client_id=c.id and v.status='issued' and v.document_type<>'proforma' and v.payment_status<>'canceled' and v.currency='RON'),0)::numeric(18,2)::text
 from public.billing_clients c where not c.archived and (p_search='' or strpos(lower(coalesce(c.name,'')),lower(p_search))>0 or strpos(lower(coalesce(c.cui,'')),lower(p_search))>0)
 order by c.name nulls last,c.id limit 26 offset greatest(0,least(p_offset,100000));
$$;
commit;
