-- Facturile marcate „plătite” înainte de încasările pe rând primesc o încasare echivalentă,
-- la data la care au fost marcate (sau la data emiterii), ca rapoartele de încasări să le vadă.
insert into public.invoice_payments (organization_id, invoice_id, amount, method, paid_on, document, source, created_by)
select i.organization_id, i.id, i.gross_amount, 'alta', coalesce((i.paid_at at time zone 'Europe/Bucharest')::date, i.issued_at), 'marcată plătită', 'platforma', null
from public.invoices i
where i.status = 'paid' and i.doc_type = 'factura' and i.gross_amount > 0
  and not exists (select 1 from public.invoice_payments p where p.invoice_id = i.id);
