-- Etapa 3, punctul 15: stoc pe mașină.
--
-- material_stock.target_qty / min_qty: lista „ce trebuie să fie în mașină”, cu cantitatea țintă și pragul,
--   pe fiecare mașină (rândurile cu vehicle_id). Fără țintă, materialul doar se află în mașină.
-- vehicle_restock_requests: tehnicianul cere reaprovizionarea mașinii; biroul o rezolvă încărcând din depozit.
-- expenses.vehicle_id / items: „achiziție urgentă” = bonul de la magazin, cu ce s-a cumpărat și pentru ce lucrare.
-- load_vehicle_from_warehouse: mută materialele din depozitul central în mașină, într-un singur pas.

alter table public.material_stock
  add column if not exists target_qty numeric check (target_qty is null or target_qty >= 0),
  add column if not exists min_qty numeric check (min_qty is null or min_qty >= 0);

create table if not exists public.vehicle_restock_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  note text check (note is null or length(note) <= 500),
  items jsonb not null default '[]'::jsonb,
  status text not null default 'noua' check (status in ('noua', 'rezolvata', 'anulata')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_restock_requests_org on public.vehicle_restock_requests (organization_id, status, created_at desc);

alter table public.vehicle_restock_requests enable row level security;
revoke all on public.vehicle_restock_requests from anon;
create policy vehicle_restock_select on public.vehicle_restock_requests for select to authenticated
  using (organization_id = public.current_org_id() and public.is_staff());
create policy vehicle_restock_insert on public.vehicle_restock_requests for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_staff() and requested_by = (select auth.uid()) and status = 'noua');
create policy vehicle_restock_update on public.vehicle_restock_requests for update to authenticated
  using (organization_id = public.current_org_id() and public.is_back_office())
  with check (organization_id = public.current_org_id() and public.is_back_office());

alter table public.expenses
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists items jsonb;

-- Încarcă mașina din depozitul central: p_items = [{"material_id": "...", "qty": 5}, ...].
-- Se mută cât există în depozit; ce nu ajunge se întoarce în „short”. Cererile deschise ale mașinii se închid.
create or replace function public.load_vehicle_from_warehouse(p_vehicle uuid, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  org uuid := public.current_org_id();
  wh uuid;
  it jsonb;
  mid uuid;
  want numeric;
  avail numeric;
  moved numeric;
  moved_list jsonb := '[]'::jsonb;
  short_list jsonb := '[]'::jsonb;
begin
  if not public.is_back_office() then raise exception 'Fără acces' using errcode = '42501'; end if;
  if not exists (select 1 from public.vehicles where id = p_vehicle and organization_id = org) then raise exception 'Mașină necunoscută' using errcode = '22023'; end if;
  select id into wh from public.warehouses where organization_id = org order by is_central desc, created_at limit 1;
  if wh is null then raise exception 'Firma nu are depozit' using errcode = '22023'; end if;

  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    mid := (it->>'material_id')::uuid;
    want := greatest(0, coalesce((it->>'qty')::numeric, 0));
    continue when want = 0 or not exists (select 1 from public.materials where id = mid and organization_id = org);
    select quantity into avail from public.material_stock where warehouse_id = wh and material_id = mid for update;
    moved := least(want, greatest(coalesce(avail, 0), 0));
    if moved > 0 then
      update public.material_stock set quantity = quantity - moved, updated_at = now() where warehouse_id = wh and material_id = mid;
      insert into public.material_stock (organization_id, material_id, vehicle_id, quantity)
      values (org, mid, p_vehicle, moved)
      on conflict (material_id, vehicle_id) where vehicle_id is not null
      do update set quantity = public.material_stock.quantity + excluded.quantity, updated_at = now();
      moved_list := moved_list || jsonb_build_object('material_id', mid, 'qty', moved);
    end if;
    if moved < want then
      short_list := short_list || jsonb_build_object('material_id', mid, 'wanted', want, 'moved', moved);
    end if;
  end loop;

  if jsonb_array_length(moved_list) > 0 then
    update public.vehicle_restock_requests
       set status = 'rezolvata', resolved_by = (select auth.uid()), resolved_at = now()
     where vehicle_id = p_vehicle and organization_id = org and status = 'noua';
  end if;
  return jsonb_build_object('moved', moved_list, 'short', short_list);
end $$;
revoke all on function public.load_vehicle_from_warehouse(uuid, jsonb) from public, anon;
grant execute on function public.load_vehicle_from_warehouse(uuid, jsonb) to authenticated;
