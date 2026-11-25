-- Viteză: regulile de acces (RLS) apelau funcțiile de context pentru FIECARE rând citit
-- (current_org_id(), is_back_office(), is_staff(), current_client_id(), current_role(), auth.uid(),
-- ef_is_platform_admin()). Fiind SECURITY DEFINER, Postgres nu le poate integra în interogare, așa că
-- o listă de 100 de lucrări făcea sute de sub-interogări pe profiles.
-- Le învelim în (select …): Postgres le calculează o singură dată pe interogare (InitPlan).
-- Regulile rămân identice ca sens: funcțiile nu au parametri și sunt STABLE (aceeași valoare
-- pe toată durata unei interogări). Recomandarea Supabase: lint 0003_auth_rls_initplan.
-- Idempotent: o a doua rulare nu mai găsește nimic de schimbat.

do $$
declare
  r record;
  pat constant text := '(?<!SELECT )(current_org_id|is_back_office|is_staff|current_client_id|"current_role"|auth\.uid|ef_is_platform_admin)\(\)';
  q text;
  w text;
begin
  for r in select * from pg_policies where schemaname = 'public' loop
    q := regexp_replace(r.qual, pat, '(select \1())', 'g');
    w := regexp_replace(r.with_check, pat, '(select \1())', 'g');
    if q is distinct from r.qual or w is distinct from r.with_check then
      execute format(
        'alter policy %I on %I.%I %s %s',
        r.policyname, r.schemaname, r.tablename,
        case when q is not null then 'using (' || q || ')' else '' end,
        case when w is not null then 'with check (' || w || ')' else '' end
      );
    end if;
  end loop;
end $$;
