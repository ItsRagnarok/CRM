-- TVA la nivel de firmă: cota implicită pe facturi; 0 = firmă neplătitoare de TVA.
-- Merge și fără furnizor conectat (evidență internă), nu doar în conexiunea SmartBill/Oblio.
alter table public.organizations
  add column if not exists invoice_vat_percent numeric(5,2) not null default 21
  check (invoice_vat_percent >= 0 and invoice_vat_percent <= 100);

update public.organizations o
   set invoice_vat_percent = c.default_tax_percent
  from public.invoicing_connections c
 where c.organization_id = o.id and c.default_tax_percent is not null;
