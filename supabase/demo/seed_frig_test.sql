-- Firmă de test pentru prezentări la firme de service frigorific (cont intern al proprietarului, NU cont demo pentru un client).
-- 3 tehnicieni în echipe de câte un om, 5 clienți fictivi, lucrări de frig fără domeniu, pontaj, concediu, poziții, certificate F-gaz.
-- Date 100% fictive. Parola se dă la rulare: înlocuiește __PAROLA__ (nu o salva în repo).
-- Rulează o singură dată (se oprește dacă firma există). Ștergere: platform_admin_delete_company din Super Admin.
do $frig$
declare
  oid uuid; wid uuid; pw text := extensions.crypt('__PAROLA__', extensions.gen_salt('bf'));
  emails text[] := array['admin@frig.electrofield.test','mihai@frig.electrofield.test','cristian@frig.electrofield.test','vlad@frig.electrofield.test'];
  fnames text[] := array['Andrei (administrator test)','Mihai Stan','Cristian Dobre','Vlad Ene'];
  plates text[] := array['IF 11 FRG','IF 12 FRG','IF 13 FRG'];
  cnames text[] := array['Logistic Frig Test SRL','Supermarket Test Militari','Depozit Alimentar Test Chitila','Carmangeria Test Ilfov','Restaurant Test Floreasca'];
  caddr text[] := array['Șos. de Centură 10, Chiajna','Bd. Iuliu Maniu 300, București','Str. Depozitelor 5, Chitila','Str. Principală 120, Ciorogârla','Calea Floreasca 150, București'];
  clat double precision[] := array[44.4590,44.4340,44.5085,44.4420,44.4650];
  clng double precision[] := array[25.9750,25.9950,25.9800,25.8800,26.1000];
  tech uuid[] := '{}'; team uuid[] := '{}'; cl uuid[] := '{}'; loc uuid[] := '{}';
  tpl uuid; jid uuid; jc uuid; uid uuid; tid uuid; i int; d date; ts1 timestamptz; ts2 timestamptz; r record;
  mon date := date_trunc('week', current_date)::date; -- luni săptămâna curentă
