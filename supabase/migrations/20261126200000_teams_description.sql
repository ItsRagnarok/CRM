-- Echipa are o descriere scurtă (ce face: „Verificări și revizii”, „Execuție și intervenții”),
-- afișată în calendar sub numele echipei.
alter table public.teams add column if not exists description text
  check (description is null or char_length(description) <= 80);
