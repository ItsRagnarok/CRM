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
      create function vault.create_secret(value text, name text, description text) returns uuid language plpgsql as $$
      declare sid uuid := gen_random_uuid(); begin insert into vault.secrets values(sid,value); return sid; end $$;
      create function vault.update_secret(sid uuid, value text) returns void language sql as $$
      update vault.secrets set secret=value where id=sid; $$;
    `);
    sql(readFileSync(new URL('../supabase/migrations/20261118030725_platform_billing_oblio.sql', import.meta.url), 'utf8'));
    sql(readFileSync(new URL('../supabase/migrations/20261118045301_platform_billing_settings.sql', import.meta.url), 'utf8'));
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
      select pg_temp.assert_true((select count(*)=12 from pg_tables where schemaname in ('public','private') and tablename like 'billing_%' and rowsecurity),'all new tables use RLS');
      select 'billing checks passed';
    `);
    assert.match(output, /billing checks passed/);
  } finally {
    sql(`drop database ${database} with (force)`, 'postgres');
  }
});
