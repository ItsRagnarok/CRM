-- Firmă de test Electrogaze SRL (nișa gaze), pentru testarea platformei și a aplicației.
-- Date fictive. Parola tuturor conturilor: Parola1029 (doar pentru test; schimb-o înainte de folosire reală).
-- Conturi: cezar.ardelean@electrogaze.test (administrator), alexandru.bata@electrogaze.test (manager),
-- 8 tehnicieni prenume.nume@electrogaze.test. Rulează o singură dată (se oprește dacă firma există).
-- Ștergere: platform_admin_delete_company din Super Admin.
do $seed$
declare
  oid uuid; pw text := extensions.crypt('Parola1029', extensions.gen_salt('bf'));
  -- 0 = administrator, 1 = manager, 2..9 = tehnicieni (2..5 echipa 1, 6..9 echipa 2; primul din fiecare = șef de echipă, ultimul = șofer)
  pnames text[] := array['Cezar Ardelean','Alexandru Bâtă','Ionuț Sabău','Marius Dragoș','Florin Coroian','Adrian Bota','Dorel Mureșan','Sergiu Pașca','Lucian Hossu','Vlad Rus'];
  pemails text[] := array['cezar.ardelean','alexandru.bata','ionut.sabau','marius.dragos','florin.coroian','adrian.bota','dorel.muresan','sergiu.pasca','lucian.hossu','vlad.rus'];
  -- cost orar pentru firmă (lei): șef de echipă, instalator, ajutor, ajutor-șofer
  prates numeric[] := array[null,null,55,45,32,32,55,45,32,32];
  uids uuid[] := '{}'; team_ids uuid[] := '{}'; veh_ids uuid[] := '{}'; cl_ids uuid[] := '{}'; loc_ids uuid[] := '{}'; mat_ids uuid[] := '{}'; mat_costs numeric[] := '{}'; bld_ids uuid[] := '{}';
  uid uuid; tid uuid; vid uuid; cid uuid; lid uuid; jid uuid; mid uuid; i int; t int; c int; k int; m int; j int;
  -- clienți: nume, tip, adresă, lat, lng
  cnames text[] := array['Asociația de proprietari Bl. M7 Mănăștur','Asociația de proprietari Bl. 14 Gheorgheni','Asociația de proprietari Bl. B3 Zorilor','Familia Pop (casă)','Familia Moldovan (casă)','Ioana Rus (apartament)','Restaurant Casa Veche SRL','Pensiunea Dealul Feleacului','Școala Gimnazială „Avram Iancu”','Vest Residence Development SRL','Familia Crișan (casă nouă)','Cafeneaua Boema SRL'];
  ctypes text[] := array['company','company','company','individual','individual','individual','company','company','company','company','individual','company'];
  caddr text[] := array['Str. Mehedinți 41, Cluj-Napoca','Str. Alverna 22, Cluj-Napoca','Str. Observatorului 104, Cluj-Napoca','Str. Livezii 12, Florești','Str. Viilor 7, Baciu','Str. Donath 63, ap. 18, Cluj-Napoca','Str. Napoca 5, Cluj-Napoca','Str. Principală 210, Feleacu','Str. Horea 54, Cluj-Napoca','Str. Eroilor 120, Florești','Str. Câmpului 88, Apahida','Str. Iuliu Maniu 9, Cluj-Napoca'];
  clat double precision[] := array[46.7560,46.7680,46.7535,46.7445,46.7965,46.7790,46.7705,46.7120,46.7795,46.7430,46.8040,46.7698];
  clng double precision[] := array[23.5480,23.6230,23.5870,23.4950,23.5260,23.5650,23.5870,23.5960,23.5900,23.4840,23.7280,23.5890];
  -- tipuri de lucrări: titlu, tip, echipa (1 = verificări/revizii, 2 = execuție/intervenții), durată (ore), manoperă (lei), descriere
  jt_title text[] := array['Verificări periodice pe bloc','Verificare periodică instalație gaze','Revizie instalație gaze (10 ani)','Montaj detector gaz cu electroventil','Înlocuire racord flexibil aragaz','Remediere scăpare de gaze','Montaj centrală termică în condensare','Mutare aragaz și modificare instalație','Instalație de utilizare gaze casă nouă','Probă de presiune și recepție instalație','Verificare instalație gaze bucătărie profesională','Montaj plită pe gaz și racordare'];
  jt_type text[] := array['inspectie','inspectie','inspectie','instalare','service','urgenta','instalare','reparatie','instalare','inspectie','inspectie','instalare'];
  jt_team int[] := array[1,1,1,1,1,2,2,2,2,2,1,1];
  jt_hours numeric[] := array[6,1,2,2,1,2,6,4,8,3,3,1.5];
  jt_price numeric[] := array[560,180,450,300,150,300,1100,600,6500,600,900,200];
  jt_mat int[] := array[8,8,2,3,1,2,2,4,5,12,1,1];
  jt_desc text[] := array[
    'Verificare periodică (la 2 ani) pe scară, apartament cu apartament, conform Ord. ANRE 179/2015. Pe telefon: lista apartamentelor, fișa de evidență pe fiecare, absenții se reprogramează.',
    'Verificare tehnică periodică (la 2 ani): etanșeitate cu spumă, arzătoare, racord, detector, documente coș și ISCIR. Se completează fișa de evidență pe telefon.',
    'Revizie tehnică la 10 ani: probă de etanșeitate cu aer comprimat pe toată instalația, verificarea aparatelor și a documentelor. Fișa de revizie pe telefon.',
    'Montaj detector automat de gaz cu electroventil pe intrarea în bucătărie, test cu butonul „Test”, mențiune în fișă.',
    'Înlocuire racord flexibil expirat la aragaz (racord 1/2" omologat, 1 m), probă de etanșeitate cu spumă.',
    'Intervenție: miros de gaz semnalat de client. Închidere alimentare, localizare cu detectorul, remediere sau scoatere din uz, probă refăcută; anunț la operator dacă nu se remediază pe loc.',
    'Demontare centrală veche, montaj centrală în condensare, racord gaz și evacuare, probe, punere în funcțiune; VTP cu firma ISCIR parteneră.',
    'Mutare aragaz pe peretele opus, prelungire traseu în țeavă OL 1/2" aparentă, probă de presiune, actualizare documentație.',
    'Execuție instalație de utilizare gaze la casă nouă după proiect: traseu exterior PE, interior OL, robinete, probe de rezistență și etanșeitate, recepție.',
    'Probă de rezistență și etanșeitate pe instalația executată, proces-verbal de probă și dosar pentru recepție.',
    'Verificare instalație de gaze în bucătăria profesională: arzătoare plite și cuptoare, electroventil, detectoare, ventilație.',
    'Montaj plită nouă pe gaz, racord flexibil și robinet, probă de etanșeitate cu spumă, instruirea clientului.'];
  -- materiale
  mnames text[] := array['Racord flexibil gaz 1/2" 1 m','Robinet sferic gaz 1/2"','Detector gaz cu electroventil 3/4"','Țeavă OL 1/2" (m)','Țeavă PE100 32 mm (m)','Cot OL 1/2"','Bandă teflon gaz','Spray detectare scăpări','Brățară prindere țeavă 1/2"','Fitinguri PE electrofuziune 32 mm','Garnitură racord 1/2"','Teu OL 1/2"'];
  munits text[] := array['buc','buc','buc','m','m','buc','rolă','buc','buc','buc','buc','buc'];
  mcosts numeric[] := array[45,38,420,28,14,9,12,35,4,32,2,11];
  plates text[] := array['CJ 10 EGZ','CJ 20 EGZ'];
  d date; st time; en time; dur numeric; ts_start timestamptz; ts_end timestamptz; jt int; team_no int; completed boolean; cli int; inv_no int := 0; jobseq int := 0;
  lead_idx int; members int[]; dist numeric; labor numeric; mats numeric; qty numeric;
