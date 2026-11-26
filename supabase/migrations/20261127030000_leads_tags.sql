-- Leads: etichete bifabile (Important, Urgent sau proprii), ca într-un CRM obișnuit. Maxim 8 pe lead.
alter table public.platform_leads add column if not exists tags text[] not null default '{}';
alter table public.platform_leads drop constraint if exists platform_leads_tags_check;
alter table public.platform_leads add constraint platform_leads_tags_check
  check (cardinality(tags) <= 8 and char_length(array_to_string(tags, '')) <= 200);
