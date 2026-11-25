-- Politicile vechi pe fișiere erau „pentru toți” (public), deși cer un utilizator logat.
-- Pentru un vizitator fără cont (linkul de status al clientului) ele apelau is_back_office(),
-- la care rolul anon nu are drept, și toată citirea pica. Le legăm de rolul authenticated:
-- pentru utilizatorii logați nu se schimbă nimic, iar clientul trece doar prin „client package read”.
alter policy "org members can read their files" on storage.objects to authenticated;
alter policy "back office can update org files" on storage.objects to authenticated;
alter policy "back office can delete org files" on storage.objects to authenticated;
