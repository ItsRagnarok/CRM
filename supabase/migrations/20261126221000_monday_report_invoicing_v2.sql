-- Raportul de luni: doar facturi (nu proforme), fără anulate; restanțele = rest de plată cu TVA.
do $$
declare d text;
begin
  select pg_get_functiondef('public.ef_monday_report_for(uuid,date)'::regprocedure) into d;
  d := replace(d, 'i.total_amount amount, (p_today - coalesce(i.due_date, i.issued_at::date)) days from public.invoices i where i.organization_id = p_org and i.status in (''unpaid'', ''overdue'')',
                  '(i.gross_amount - i.paid_amount) amount, (p_today - coalesce(i.due_date, i.issued_at::date)) days from public.invoices i where i.organization_id = p_org and i.doc_type = ''factura'' and i.status in (''unpaid'', ''overdue'')');
  d := replace(d, 'i.job_id is not null and i.status <> ''cancelled''', 'i.job_id is not null and i.doc_type = ''factura'' and i.status <> ''cancelled''');
  d := replace(d, 'not exists (select 1 from public.invoices i where i.job_id = j.id)', 'not exists (select 1 from public.invoices i where i.job_id = j.id and i.doc_type = ''factura'' and i.status <> ''cancelled'')');
  d := replace(d, 'sum(total_amount) from public.invoices where organization_id = p_org and status = ''paid''', 'sum(gross_amount) from public.invoices where organization_id = p_org and doc_type = ''factura'' and status = ''paid''');
  d := replace(d, 'sum(total_amount) from public.invoices where organization_id = p_org and status <> ''cancelled''', 'sum(total_amount) from public.invoices where organization_id = p_org and doc_type <> ''proforma'' and status <> ''cancelled''');
  execute d;
end $$;
