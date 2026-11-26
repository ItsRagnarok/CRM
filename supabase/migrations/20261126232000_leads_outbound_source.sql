-- Sursă nouă pentru leaduri: campaniile de e-mail rece (outbound).
alter table public.platform_leads drop constraint if exists platform_leads_source_check;
alter table public.platform_leads add constraint platform_leads_source_check
  check (source in ('site','programari','facebook','recomandare','telefon','targ','outbound','altul'));
