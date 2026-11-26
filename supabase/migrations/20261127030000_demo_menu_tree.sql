-- Cont demo pe tot meniul: Super Adminul poate bloca orice secțiune sau subfuncție (nu doar cele 10 de până acum).
-- Conturile demo existente își păstrează ce aveau: secțiunile noi (care până acum erau mereu deschise) pornesc deschise.
update public.organizations
   set demo_unlocked = (
     select coalesce(array_agg(distinct x order by x), '{}')
     from unnest(demo_unlocked || array[
       'cereri','lucrari','lucrari.nou','calendar','harta','gaze','gaze.fise','gaze.registru','fotovoltaic','electric',
       'clienti','clienti.nou','facturare.noua','stoc.masini','stoc.scule','stoc.cereri','stoc.foaie','stoc.comanda','stoc.nou',
       'pontaj.concedii','cheltuieli','rapoarte','mesaje',
       'm_harta','m_materiale','m_scule','m_mesaje','m_ssm','m_cheltuieli','m_concediu','m_pontaj'
     ]::text[]) as x
   )
 where account_type = 'demo';
