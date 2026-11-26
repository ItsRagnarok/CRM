-- Programări: cum vrea clientul să discutăm (apel telefonic sau Google Meet cu prezentarea platformei).
alter table public.bookings add column if not exists meeting_type text;
alter table public.bookings drop constraint if exists bookings_meeting_type_check;
alter table public.bookings add constraint bookings_meeting_type_check check (meeting_type is null or meeting_type in ('apel', 'meet'));
