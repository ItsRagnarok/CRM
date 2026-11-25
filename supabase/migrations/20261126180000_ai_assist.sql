-- Etapa 4, punctul 20: AI cu confirmare umană.
--
-- organizations.ai_enabled: comutatorul AI al firmei (doar administratorul îl schimbă din Setări → AI).
--   Oprit = nicio poză sau text nu pleacă la un furnizor AI; butoanele „Citește cu AI” dispar.
-- ai_log: jurnalul fiecărei citiri: cine, ce funcție, ce furnizor și model, cât a durat, ce a propus AI-ul
--   și ce a rămas după ce omul a verificat (câte câmpuri a corectat). Poza nu se păstrează în jurnal.

alter table public.organizations add column if not exists ai_enabled boolean not null default true;

create table if not exists public.ai_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null default auth.uid(),
  feature text not null check (feature in ('bon','placuta','eticheta','descriere','dictare')),
  provider text,
  model text,
  ok boolean not null,
  error text check (error is null or length(error) <= 300),
  ms integer,
  suggested jsonb,
  final jsonb,
  fields integer,
  corrected integer,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_log_org on public.ai_log (organization_id, created_at desc);
alter table public.ai_log enable row level security;
revoke all on public.ai_log from anon;
create policy ai_log_select on public.ai_log for select to authenticated
  using (organization_id = (select public.current_org_id()) and ((select public.is_back_office()) or profile_id = (select auth.uid())));
create policy ai_log_insert on public.ai_log for insert to authenticated
  with check (organization_id = (select public.current_org_id()) and profile_id = (select auth.uid()) and confirmed_at is null and final is null);

-- Omul a verificat: ce a rămas în formular și câte câmpuri a corectat. O singură dată, doar pe rândul lui.
create or replace function public.ai_log_confirm(p_id uuid, p_final jsonb, p_fields integer, p_corrected integer) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.ai_log
     set final = p_final, fields = greatest(0, least(p_fields, 100)), corrected = greatest(0, least(p_corrected, 100)), confirmed_at = now()
   where id = p_id and profile_id = (select auth.uid()) and organization_id = public.current_org_id() and confirmed_at is null and ok;
  return found;
end $$;
revoke all on function public.ai_log_confirm(uuid, jsonb, integer, integer) from public, anon;
grant execute on function public.ai_log_confirm(uuid, jsonb, integer, integer) to authenticated;
