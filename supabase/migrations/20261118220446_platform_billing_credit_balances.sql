-- Settle full credits against unpaid principal; only collected money is refundable.
begin;
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
 coalesce(d.email_status,'not_sent') as email_status
from public.billing_invoices i join public.billing_clients c on c.id=i.client_id
left join lateral (select sum(amount) paid from public.billing_payments where invoice_id=i.id) p on true
left join public.billing_invoice_delivery d on d.invoice_id=i.id
left join public.billing_invoices original on original.id=i.original_invoice_id
left join lateral (select sum(amount) paid from public.billing_payments where invoice_id=original.id) op on true
left join lateral (select count(*) n from public.billing_invoices where original_invoice_id=i.id and status='issued') credited on true;

create or replace function private.billing_guard_payment()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare doc public.billing_invoices; original public.billing_payments;
begin
  if tg_op <> 'INSERT' then raise exception 'Încasările se corectează prin înregistrare inversă.' using errcode = '23514'; end if;
  select * into doc from public.billing_invoices where id = new.invoice_id for update;
  if not found or doc.status <> 'issued' or doc.document_type = 'proforma' then
    raise exception 'Plata necesită o factură emisă.' using errcode = '23514';
  end if;
  if new.reverses_payment_id is not null then
    select * into original from public.billing_payments where id = new.reverses_payment_id;
    if not found or original.invoice_id <> new.invoice_id or original.amount <> -new.amount or original.reverses_payment_id is not null then
      raise exception 'Înregistrarea inversă nu corespunde plății.' using errcode = '23514';
    end if;
  elsif (doc.document_type = 'credit_note') <> (new.amount < 0) then
    raise exception 'Semnul plății nu corespunde documentului.' using errcode = '23514';
  end if;
  if new.reverses_payment_id is null and abs(new.amount)>abs((select balance::numeric from public.billing_invoice_overview where id=new.invoice_id)) then
    raise exception 'Suma depășește soldul disponibil după stornare.' using errcode='23514';
  end if;
  return new;
end;
$$;

commit;
