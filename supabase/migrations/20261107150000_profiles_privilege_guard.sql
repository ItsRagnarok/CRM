-- P0 (audit 2026-11-07): orice utilizator autentificat își putea schimba singur
-- `role`, `organization_id`, `client_id` sau `is_active` pe propriul rând din
-- `profiles` (policy `profiles_update` nu avea WITH CHECK). Un tehnician devenea
-- astfel admin. Trigger-ul de mai jos blochează schimbarea acestor coloane:
--   * fără sesiune (service role, joburi interne): permis;
--   * pe propriul rând: interzis pentru toți (nimeni nu-și schimbă singur rolul);
--   * pe alt rând: doar admin din aceeași organizație, fără a muta rândul în
--     altă organizație.

create or replace function public.enforce_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return new;
  end if;

  if new.role is not distinct from old.role
     and new.organization_id is not distinct from old.organization_id
     and new.client_id is not distinct from old.client_id
     and new.is_active is not distinct from old.is_active then
    return new;
  end if;

  if old.id = caller then
    raise exception 'Nu îți poți schimba singur rolul, compania sau starea contului.'
      using errcode = '42501';
  end if;

  if public."current_role"() is distinct from 'admin'
     or old.organization_id is distinct from public.current_org_id() then
    raise exception 'Doar un administrator al companiei poate modifica rolul sau starea unui cont.'
      using errcode = '42501';
  end if;

  if new.organization_id is distinct from old.organization_id then
    raise exception 'Un cont nu poate fi mutat în altă companie.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_privileged_columns_guard on public.profiles;
create trigger profiles_privileged_columns_guard
  before update on public.profiles
  for each row
  execute function public.enforce_profile_privileged_columns();

-- Același efect și la nivel de politică: rândul rezultat trebuie să rămână în
-- organizația apelantului.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or (organization_id = public.current_org_id() and public."current_role"() = 'admin')
  )
  with check (
    organization_id = public.current_org_id()
  );