begin
  if exists (select 1 from public.organizations where name = 'Frig Service Test SRL') then raise exception 'Firma de test există deja'; end if;
  insert into public.organizations (name, cui, email, phone, address, enabled_domains, enabled_modules, terms_accepted_at, hq_lat, hq_lng, fuel_cost_per_km, gps_continuous_tracking_enabled, gps_retention_days, account_type)
    values ('Frig Service Test SRL','RO00000099','frig-test@example.test','0700000099','Str. Atelierului 1, Chitila','{electric}','{conformitate}',now(),44.5085,25.9800,1.3,true,30,'client') returning id into oid;
  insert into public.subscriptions (organization_id, max_users) values (oid, 10);
  insert into public.warehouses (organization_id, name, is_central, address, lat, lng) values (oid,'Atelier Chitila (test)',true,'Str. Atelierului 1, Chitila',44.5085,25.9800) returning id into wid;

  for i in 1..4 loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,raw_app_meta_data,raw_user_meta_data,is_sso_user,is_anonymous,created_at,updated_at)
    values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',emails[i],pw,now(),'','','','','','','','{"provider":"email","providers":["email"]}','{}',false,false,now(),now());
    insert into auth.identities (id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values (gen_random_uuid(),uid::text,uid,jsonb_build_object('sub',uid::text,'email',emails[i],'email_verified',true),'email',now(),now(),now());
    insert into public.profiles (id, organization_id, role, full_name, phone, hourly_rate, location_consent_at)
    values (uid, oid, case when i=1 then 'admin'::user_role else 'technician'::user_role end, fnames[i], '070000990'||i, case when i>1 then 45 end, case when i>1 then now() - interval '3 days' end);
    if i > 1 then tech := tech || uid; end if;
  end loop;

  -- echipe de câte un om, fiecare cu duba lui
  for i in 1..3 loop
    insert into public.teams (organization_id, name, team_leader_id, description) values (oid, 'Echipa '||fnames[i+1], tech[i], 'Echipă de un om (tehnician frig)') returning id into tid;
    team := team || tid;
    insert into public.team_members (team_id, profile_id) values (tid, tech[i]);
    insert into public.vehicles (organization_id, name, plate_number, assigned_team_id, driver_id) values (oid, 'Ford Transit Custom '||i, plates[i], tid, tech[i]);
  end loop;

  for i in 1..5 loop
    insert into public.clients (organization_id, client_type, name, company_name, phone, email, address, lat, lng)
    values (oid, 'company', cnames[i], cnames[i], '07009910'||i, 'client'||i||'@example.test', caddr[i], clat[i], clng[i]) returning id into uid;
    cl := cl || uid;
    insert into public.locations (organization_id, client_id, label, address, lat, lng) values (oid, uid, 'Locația principală', caddr[i], clat[i], clng[i]) returning id into uid;
    loc := loc || uid;
  end loop;

  -- checklist pentru revizii (se aplică singur pe lucrările de mentenanță/service) și unul general
  insert into public.checklist_templates (organization_id, name, job_type, is_active) values (oid, 'Revizie instalație frigorifică', 'mentenanta', true) returning id into tpl;
  insert into public.checklist_template_items (template_id, phase, label, sort_order, is_required) values
    (tpl,'before','Notează temperatura afișată la sosire',1,true),(tpl,'before','Verifică vizual agregatul și conexiunile electrice',2,true),
    (tpl,'after','Presiuni de lucru verificate (aspirație / refulare)',1,true),(tpl,'after','Verificare etanșeitate cu detectorul',2,true),
    (tpl,'after','Condensator curățat',3,true),(tpl,'after','Ventilatoare și senzori verificați',4,true),
    (tpl,'after','Temperatura de lucru atinsă și notată',5,true),(tpl,'after','Clientul a fost informat',6,false);
  insert into public.checklist_templates (organization_id, name, job_type, is_active) values (oid, 'Intervenție generală', null, true) returning id into tid;
  insert into public.checklist_template_items (template_id, phase, label, sort_order, is_required) values
    (tid,'after','Defectul a fost găsit și notat în observații',1,true),(tid,'after','Test de funcționare după reparație',2,true),(tid,'after','Clientul a fost informat',3,false);

  -- lucrări: (zi față de luni curent, tehnician, client, tip, titlu, început, sfârșit, prioritate)
  for r in select * from (values
    (-7,1,1,'mentenanta','Revizie agregat frigorific camion (Carrier)', '08:00','10:30','normala'),
    (-7,2,2,'reparatie','Vitrina frigorifică nu răcește', '09:00','12:00','ridicata'),
    (-6,3,3,'mentenanta','Revizie cameră frigorifică', '08:30','12:30','normala'),
    (-5,1,4,'reparatie','Înlocuire ventilator condensator', '10:00','13:00','normala'),
    (-4,2,5,'service','Curățare și verificare instalație frigorifică bucătărie', '09:00','11:00','normala'),
    (-3,3,1,'inspectie','Verificare etanșeitate agregat (F-gaz)', '08:00','10:00','normala'),
    ( 0,1,3,'mentenanta','Revizie cameră frigorifică nr. 2', '09:00','11:00','normala'),
    ( 0,2,2,'instalare','Montaj vitrină frigorifică nouă', '10:00','14:00','normala'),
    ( 1,3,4,'mentenanta','Revizie agregat frigorific', '08:00','10:00','normala'),
    ( 1,1,5,'inspectie','Verificare presiuni după reparație', '13:00','14:00','normala'),
    ( 2,2,1,'urgenta','Agregat camion nu răcește, marfă în tranzit', '08:00','11:00','urgenta'),
    ( 2,3,2,'mentenanta','Revizie lunară vitrine frigorifice', '10:00','12:00','normala'),
    ( 3,1,3,'reparatie','Înlocuire filtru deshidrator', '09:00','11:00','normala'),
    ( 4,2,5,'mentenanta','Revizie instalație frigorifică restaurant', '08:00','10:00','normala')
  ) v(dd, t, c, jt, title, s, e, pr) loop
    -- dd < 0: săptămâna curentă (deja trecută, rulat sâmbătă); dd >= 0: săptămâna viitoare, de luni
    if r.dd < 0 then d := mon + (r.dd + 7); else d := mon + 7 + r.dd; end if;
    ts1 := (d + r.s::time) at time zone 'Europe/Bucharest'; ts2 := (d + r.e::time) at time zone 'Europe/Bucharest';
    insert into public.jobs (organization_id, client_id, location_id, team_id, job_type, title, description, scheduled_date, start_time, end_time, status, priority, domain,
        arrived_at, work_started_at, work_ended_at, distance_km, observations, admin_message, require_arrival_photo, require_final_photo, warehouse_id)
    values (oid, cl[r.c], loc[r.c], team[r.t], r.jt::job_type, r.title || ' — ' || cnames[r.c],
        'Lucrare de test. ' || r.title || ' la ' || caddr[r.c] || '. Persoană de contact la recepție.',
        d, r.s::time, r.e::time, case when r.dd < 0 then 'finalizata' else 'programata' end::job_status, r.pr::job_priority, null,
        case when r.dd < 0 then ts1 - interval '5 minutes' end, case when r.dd < 0 then ts1 end, case when r.dd < 0 then ts2 end,
        case when r.dd < 0 then 12 + r.c * 3 end,
        case when r.dd < 0 then 'Intervenție încheiată. Instalația funcționează la parametri; clientul a fost informat.' end,
        case when r.dd >= 0 then 'Ia filtre și agent frigorific în dubă; anunță clientul cu 30 de minute înainte.' end,
        r.dd >= 0, r.dd >= 0, wid)
    returning id into jid;
    insert into public.job_assignments (job_id, profile_id, assigned_role) values (jid, tech[r.t], 'lead');
    if r.dd < 0 then
      insert into public.job_status_history (job_id, status, changed_by, lat, lng, created_at) values
        (jid,'in_drum',tech[r.t],44.5085,25.9800, ts1 - interval '35 minutes'),
        (jid,'ajunsa',tech[r.t],clat[r.c],clng[r.c], ts1 - interval '5 minutes'),
        (jid,'in_lucru',tech[r.t],clat[r.c],clng[r.c], ts1),
        (jid,'finalizata',tech[r.t],clat[r.c],clng[r.c], ts2);
      insert into public.time_entries (organization_id, job_id, profile_id, event_type, lat, lng, occurred_at) values
        (oid,jid,tech[r.t],'travel_start',44.5085,25.9800, ts1 - interval '35 minutes'),
        (oid,jid,tech[r.t],'arrival',clat[r.c],clng[r.c], ts1 - interval '5 minutes'),
        (oid,jid,tech[r.t],'work_start',clat[r.c],clng[r.c], ts1),
        (oid,jid,tech[r.t],'work_end',clat[r.c],clng[r.c], ts2);
      insert into public.job_checklists (job_id, template_id, phase) values (jid, case when r.jt = 'mentenanta' then tpl else tid end, 'after') returning id into jc;
      insert into public.job_checklist_items (job_checklist_id, label, sort_order, is_checked, checked_by, checked_at, locked)
        select jc, cti.label, cti.sort_order, true, tech[r.t], ts2 - interval '10 minutes', true
        from public.checklist_template_items cti where cti.template_id = case when r.jt = 'mentenanta' then tpl else tid end and cti.phase = 'after';
    end if;
  end loop;

  -- concediu: Vlad e liber miercuri, chiar în ziua în care are o revizie (avertizare la programare)
  insert into public.time_off_requests (organization_id, profile_id, type, start_date, end_date, reason, status, requested_by, decided_at)
    values (oid, tech[3], 'concediu_odihna', mon + 9, mon + 9, 'Zi liberă (test)', 'approved', tech[3], now());

  -- ultimele poziții cunoscute (pentru hartă)
  for i in 1..3 loop
    insert into public.technician_positions (profile_id, organization_id, lat, lng, accuracy_m, recorded_at) values (tech[i], oid, clat[i] + 0.002, clng[i] - 0.002, 15, now());
    insert into public.technician_position_log (organization_id, profile_id, lat, lng, recorded_at)
      select oid, tech[i], 44.5085 + (clat[i]-44.5085)*g/6.0, 25.9800 + (clng[i]-25.9800)*g/6.0, now() - (6-g) * interval '5 minutes' from generate_series(0,6) g;
  end loop;

  -- certificate F-gaz și mașini (la Conformitate)
  for i in 1..3 loop
    insert into public.compliance_items (organization_id, kind, title, subject, profile_id, issued_on, expires_on, notes)
    values (oid, 'person', 'Certificat F-gaz (frigotehnist)', fnames[i+1], tech[i], current_date - 1200, current_date + (array[20, 240, 610])[i], 'Date de test');
    insert into public.compliance_items (organization_id, kind, title, subject, expires_on) values
      (oid,'vehicle','ITP',plates[i], current_date + (array[45, 160, -2])[i]),
      (oid,'vehicle','RCA',plates[i], current_date + (array[90, 30, 200])[i]);
  end loop;

  -- materiale de frig în atelier
  for i in 1..4 loop
    insert into public.materials (organization_id, name, category, unit, unit_cost, min_stock, kind)
    values (oid, (array['Agent frigorific R452A','Agent frigorific R404A','Filtru deshidrator 3/8','Ventilator condensator 300 mm'])[i], 'frig',
      (array['kg','kg','buc','buc'])[i], (array[180,140,85,420])[i], 2, 'material') returning id into uid;
    insert into public.material_stock (organization_id, material_id, warehouse_id, quantity) values (oid, uid, wid, (array[12,6,10,3])[i]);
  end loop;

  raise notice 'Firma de test creată: %', oid;
end
$frig$;
