-- Leads: ce a cerut firma (demo, prezentare, apel, costuri...) și ultimul ei răspuns, ca să se vadă direct pe card.
alter table public.platform_leads
  add column if not exists wants text[] not null default '{}',
  add column if not exists last_reply text;
alter table public.platform_leads drop constraint if exists platform_leads_wants_check;
alter table public.platform_leads add constraint platform_leads_wants_check
  check (wants <@ array['demo','prezentare','apel','costuri','detalii','mai_tarziu','raspuns_automat']::text[]);
alter table public.platform_leads drop constraint if exists platform_leads_last_reply_check;
alter table public.platform_leads add constraint platform_leads_last_reply_check
  check (last_reply is null or length(last_reply) <= 2000);
