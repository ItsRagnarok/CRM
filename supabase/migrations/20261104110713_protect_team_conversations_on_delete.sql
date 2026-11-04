create function public.delete_team_without_conversation(p_team_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.current_role() is null or public.current_role() not in ('admin', 'manager') then
    return 'unavailable';
  end if;

  -- Lock the team before checking. A concurrent conversation insert must
  -- acquire a foreign-key lock on this same row.
  perform 1 from public.teams
  where id = p_team_id and organization_id = public.current_org_id()
  for update;
  if not found then
    return 'unavailable';
  end if;

  if exists (select 1 from public.conversations where team_id = p_team_id) then
    return 'has_conversation';
  end if;

  delete from public.teams
  where id = p_team_id and organization_id = public.current_org_id();
  if not found then
    return 'unavailable';
  end if;
  return 'deleted';
end;
$$;

revoke execute on function public.delete_team_without_conversation(uuid) from public, anon;
grant execute on function public.delete_team_without_conversation(uuid) to authenticated;
