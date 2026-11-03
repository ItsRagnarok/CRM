-- Version matches the hosted migration history.
insert into storage.buckets(id, name, public, file_size_limit)
values ('platform-mail-uploads', 'platform-mail-uploads', false, 15728640);

-- Staged attachments belong to the actual platform admin, never a tenant org.
-- No UPDATE policy: each upload gets a fresh UUID and cannot overwrite a file.
create policy "platform_mail_upload_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'platform-mail-uploads' and (select public.ef_is_platform_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.ef_preview_org()) is null);
create policy "platform_mail_upload_read" on storage.objects for select to authenticated
using (bucket_id = 'platform-mail-uploads' and (select public.ef_is_platform_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.ef_preview_org()) is null);
create policy "platform_mail_upload_delete" on storage.objects for delete to authenticated
using (bucket_id = 'platform-mail-uploads' and (select public.ef_is_platform_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.ef_preview_org()) is null);
