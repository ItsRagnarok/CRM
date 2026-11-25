-- Biroul bifează documentele „Pentru client” (documents.client_visible). Tabela nu avea politică de UPDATE,
-- deci bifa nu se salva. Doar biroul, doar în firma lui.
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_back_office()))
  with check (organization_id = (select public.current_org_id()) and (select public.is_back_office()));