begin
  if exists (select 1 from public.organizations where name = 'Electrogaze SRL') then raise exception 'Firma Electrogaze SRL există deja'; end if;
  insert into public.organizations (name, cui, email, phone, address, enabled_domains, enabled_modules, terms_accepted_at, hq_lat, hq_lng, fuel_cost_per_km, gas_inspection_months, gas_revision_months)
    values ('Electrogaze SRL', 'RO00000101', 'office@electrogaze.test', '0700100100', 'Str. Fabricii de Zahăr 18, Cluj-Napoca', '{gaze}', '{scadentar_gaze,conformitate}', now(), 46.7840, 23.6110, 1.3, 24, 120)
    returning id into oid;
  insert into public.subscriptions (organization_id, max_users) values (oid, 15);
  insert into public.warehouses (organization_id, name, is_central, address, lat, lng) values (oid, 'Depozit Fabricii de Zahăr', true, 'Str. Fabricii de Zahăr 18, Cluj-Napoca', 46.7840, 23.6110);

  -- conturi (parola Parola1029)
  for i in 1..10 loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,raw_app_meta_data,raw_user_meta_data,is_sso_user,is_anonymous,created_at,updated_at)
    values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated', pemails[i] || '@electrogaze.test',
      pw,now(),'','','','','','','','{"provider":"email","providers":["email"]}','{}',false,false,now(),now());
    insert into auth.identities (id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values (gen_random_uuid(),uid::text,uid,jsonb_build_object('sub',uid::text,'email',pemails[i] || '@electrogaze.test','email_verified',true),'email',now(),now(),now());
    insert into public.profiles (id, organization_id, role, full_name, phone, hourly_rate)
    values (uid, oid, (case when i = 1 then 'admin' when i = 2 then 'manager' when i in (3, 7) then 'team_leader' else 'technician' end)::user_role,
      pnames[i], '07001002' || lpad(i::text, 2, '0'), prates[i]);
    uids := uids || uid;
  end loop;

  -- 2 echipe × 4, câte o mașină cu șofer
  for t in 1..2 loop
    insert into public.teams (organization_id, name, team_leader_id)
      values (oid, case when t = 1 then 'Echipa 1 · Verificări și revizii' else 'Echipa 2 · Execuție și intervenții' end, uids[3 + (t-1)*4]) returning id into tid;
    team_ids := team_ids || tid;
    for m in 0..3 loop insert into public.team_members (team_id, profile_id) values (tid, uids[3 + (t-1)*4 + m]); end loop;
    insert into public.vehicles (organization_id, name, plate_number, assigned_team_id, driver_id)
      values (oid, case when t = 1 then 'Dacia Dokker Van' else 'Renault Kangoo Van' end, plates[t], tid, uids[6 + (t-1)*4]) returning id into vid;
    veh_ids := veh_ids || vid;
  end loop;

  -- materiale în depozit
  for i in 1..array_length(mnames, 1) loop
    insert into public.materials (organization_id, name, category, unit, unit_cost, min_stock, kind)
      values (oid, mnames[i], 'gaze', munits[i], mcosts[i], case when mcosts[i] > 100 then 2 else 10 end, 'material') returning id into mid;
    mat_ids := mat_ids || mid; mat_costs := mat_costs || mcosts[i];
    insert into public.material_stock (organization_id, material_id, warehouse_id, quantity)
      select oid, mid, w.id, case when mcosts[i] > 100 then 6 else 60 end from public.warehouses w where w.organization_id = oid and w.is_central;
  end loop;

  -- clienți și locații
  for c in 1..array_length(cnames, 1) loop
    insert into public.clients (organization_id, client_type, name, company_name, phone, email, address, lat, lng)
      values (oid, ctypes[c]::client_type, cnames[c], case when ctypes[c] = 'company' then cnames[c] end, '07001003' || lpad(c::text, 2, '0'), 'client' || c || '@electrogaze-clienti.test', caddr[c], clat[c], clng[c])
      returning id into cid;
    cl_ids := cl_ids || cid;
    insert into public.locations (organization_id, client_id, label, address, lat, lng) values (oid, cid, 'Locația principală', caddr[c], clat[c], clng[c]) returning id into lid;
    loc_ids := loc_ids || lid;
  end loop;

  -- 3 blocuri în scadențar (asociațiile 1–3), câte 20 de apartamente
  for c in 1..3 loop
    insert into public.gas_buildings (organization_id, client_id, name, address)
      values (oid, cl_ids[c], (array['Bl. M7 Mănăștur','Bl. 14 Gheorgheni','Bl. B3 Zorilor'])[c], caddr[c]) returning id into mid;
    bld_ids := bld_ids || mid;
    for i in 1..20 loop
      insert into public.gas_units (organization_id, building_id, stair, apartment, owner_name, phone, last_inspection_on, last_revision_on, contact_status, scheduled_on, hose_valid_until, detector_valid_until)
      values (oid, mid, case when i <= 10 then '1' else '2' end, i::text,
        (array['Ana','Mihai','Elena','Vasile','Ioana','Gheorghe','Maria','Dan','Cristina','Radu'])[1 + (i + c) % 10] || ' ' || (array['Pop','Rus','Moldovan','Mureșan','Bucur','Feher','Sabo','Lazăr','Cozma','Ilieș'])[1 + (i * 3 + c) % 10],
        '07002003' || lpad((c * 20 + i)::text, 2, '0'),
        current_date - (650 + (i * 41 + c * 17) % 160), case when i % 6 = 0 then current_date - (3400 + i * 20) end,
        'neprogramat', null,
        case when i % 4 = 0 then current_date - 30 else current_date + 200 + i * 15 end,
        case when i % 5 = 0 then current_date - 60 when i % 3 = 0 then current_date + 400 end);
    end loop;
  end loop;

  -- lucrări: 36 finalizate (ultimele ~6 săptămâni) + 22 programate (următoarele ~3 săptămâni)
  for j in 1..58 loop
    jobseq := j;
    completed := j <= 36;
    jt := 1 + (j * 7) % 12;
    team_no := jt_team[jt];
    -- clientul potrivit lucrării: blocurile (asociațiile) au verificări pe scară, restaurantele au bucătăria, casele noi au execuție
    cli := case
      when jt = 1 then 1 + (j % 3)
      when jt in (2, 3, 5, 12) then (array[4, 5, 6, 11])[1 + j % 4]
      when jt = 4 then (array[4, 5, 6, 8, 12])[1 + j % 5]
      when jt = 6 then (array[4, 5, 6, 7, 12])[1 + j % 5]
      when jt = 7 then (array[4, 5, 8, 9])[1 + j % 4]
      when jt = 8 then (array[4, 6, 7, 12])[1 + j % 4]
      when jt in (9, 10) then (array[10, 11])[1 + j % 2]
      else (array[7, 12])[1 + j % 2] end;
    d := current_date;
    if completed then
      i := 0; while i < 1 + (j * 29) / 36 loop d := d - 1; if extract(isodow from d) < 6 then i := i + 1; end if; end loop;
    elsif j > 39 then
      i := 0; while i < 1 + ((j - 40) * 15) / 19 loop d := d + 1; if extract(isodow from d) < 6 then i := i + 1; end if; end loop;
    end if; -- lucrările 37–39 sunt programate azi, ca să apară în aplicație imediat
    dur := least(jt_hours[jt], 8);
    st := time '08:00' + ((j % 3) * interval '2 hours');
    if st + dur * interval '1 hour' > time '18:00' then st := time '08:00'; end if;
    en := st + dur * interval '1 hour';
    ts_start := (d + st) at time zone 'Europe/Bucharest';
    ts_end := (d + en) at time zone 'Europe/Bucharest';
    dist := 4 + (j * 13) % 22;
    insert into public.jobs (organization_id, client_id, location_id, team_id, job_type, title, description, scheduled_date, start_time, end_time, status, priority, domain,
        arrived_at, work_started_at, work_ended_at, distance_km, observations, admin_message, require_arrival_photo, require_during_photo, require_final_photo, gas_building_id)
    values (oid, cl_ids[cli], loc_ids[cli], team_ids[team_no], jt_type[jt]::job_type,
        case when jt = 1 then jt_title[jt] || ' — ' || (array['Bl. M7 Mănăștur','Bl. 14 Gheorgheni','Bl. B3 Zorilor'])[cli] else jt_title[jt] || ' — ' || cnames[cli] end,
        jt_desc[jt], d, st, en, (case when completed then 'finalizata' else 'programata' end)::job_status,
        (case when jt = 6 then 'urgenta' when jt in (7, 9) then 'ridicata' else 'normala' end)::job_priority, 'gaze',
        case when completed then ts_start - interval '5 minutes' end, case when completed then ts_start end, case when completed then ts_end end,
        case when completed then dist end,
        case when completed then (array['Lucrare finalizată, fișa completată și semnată de client.','Finalizat. Clientul a primit instrucțiunile de utilizare.','Probă de etanșeitate admisă, documente predate.'])[1 + j % 3] end,
        case when not completed then (array['Sunați clientul cu 30 de minute înainte.','Luați detectorul portabil și spray-ul de detectare.','Verificați documentele de coș la sosire.'])[1 + j % 3] end,
        not completed and jt > 3, false, not completed and jt > 3,
        case when jt = 1 then bld_ids[cli] end)
    returning id into jid;
    -- echipa întreagă pe lucrări mari, 2 oameni pe verificări/intervenții mici
    members := case when dur >= 4 then array[0, 1, 2, 3] else array[0, 1] end;
    foreach m in array members loop
      insert into public.job_assignments (job_id, profile_id, assigned_role) values (jid, uids[3 + (team_no - 1) * 4 + m], case when m = 0 then 'lead' else 'member' end);
    end loop;
    if completed then
      insert into public.job_status_history (job_id, status, changed_by, created_at) values
        (jid, 'in_drum', uids[3 + (team_no - 1) * 4], ts_start - interval '30 minutes'),
        (jid, 'in_lucru', uids[3 + (team_no - 1) * 4], ts_start),
        (jid, 'finalizata', uids[3 + (team_no - 1) * 4], ts_end);
      foreach m in array members loop
        insert into public.time_entries (organization_id, job_id, profile_id, event_type, lat, lng, occurred_at) values
          (oid, jid, uids[3 + (team_no - 1) * 4 + m], 'travel_start', 46.7840, 23.6110, ts_start - interval '30 minutes'),
          (oid, jid, uids[3 + (team_no - 1) * 4 + m], 'arrival', clat[cli], clng[cli], ts_start - interval '5 minutes'),
          (oid, jid, uids[3 + (team_no - 1) * 4 + m], 'work_start', clat[cli], clng[cli], ts_start + m * interval '1 minute'),
          (oid, jid, uids[3 + (team_no - 1) * 4 + m], 'work_end', clat[cli], clng[cli], ts_end + m * interval '2 minutes');
      end loop;
      qty := case when munits[jt_mat[jt]] = 'm' then 4 + j % 8 else 1 + j % 2 end;
      insert into public.material_usage (organization_id, job_id, material_id, quantity, source_vehicle_id, used_by, used_at)
        values (oid, jid, mat_ids[jt_mat[jt]], qty, veh_ids[team_no], uids[3 + (team_no - 1) * 4], ts_end - interval '20 minutes');
      if j % 4 = 0 then
        insert into public.expenses (organization_id, job_id, submitted_by, category, amount, vendor, expense_date, status, paid_with, notes)
          values (oid, jid, uids[3 + (team_no - 1) * 4], 'combustibil', 120 + j % 60, 'OMV Calea Turzii', d, case when j % 8 = 0 then 'pending' else 'approved' end, 'company', 'Motorină deplasări');
      end if;
      -- facturi: aproape toate; câteva rămân nefacturate sau neîncasate
      if j % 6 <> 0 then
        inv_no := inv_no + 1;
        labor := jt_price[jt]; mats := mat_costs[jt_mat[jt]] * qty;
        insert into public.invoices (organization_id, job_id, client_id, invoice_number, labor_amount, materials_amount, travel_amount, other_amount, status, issued_at, due_date)
          values (oid, jid, cl_ids[cli], 'EGZ-' || lpad(inv_no::text, 4, '0'), labor, mats, round(dist * 1.5, 2), 0,
            case when d < current_date - 20 and j % 5 = 0 then 'overdue' when j % 3 = 0 then 'unpaid' else 'paid' end, d, d + 15);
      end if;
    else
      insert into public.job_required_items (organization_id, job_id, kind, material_id, quantity_needed, created_by)
        values (oid, jid, 'material', mat_ids[jt_mat[jt]], case when munits[jt_mat[jt]] = 'm' then 10 else 2 end, uids[2]);
    end if;
  end loop;

  -- conformitate: autorizația firmei, legitimațiile, mașinile, aparatele de măsură
  insert into public.compliance_items (organization_id, kind, title, subject, domain, issued_on, expires_on, notes) values
    (oid, 'company', 'Autorizație ANRE EDIB', 'Electrogaze SRL', 'gaze', current_date - 900, current_date + 195, 'Proiectare și execuție instalații de utilizare gaze (date de test)');
  -- legitimații ANRE EGIU pentru șefii de echipă și instalatori; ajutorii lucrează sub coordonarea lor (Ord. ANRE 83/2014)
  for i in 3..10 loop
    if i in (3, 4, 7, 8) then
      insert into public.compliance_items (organization_id, kind, title, subject, profile_id, domain, issued_on, expires_on, notes)
      values (oid, 'person', 'Legitimație ANRE EGIU', pnames[i], uids[i], 'gaze', current_date - 1500,
        current_date + (array[40, 380, 0, 0, 14, 520])[i - 2], 'Valabilă 5 ani; prelungirea se cere cu cel puțin 30 de zile înainte (date de test)');
    end if;
    insert into public.compliance_items (organization_id, kind, title, subject, profile_id, domain, issued_on, expires_on, notes)
    values (oid, 'person', 'Instructaj SSM periodic', pnames[i], uids[i], 'gaze', current_date - 170, current_date + (array[10, 10, -4, 10, 10, 10, 25, 10])[i - 2], 'Date de test');
  end loop;
  for t in 1..2 loop
    insert into public.compliance_items (organization_id, kind, title, subject, expires_on) values
      (oid, 'vehicle', 'ITP', plates[t], current_date + (array[22, 160])[t]),
      (oid, 'vehicle', 'RCA', plates[t], current_date + (array[75, 11])[t]),
      (oid, 'vehicle', 'Rovinietă', plates[t], current_date + (array[140, 200])[t]);
  end loop;
  insert into public.compliance_items (organization_id, kind, title, subject, expires_on, domain) values
    (oid, 'device', 'Calibrare manometru digital', 'Manometru Testo 510i SN 4021', current_date + 48, 'gaze'),
    (oid, 'device', 'Calibrare detector portabil CH4', 'Detector GasAlert SN 7713', current_date - 6, 'gaze'),
    (oid, 'device', 'Calibrare analizor de ardere', 'Testo 300 SN 2290', current_date + 230, 'gaze');
  raise notice 'Electrogaze SRL creată: %', oid;
end
$seed$;
