-- Super Adminul nu are rând în profiles (profilurile sunt ale firmelor), deci „cine a creat” un lead
-- trebuie să trimită la auth.users. Cu legătura la profiles, orice lead nou sau import dădea eroare.
alter table public.platform_leads drop constraint if exists platform_leads_created_by_fkey;
alter table public.platform_leads add constraint platform_leads_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.platform_lead_events drop constraint if exists platform_lead_events_created_by_fkey;
alter table public.platform_lead_events add constraint platform_lead_events_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
