-- Securitate: politica anonimă pentru pachetul clientului (poze înainte/după și documente bifate
-- „Pentru client”, pe linkul de status) permitea și LISTAREA folderelor din storage: oricine, fără link,
-- putea enumera aceste fișiere ale tuturor firmelor. Pagina /status are nevoie doar să SEMNEZE căile
-- primite din RPC-ul cu token. Restrângem politica la operația de semnare.
drop policy if exists "client package read" on storage.objects;
create policy "client package read" on storage.objects
  for select to anon
  using (
    bucket_id = 'attachments'
    and coalesce(storage.operation(), '') like 'storage.object.sign%'
    and public.ef_client_package_file(name)
  );
