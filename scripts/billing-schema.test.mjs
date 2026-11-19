import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Disposable PostgreSQL 17 database; never uses the hosted project or Oblio.
const container = process.env.BILLING_TEST_CONTAINER || 'electrofield-billing-db';
const database = `billing_test_${process.pid}`;
const sql = (input, db = database) => execFileSync('docker', ['exec', '-i', container,
  'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', db], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

test('billing schema: permissions, exact totals, document locks and payments', () => {
  sql(`create database ${database}`, 'postgres');
  try {
    sql(`
      do $$ begin
        if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
        if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
      end $$;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema auth to anon, authenticated;
      create table public.platform_admins(id uuid primary key);
      alter table public.platform_admins enable row level security;
      create policy self on public.platform_admins for select to authenticated using(id=auth.uid());
      grant select on public.platform_admins to authenticated;
      insert into public.platform_admins values ('00000000-0000-0000-0000-000000000001');
      -- Only the Vault FK contract is needed. Encryption is not simulated/tested.
      create schema vault;
      create table vault.secrets(id uuid primary key, secret text);
      create view vault.decrypted_secrets as select id,secret as decrypted_secret from vault.secrets;
      create function vault.create_secret(value text, name text, description text) returns uuid language plpgsql as $$
      declare sid uuid := gen_random_uuid(); begin insert into vault.secrets values(sid,value); return sid; end $$;
      create function vault.update_secret(sid uuid, value text) returns void language sql as $$
      update vault.secrets set secret=value where id=sid; $$;
    `);
    sql(readFileSync(new URL('../supabase/migrations/20261118030725_platform_billing_oblio.sql', import.meta.url), 'utf8'));
    sql(readFileSync(new URL('../supabase/migrations/20261118045301_platform_billing_settings.sql', import.meta.url), 'utf8'));
    sql(readFileSync(new URL('../supabase/migrations/20261118085522_platform_billing_workflow.sql', import.meta.url), 'utf8'));
    sql(readFileSync(new URL('../supabase/migrations/20261118220446_platform_billing_credit_balances.sql', import.meta.url), 'utf8'));
    sql(readFileSync(new URL('../supabase/migrations/20261119223559_platform_billing_oblio_sync.sql', import.meta.url), 'utf8'));
    const output = sql(`
      create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
      begin if value is distinct from true then raise exception 'ASSERT: %', message; end if; end $$;
      create function pg_temp.reject(command text) returns void language plpgsql as $$
      begin
        begin execute command;
        exception when insufficient_privilege or check_violation or unique_violation or foreign_key_violation then return;
        end;
        raise exception 'Unexpectedly allowed: %', command;
      end $$;
      set role anon;
      select pg_temp.reject('select * from public.billing_clients');
      reset role;
      select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
      set role authenticated;
      select pg_temp.assert_true(not private.billing_is_admin(),'tenant is not admin');
      select pg_temp.reject($q$insert into public.billing_clients(name) values ('Tenant forbidden')$q$);
      select pg_temp.assert_true((select count(*)=0 from public.billing_invoices),'tenant cannot read invoices');
      select pg_temp.reject('select * from private.billing_oblio_credentials');
      select pg_temp.reject($q$select public.billing_save_oblio('test@example.ro','test-only-secret')$q$);
      select pg_temp.assert_true((select count(*)=0 from public.billing_client_balances()),'tenant balances empty');
      reset role;
      select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
      set role authenticated;
      insert into public.billing_company_settings(name,cui,address) values ('Emitent','RO123','București');
      select public.billing_save_oblio('test@example.ro','test-only-secret');
      select public.billing_save_oblio('test@example.ro','rotated-test-secret');
      select pg_temp.assert_true((select count(*)=1 from public.billing_oblio_connections where enabled),'connection upsert');
      insert into public.billing_clients(id,cui) values ('10000000-0000-0000-0000-000000000001','RO456');
      insert into public.billing_invoices(id,client_id) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');
      insert into public.billing_invoice_lines(invoice_id,position,name,quantity,unit_price)
      values ('20000000-0000-0000-0000-000000000001',1,'Montaj',1,850),
             ('20000000-0000-0000-0000-000000000001',2,'Deplasare',1,100);
      select pg_temp.assert_true((select subtotal=950 and vat_total=199.50 and total=1149.50 and provider_number is null
        from public.billing_invoices),'mockup exact total, no draft number');
      insert into public.billing_invoice_lines(invoice_id,position,name,quantity,unit_price)
      values ('20000000-0000-0000-0000-000000000001',3,'Fractional',3,0.335);
      select pg_temp.assert_true((select net_amount=1.01 and vat_amount=0.21 from public.billing_invoice_lines where position=3),'round per line');
      delete from public.billing_invoice_lines where position=3;
      select pg_temp.assert_true((select total=1149.50 from public.billing_invoices),'recalculate after delete');
      select pg_temp.reject('update public.billing_invoices set subtotal=1');
      select pg_temp.reject($q$update public.billing_invoices set status='issued'$q$);
      select pg_temp.reject($q$insert into public.billing_invoice_lines(invoice_id,position,name,quantity,unit_price)
        values ('20000000-0000-0000-0000-000000000001',3,'NaN',1,'NaN')$q$);
      select pg_temp.reject($q$insert into public.billing_payments(invoice_id,amount,paid_on,method)
        values ('20000000-0000-0000-0000-000000000001',10,current_date,'cash')$q$);
      select set_config('request.headers','{"x-ef-preview-org":"test"}',false);
      select pg_temp.assert_true((select count(*)=0 from public.billing_clients),'preview blocked');
      select pg_temp.reject($q$insert into public.billing_clients(name) values ('Preview forbidden')$q$);
      select set_config('request.headers','{}',false);
      select pg_temp.reject('select * from private.billing_oblio_credentials');
      reset role;
      -- Model the future server-controlled issuance RPC, without any API request.
      update public.billing_invoices set status='pending',company_snapshot='{"name":"Emitent"}',client_snapshot='{"name":"Client"}';
      set role authenticated;
      select pg_temp.reject('update public.billing_invoice_lines set unit_price=1');
      select pg_temp.reject('delete from public.billing_invoices');
      reset role;
      insert into public.billing_issue_requests(invoice_id,request_payload,request_fingerprint)
        values ('20000000-0000-0000-0000-000000000001','{}',repeat('a',64));
      select pg_temp.reject($q$insert into public.billing_issue_requests(invoice_id,request_payload,request_fingerprint)
        values ('20000000-0000-0000-0000-000000000001','{}',repeat('b',64))$q$);
      update public.billing_invoices set status='issued',issued_at=now(),provider_series='FCT',provider_number='0043';
      set role authenticated;
      select pg_temp.reject($q$update public.billing_invoices set notes='changed'$q$);
      select pg_temp.reject('delete from public.billing_invoice_lines');
      select pg_temp.reject('delete from public.billing_invoices');
      update public.billing_clients set name='Changed client';
      select pg_temp.assert_true((select client_snapshot->>'name'='Client' from public.billing_invoices),'snapshot preserved');
      insert into public.billing_payments(id,invoice_id,amount,paid_on,method)
        values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',500,current_date,'bank');
      select pg_temp.reject('delete from public.billing_payments');
      insert into public.billing_payments(invoice_id,amount,paid_on,method,reverses_payment_id)
        values ('20000000-0000-0000-0000-000000000001',-500,current_date,'bank','30000000-0000-0000-0000-000000000001');
      select pg_temp.assert_true((select sum(amount)=0 from public.billing_payments),'payment reversal');
      select pg_temp.assert_true((select balance='1149.50' from public.billing_client_balances('Changed')),'server client balance');
      insert into public.billing_invoices(id,client_id,document_type,original_invoice_id)
        values ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','credit_note','20000000-0000-0000-0000-000000000001');
      insert into public.billing_invoice_lines(invoice_id,position,name,quantity,unit_price)
        values ('20000000-0000-0000-0000-000000000002',1,'Stornare',-1,850);
      select pg_temp.assert_true((select total=-1028.50 from public.billing_invoices where document_type='credit_note'),'negative credit total');
      delete from public.billing_invoices where document_type='credit_note';
      reset role;
      select pg_temp.assert_true((select count(*)=14 from pg_tables where schemaname in ('public','private') and tablename like 'billing_%' and rowsecurity),'all new tables use RLS');

      set role authenticated;
      insert into public.billing_series(id,name,document_type) values ('40000000-0000-0000-0000-000000000001','FCT','invoice'),('40000000-0000-0000-0000-000000000002','FCT','credit_note');
      update public.billing_clients set address='București',email='client@example.ro';
      select public.billing_workflow('save_draft','{"id":"20000000-0000-0000-0000-000000000003","clientId":"10000000-0000-0000-0000-000000000001","seriesId":"40000000-0000-0000-0000-000000000001","kind":"invoice","date":"2026-11-18","due":"2026-11-25","lines":[{"name":"Montaj","quantity":"1","price":"850","vat":"21"},{"name":"Deplasare","quantity":"1","price":"100","vat":"21"}]}');
      select pg_temp.assert_true((public.billing_workflow('detail','{"id":"20000000-0000-0000-0000-000000000003"}')->>'total')='1149.50','workflow exact totals');
      select public.billing_workflow('prepare','{"id":"20000000-0000-0000-0000-000000000003","sendEmail":true,"vatNames":{"21.00":"Normala"}}');
      select pg_temp.assert_true((select request_payload->'products'->0->>'price'='850.0000' and request_payload->'products'->0->>'vatName'='Normala' and request_payload->'products'->0->>'measuringUnit'='buc' and request_payload->>'sendEmail'='1' from public.billing_issue_requests where invoice_id='20000000-0000-0000-0000-000000000003'),'provider payload exact');
      select public.billing_workflow('uncertain','{"id":"20000000-0000-0000-0000-000000000003"}');
      create temp table saved_payload as select request_payload from public.billing_issue_requests where invoice_id='20000000-0000-0000-0000-000000000003';
      select public.billing_workflow('prepare','{"id":"20000000-0000-0000-0000-000000000003"}');
      select pg_temp.assert_true((select r.request_payload=s.request_payload from public.billing_issue_requests r,saved_payload s where invoice_id='20000000-0000-0000-0000-000000000003'),'retry uses identical frozen payload');
      select public.billing_workflow('reject','{"id":"20000000-0000-0000-0000-000000000003"}');
      select public.billing_workflow('correct_rejected','{"id":"20000000-0000-0000-0000-000000000003"}');
      select pg_temp.assert_true((select status='draft' and company_snapshot is null from public.billing_invoices where id='20000000-0000-0000-0000-000000000003'),'definitive rejection can be corrected');
      select public.billing_workflow('prepare','{"id":"20000000-0000-0000-0000-000000000003","vatNames":{"21.00":"Normala"}}');
      select pg_temp.assert_true((select r.request_payload->>'idempotencyKey'<>s.request_payload->>'idempotencyKey' from public.billing_issue_requests r,saved_payload s where invoice_id='20000000-0000-0000-0000-000000000003'),'new attempt after rejection has new key');
      select public.billing_workflow('confirm','{"id":"20000000-0000-0000-0000-000000000003","series":"FCT","number":"0044"}');
      select public.billing_workflow('confirm','{"id":"20000000-0000-0000-0000-000000000003","series":"FCT","number":"0044"}');
      select public.billing_workflow('payment','{"id":"20000000-0000-0000-0000-000000000003","paymentId":"30000000-0000-0000-0000-000000000003","amount":"1149.50","date":"2026-11-18","method":"bank"}');
      select public.billing_workflow('payment','{"id":"20000000-0000-0000-0000-000000000003","paymentId":"30000000-0000-0000-0000-000000000003","amount":"1149.50","date":"2026-11-18","method":"bank"}');
      select pg_temp.assert_true((public.billing_workflow('detail','{"id":"20000000-0000-0000-0000-000000000003"}')->>'balance')='0.00','idempotent payment');
      select public.billing_workflow('credit','{"id":"20000000-0000-0000-0000-000000000003"}');
      select pg_temp.assert_true((select total=-1149.50 from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000003'),'full credit total');
      select public.billing_workflow('prepare',jsonb_build_object('id',(select id from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000003'),'vatNames','{"21.00":"Normala"}'::jsonb));
      select pg_temp.assert_true((select request_payload->'referenceDocument'->>'refund'='0' from public.billing_issue_requests r join public.billing_invoices i on i.id=r.invoice_id where i.original_invoice_id='20000000-0000-0000-0000-000000000003'),'credit preserves provider collections');

      select public.billing_workflow('confirm',jsonb_build_object('id',(select id from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000003'),'series','FCT','number','0045'));
      select pg_temp.assert_true((select balance::numeric=0 and payment_status='credit_note' from public.billing_invoice_overview where id='20000000-0000-0000-0000-000000000003'),'credited original no longer collectible');
      select pg_temp.assert_true((select balance='-1149.50' from public.billing_invoice_overview where original_invoice_id='20000000-0000-0000-0000-000000000003'),'paid original creates refund due');
      select public.billing_workflow('payment',jsonb_build_object('id',(select id from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000003'),'paymentId','30000000-0000-0000-0000-000000000004','amount','-1149.50','date','2026-11-18','method','bank'));
      select pg_temp.assert_true((select balance='0.00' from public.billing_invoice_overview where original_invoice_id='20000000-0000-0000-0000-000000000003'),'refund settles credit');

      select public.billing_workflow('credit','{"id":"20000000-0000-0000-0000-000000000001"}');
      select public.billing_workflow('prepare',jsonb_build_object('id',(select id from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000001'),'vatNames','{"21.00":"Normala"}'::jsonb));
      select public.billing_workflow('confirm',jsonb_build_object('id',(select id from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000001'),'series','FCT','number','0046'));
      select pg_temp.assert_true((select balance='0.00' from public.billing_invoice_overview where original_invoice_id='20000000-0000-0000-0000-000000000001'),'unpaid original cancels without refund');
      select pg_temp.assert_true((public.billing_workflow('dashboard')->>'outstanding')::numeric=0,'credits clear dashboard receivables');
      select pg_temp.reject($q$insert into public.billing_payments(invoice_id,amount,paid_on,method) select id,-1,current_date,'bank' from public.billing_invoices where original_invoice_id='20000000-0000-0000-0000-000000000001'$q$);
      select pg_temp.assert_true(jsonb_array_length(public.billing_workflow('report')->'months')=6,'six months');
      select pg_temp.assert_true((public.billing_workflow('credentials')->>'secret')='rotated-test-secret','credentials retrieved only for admin');
      select public.billing_sync('begin');
      select public.billing_sync('apply',jsonb_build_object('key',(select run_key from public.billing_oblio_sync_state),'phase','clients','offset',0,'rows','[{"cif":"RO999999","name":"Client istoric","address":"Oradea"}]'::jsonb));
      select public.billing_sync('apply',jsonb_build_object('key',(select run_key from public.billing_oblio_sync_state),'phase','invoices','offset',0,'rows',jsonb_build_array(
       jsonb_build_object('id','remote1','seriesName','OLD','number','0001','issueDate',current_date,'dueDate',current_date+7,'total','121.0000','currency','RON','client','{"cif":"RO999999","name":"Client istoric"}'::jsonb,'products','[{"name":"Serviciu","quantity":"1","price":"100","vatPercentage":"21","vatIncluded":"0"}]'::jsonb,'collects',jsonb_build_array(jsonb_build_object('value','50.00','issueDate',current_date,'type','Ordin de plata'))),
       jsonb_build_object('id','remote2','seriesName','OLD','number','0002','issueDate',current_date,'dueDate',current_date,'total','99.00','currency','RON','canceled','1','client','{"cif":"RO999999","name":"Client istoric"}'::jsonb,'collects','[]'::jsonb)
      )));
      select pg_temp.assert_true((select count(*)=1 from public.billing_clients where cui='RO999999'),'client imported once');
      select pg_temp.assert_true((select total='121.00' and paid='50.00' and balance='71.00' and subtotal='100.00' and vat_total='21.00' from public.billing_invoice_overview where provider_series='OLD' and provider_number='0001'),'history monetary values');
      select pg_temp.assert_true((public.billing_workflow('dashboard')->>'outstanding')::numeric=71,'history included in dashboard');
      select pg_temp.assert_true((select balance='71.00' from public.billing_client_balances('istoric')),'history client balance excludes canceled');
      select pg_temp.assert_true((public.billing_workflow('detail',jsonb_build_object('id',(select id from public.billing_oblio_documents where provider_id='remote1')))->>'imported')='true','history detail');
      select pg_temp.assert_true((public.billing_sync('status')->>'phase')='done','sync completed');
      select public.billing_sync('begin','{"force":true}');
      select public.billing_sync('apply',jsonb_build_object('key',(select run_key from public.billing_oblio_sync_state),'phase','clients','offset',0,'rows','[{"cif":"RO999999","name":"Client istoric"}]'::jsonb));
      select pg_temp.assert_true((select count(*)=1 from public.billing_clients where cui='RO999999'),'repeat client sync idempotent');
      select public.billing_sync('apply',jsonb_build_object('key',(select run_key from public.billing_oblio_sync_state),'phase','invoices','offset',0,'rows',(select jsonb_agg(raw) from public.billing_oblio_documents)));
      select pg_temp.assert_true((select count(*)=2 from public.billing_oblio_documents),'repeat invoice sync idempotent');
      select pg_temp.assert_true((public.billing_workflow('dashboard')->>'collected')::numeric=50,'remote receipts counted once');
      select pg_temp.assert_true(jsonb_array_length(public.billing_workflow('export',jsonb_build_object('month',to_char(current_date,'YYYY-MM'))))>=1,'history participates in monthly export');
      select pg_temp.assert_true((public.billing_workflow('report',jsonb_build_object('month',to_char(current_date,'YYYY-MM')))->>'unknownVat')::integer=0,'canceled invoice excluded from incomplete VAT');


      select set_config('request.headers','{"x-ef-preview-org":"test"}',false);
      select pg_temp.reject($q$select public.billing_workflow('credentials')$q$);
      select set_config('request.headers','{}',false);
      reset role;
      select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
      set role authenticated;
      select pg_temp.reject($q$select public.billing_workflow('dashboard')$q$);
      select pg_temp.reject($q$select public.billing_sync('begin')$q$);
      select pg_temp.assert_true((select count(*)=0 from public.billing_oblio_documents),'history tenant isolation');
      select pg_temp.reject($q$select public.billing_workflow('credentials')$q$);
      select pg_temp.assert_true((select count(*)=0 from public.billing_invoice_overview),'overview tenant isolation');
      reset role;
      select 'billing checks passed';
    `);
    assert.match(output, /billing checks passed/);
  } finally {
    if(!process.env.BILLING_KEEP_FIXTURE) sql(`drop database ${database} with (force)`, 'postgres'); else console.log('Test fixture database: '+database);
  }
});
