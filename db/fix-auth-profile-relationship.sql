-- Incident fix, applied to production. Preserve the unique upsert key without
-- making telemetry look like a many-to-many profiles/organizations join table.
alter table public.platform_usage_daily add column id uuid not null default gen_random_uuid();
alter table public.platform_usage_daily drop constraint platform_usage_daily_pkey;
alter table public.platform_usage_daily add constraint platform_usage_daily_scope_key unique(organization_id,profile_id,day,channel);
alter table public.platform_usage_daily add constraint platform_usage_daily_pkey primary key(id);
notify pgrst,'reload schema';
