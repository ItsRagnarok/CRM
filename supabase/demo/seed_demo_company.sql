-- Companie demo ElectroField: electric + gaze + fotovoltaic, 25 tehnicieni în 5 echipe, 10 clienți × 10 lucrări.
-- Date 100% fictive. Parola tuturor conturilor demo: 12345678 (doar pentru demo; schimb-o înainte de orice folosire reală).
-- Rulează o singură dată (se oprește dacă firma există deja). Ștergere: platform_admin_delete_company din Super Admin.
do $demo$
declare
  oid uuid; pw text := extensions.crypt('12345678', extensions.gen_salt('bf'));
  names text[] := array['Andrei Pop','Mihai Ionescu','Radu Munteanu','Florin Stan','Cătălin Dumitru','Bogdan Moldovan','Ionuț Șerban','Vlad Constantin','Sorin Lazăr','Adrian Toma','Dan Rusu','Cosmin Matei','Lucian Barbu','Marius Nistor','Alin Crăciun','Eugen Dobre','Paul Oprea','Răzvan Gheorghe','Tudor Neagu','Nicu Coman','Gabriel Preda','Horia Ardelean','Iulian Sima','Daniel Ene','Petru Vasile'];
  tech_ids uuid[] := '{}'; team_ids uuid[] := '{}'; veh_ids uuid[] := '{}'; cl_ids uuid[] := '{}'; loc_ids uuid[] := '{}'; mat_ids uuid[] := '{}'; mat_costs numeric[] := '{}';
  uid uuid; tid uuid; vid uuid; cid uuid; lid uuid; jid uuid; mid uuid; cnt int; i int; t int; c int; k int; m int;
  plates text[] := array['CJ 41 DMO','CJ 42 DMO','CJ 43 DMO','CJ 44 DMO','CJ 45 DMO'];
  tnames text[] := array['Echipa Electric A','Echipa Electric B','Echipa Gaze A','Echipa Gaze B','Echipa Fotovoltaic'];
  cnames text[] := array['Hotel Panoramic SRL','Familia Rusu (casă)','Asociația Bl. Observator 12','Fabrica Textil Nord SRL','Clinica Medis Sănătate','Familia Pop (casă)','Asociația Bl. Mărăști 4','Școala Gimnazială nr. 18','Dezvoltator Vest Residence','Pensiunea Valea Verde'];
  ctypes text[] := array['company','individual','company','company','company','individual','company','company','company','company'];
  caddr text[] := array['Str. Memorandumului 21, Cluj-Napoca','Str. Fabricii 8, Florești','Str. Observatorului 12, Cluj-Napoca','Calea Turzii 140, Cluj-Napoca','Str. Moților 5, Cluj-Napoca','Str. Plopilor 33, Apahida','Str. Aurel Vlaicu 4, Cluj-Napoca','Str. Frunzișului 18, Cluj-Napoca','Str. Eroilor 90, Florești','DN1 km 12, Gilău'];
  clat double precision[] := array[46.7694,46.7410,46.7600,46.7390,46.7810,46.7930,46.7720,46.7570,46.7430,46.7500];
  clng double precision[] := array[23.5930,23.4880,23.5850,23.6200,23.6040,23.7500,23.6150,23.5660,23.4870,23.3900];
  jt_el text[] := array['Înlocuire tablou electric','Instalație electrică apartament','Iluminat exterior parcare','Verificare PRAM și prize de pământ','Montaj stație de încărcare EV','Remediere avarie circuit'];
  jt_gz text[] := array['Verificare periodică instalație gaze','Revizie instalație gaze','Montaj centrală termică','Branșament gaze','Înlocuire detector gaz','Probă de etanșeitate'];
  jt_pv text[] := array['Montaj sistem fotovoltaic','Extindere panouri','Punere în funcțiune invertor','Service anual sistem fotovoltaic','Montaj baterie de stocare','Mentenanță panouri'];
  dom text; ttl text; jtype text; team_no int; mem int; d date; n int; st time; en time; dur numeric; ts_start timestamptz; ts_end timestamptz;
  done_cnt int[] := array[0,0,0,0,0]; fut_cnt int[] := array[0,0,0,0,0]; completed boolean; inv_total numeric; labor numeric; mats numeric; trav numeric; issued date; inv_no int := 0; jobseq int := 0; dist numeric;
begin
  if exists (select 1 from public.organizations where name = 'Instalații Demo Group SRL') then raise exception 'Compania demo există deja'; end if;
  insert into public.organizations (name, cui, email, phone, address, enabled_domains, enabled_modules, terms_accepted_at, hq_lat, hq_lng, fuel_cost_per_km)
    values ('Instalații Demo Group SRL','RO00000000','demo@example.test','0700000000','Str. Demo 1, Cluj-Napoca','{electric,gaze,fotovoltaic}','{conformitate,scadentar_gaze,dosar_fotovoltaic,buletine_electrice}',now(),46.7712,23.6236,1.2) returning id into oid;
  insert into public.subscriptions (organization_id, max_users) values (oid, 40);
  insert into public.warehouses (organization_id, name, is_central, address, lat, lng) values (oid,'Depozit central',true,'Str. Demo 1, Cluj-Napoca',46.7712,23.6236);

  -- admin + dispecer + 25 tehnicieni (conturi cu parola 12345678)
  for i in 0..26 loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,raw_app_meta_data,raw_user_meta_data,is_sso_user,is_anonymous,created_at,updated_at)
    values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',
      case when i=0 then 'admin@demo.electrofield.test' when i=1 then 'dispecer@demo.electrofield.test' else 'tehnician'||lpad((i-1)::text,2,'0')||'@demo.electrofield.test' end,
      pw,now(),'','','','','','','','{"provider":"email","providers":["email"]}','{}',false,false,now(),now());
    insert into auth.identities (id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values (gen_random_uuid(),uid::text,uid,jsonb_build_object('sub',uid::text,'email',case when i=0 then 'admin@demo.electrofield.test' when i=1 then 'dispecer@demo.electrofield.test' else 'tehnician'||lpad((i-1)::text,2,'0')||'@demo.electrofield.test' end,'email_verified',true),'email',now(),now(),now());
    insert into public.profiles (id, organization_id, role, full_name, phone)
    values (uid, oid, case when i=0 then 'admin'::user_role when i=1 then 'manager'::user_role else 'technician'::user_role end,
      case when i=0 then 'Elena Demo (administrator)' when i=1 then 'Maria Demo (dispecer)' else names[i-1] end,
      '07000001'||lpad(i::text,2,'0'));
    if i >= 2 then tech_ids := tech_ids || uid; end if;
  end loop;
  update public.profiles set hourly_rate = 38 + (abs(hashtext(id::text)) % 6) * 4 where organization_id = oid and role = 'technician';

  -- 5 echipe cu mașini
  for t in 1..5 loop
    insert into public.teams (organization_id, name, team_leader_id) values (oid, tnames[t], tech_ids[(t-1)*5+1]) returning id into tid;
    team_ids := team_ids || tid;
    for m in 1..5 loop insert into public.team_members (team_id, profile_id) values (tid, tech_ids[(t-1)*5+m]); end loop;
    insert into public.vehicles (organization_id, name, plate_number, assigned_team_id, driver_id)
      values (oid, case when t<=2 then 'Dacia Dokker' when t<=4 then 'Renault Kangoo' else 'Ford Transit' end || ' ' || t, plates[t], tid, tech_ids[(t-1)*5+1]) returning id into vid;
    veh_ids := veh_ids || vid;
  end loop;

  -- materiale
  for i in 1..8 loop
    insert into public.materials (organization_id, name, category, unit, unit_cost, min_stock, kind)
    values (oid, (array['Cablu CYY-F 3x2.5','Disjunctor 16A','Țeavă multistrat 20mm','Robinet gaz 1/2','Panou fotovoltaic 450W','Cablu solar 6mm','Detector gaz','Tablou electric 24 module'])[i],
      (array['electric','electric','gaze','gaze','fotovoltaic','fotovoltaic','gaze','electric'])[i], (array['m','buc','m','buc','buc','m','buc','buc'])[i],
      (array[4.5,18,12,35,420,6,160,210])[i], 5, 'material') returning id into mid;
    mat_ids := mat_ids || mid; mat_costs := mat_costs || (array[4.5,18,12,35,420,6,160,210])[i]::numeric;
    insert into public.material_stock (organization_id, material_id, warehouse_id, quantity) select oid, mid, w.id, 80 from public.warehouses w where w.organization_id = oid and w.is_central;
  end loop;

  -- 10 clienți
  for c in 1..10 loop
    insert into public.clients (organization_id, client_type, name, company_name, phone, email, address, lat, lng)
    values (oid, ctypes[c]::client_type, cnames[c], case when ctypes[c]='company' then cnames[c] end, '07001110'||lpad(c::text,2,'0'), 'client'||c||'@example.test', caddr[c], clat[c], clng[c]) returning id into cid;
    cl_ids := cl_ids || cid;
    insert into public.locations (organization_id, client_id, label, address, lat, lng) values (oid, cid, 'Locația principală', caddr[c], clat[c], clng[c]) returning id into lid;
    loc_ids := loc_ids || lid;
  end loop;

  -- 100 lucrări: 5 finalizate + 5 programate / client
  for c in 1..10 loop
    for k in 1..10 loop
      jobseq := jobseq + 1;
      completed := k <= 5;
      n := (c + k) % 3;
      if n = 0 then dom := 'electric'; ttl := jt_el[1 + (c*k) % 6]; jtype := (array['instalare','mentenanta','instalare','inspectie','instalare','reparatie'])[1 + (c*k) % 6]; team_no := 1 + (c + k) % 2;
      elsif n = 1 then dom := 'gaze'; ttl := jt_gz[1 + (c*k) % 6]; jtype := (array['inspectie','inspectie','instalare','instalare','service','inspectie'])[1 + (c*k) % 6]; team_no := 3 + (c * k) % 2;
      else dom := 'fotovoltaic'; ttl := jt_pv[1 + (c*k) % 6]; jtype := (array['instalare','instalare','service','service','instalare','mentenanta'])[1 + (c*k) % 6]; team_no := 5; end if;
      d := current_date; i := 0;
      if completed then
        done_cnt[team_no] := done_cnt[team_no] + 1;
        while i < done_cnt[team_no] loop d := d - 1; if extract(isodow from d) < 6 then i := i + 1; end if; end loop;
      else
        fut_cnt[team_no] := fut_cnt[team_no] + 1;
        while i < fut_cnt[team_no] loop d := d + 1; if extract(isodow from d) < 6 then i := i + 1; end if; end loop;
      end if;
      st := time '08:00' + ((c + k) % 3) * interval '1 hour';
      dur := 3 + (c * k) % 4;
      en := st + dur * interval '1 hour';
      dist := 8 + (c * k) % 30;
      ts_start := (d + st) at time zone 'Europe/Bucharest';
      ts_end := (d + en) at time zone 'Europe/Bucharest';
      insert into public.jobs (organization_id, client_id, location_id, team_id, job_type, title, description, scheduled_date, start_time, end_time, status, priority, domain,
          arrived_at, work_started_at, work_ended_at, distance_km, observations, admin_message, photo_guidance_before, photo_guidance_after, require_arrival_photo, require_final_photo)
      values (oid, cl_ids[c], loc_ids[c], team_ids[team_no], jtype::job_type, ttl || ' — ' || cnames[c], 
          'Lucrare demo #' || jobseq || ' · ' || ttl || ' la ' || caddr[c] || '. Acces: se sună beneficiarul cu 30 de minute înainte.',
          d, st, en, case when completed then 'finalizata' else 'programata' end::job_status,
          (case when (c + k) % 9 = 0 then 'urgenta' when (c + k) % 4 = 0 then 'ridicata' else 'normala' end)::job_priority, dom,
          case when completed then ts_start - interval '5 minutes' end, case when completed then ts_start end, case when completed then ts_end end,
          case when completed then dist end,
          case when completed then 'Lucrare finalizată conform planului. Beneficiar mulțumit; procesul-verbal semnat.' end,
          case when not completed then 'Verifică materialele din listă înainte de plecare și anunță beneficiarul la sosire.' end,
          case when not completed then 'Fotografiază instalația existentă înainte de intervenție.' end,
          case when not completed then 'Fotografiază lucrarea finalizată și panoul/centrala etichetate.' end,
          not completed, not completed)
      returning id into jid;
      for m in 1..5 loop insert into public.job_assignments (job_id, profile_id, assigned_role) values (jid, tech_ids[(team_no-1)*5+m], case when m=1 then 'lead' else 'member' end); end loop;
      if completed then
        insert into public.job_status_history (job_id, status, changed_by, created_at) values
          (jid,'in_drum',tech_ids[(team_no-1)*5+1], ts_start - interval '40 minutes'),
          (jid,'in_lucru',tech_ids[(team_no-1)*5+1], ts_start),
          (jid,'finalizata',tech_ids[(team_no-1)*5+1], ts_end);
        for m in 1..5 loop
          mem := (team_no-1)*5+m;
          insert into public.time_entries (organization_id, job_id, profile_id, event_type, lat, lng, occurred_at) values
            (oid,jid,tech_ids[mem],'travel_start',46.7712,23.6236, ts_start - interval '40 minutes' - (m * interval '1 minute')),
            (oid,jid,tech_ids[mem],'arrival',clat[c],clng[c], ts_start - interval '5 minutes' + (m * interval '30 seconds')),
            (oid,jid,tech_ids[mem],'work_start',clat[c],clng[c], ts_start + (m * interval '1 minute'));
          if dur >= 5 then
            insert into public.time_entries (organization_id, job_id, profile_id, event_type, lat, lng, occurred_at) values
              (oid,jid,tech_ids[mem],'break_start',clat[c],clng[c], ts_start + interval '2 hours'),
              (oid,jid,tech_ids[mem],'break_end',clat[c],clng[c], ts_start + interval '2 hours 30 minutes');
          end if;
          insert into public.time_entries (organization_id, job_id, profile_id, event_type, lat, lng, occurred_at)
            values (oid,jid,tech_ids[mem],'work_end',clat[c],clng[c], ts_end + (m * interval '2 minutes'));
        end loop;
        -- materiale consumate
        insert into public.material_usage (organization_id, job_id, material_id, quantity, source_vehicle_id, used_by, used_at)
          values (oid, jid, mat_ids[1 + (jobseq % 8)], 2 + jobseq % 9, veh_ids[team_no], tech_ids[(team_no-1)*5+1], ts_end - interval '1 hour');
        if jobseq % 3 = 0 then
          insert into public.expenses (organization_id, job_id, submitted_by, category, amount, vendor, expense_date, status, paid_with, notes)
            values (oid, jid, tech_ids[(team_no-1)*5+1], 'combustibil', 90 + jobseq % 70, 'Benzinărie demo', d, case when jobseq % 6 = 0 then 'pending' else 'approved' end, 'company', 'Combustibil deplasare');
        end if;
        -- facturare: ~25% rămân nefacturate (apar la „bani pierduți”); 2 din ele au cerere de facturare de la tehnician
        if (c + k) % 4 <> 0 then
          inv_no := inv_no + 1; issued := d + 1;
          labor := dur * 5 * 55; mats := (mat_costs[1 + (jobseq % 8)] * (2 + jobseq % 9)); trav := dist * 2.5;
          inv_total := round(labor + mats + trav, 2);
          insert into public.invoices (organization_id, job_id, client_id, invoice_number, labor_amount, materials_amount, travel_amount, other_amount, status, issued_at, due_date)
            values (oid, jid, cl_ids[c], 'DEMO-' || lpad(inv_no::text, 4, '0'), labor, mats, trav, 0,
              case when issued < current_date - 30 and c % 3 = 0 then 'overdue' when issued < current_date - 30 then 'paid' when jobseq % 2 = 0 then 'paid' else 'unpaid' end,
              issued, issued + 15);
        elsif jobseq % 8 = 0 then
          insert into public.billing_requests (organization_id, job_id, requested_by, collected_method, collected_amount, note, status)
            values (oid, jid, tech_ids[(team_no-1)*5+1], 'numerar', 300 + jobseq, 'Încasat cash la fața locului, de facturat.', 'new');
        end if;
      else
        insert into public.job_required_items (organization_id, job_id, kind, material_id, quantity_needed, created_by)
          values (oid, jid, 'material', mat_ids[1 + (jobseq % 8)], 4 + jobseq % 6, tech_ids[(team_no-1)*5+1]),
                 (oid, jid, 'material', mat_ids[1 + ((jobseq + 3) % 8)], 1 + jobseq % 4, tech_ids[(team_no-1)*5+1]);
      end if;
    end loop;
  end loop;

  -- gaze: 2 blocuri cu apartamente, o parte cu verificare depășită
  for c in 3..4 loop
    insert into public.gas_buildings (organization_id, client_id, name, address) values (oid, cl_ids[case when c=3 then 3 else 7 end], case when c=3 then 'Bl. Observator 12' else 'Bl. Mărăști 4' end, caddr[case when c=3 then 3 else 7 end]) returning id into mid;
    for i in 1..14 loop
      insert into public.gas_units (organization_id, building_id, stair, apartment, owner_name, phone, last_inspection_on, last_revision_on, contact_status, scheduled_on)
      values (oid, mid, case when i <= 7 then 'A' else 'B' end, i::text, 'Proprietar ap. ' || i, '07002220' || lpad((c*20+i)::text,2,'0'),
        current_date - ((i * 37 + c * 11) % 900), case when i % 5 = 0 then current_date - 4000 end,
        (array['neprogramat','programat','nu_raspunde','efectuat','neprogramat'])[1 + i % 5], case when i % 5 = 1 then current_date + (i % 10) + 2 end);
    end loop;
  end loop;

  -- fotovoltaic: 6 dosare în etape diferite (unele cu termen operator depășit)
  insert into public.pv_projects (organization_id, client_id, name, address, contact_name, contact_phone, kwp, stage, operator_name, atr_number, offer_sent_on, contract_signed_on, advance_received_on, install_on, atr_filed_on, atr_received_on, cert_requested_on, cert_received_on, afm_filed_on, warranty_until)
  select oid, cl_ids[cc], pn, caddr[cc], 'Contact ' || cc, '0700333' || lpad(cc::text,3,'0'), kw, stg, 'Operator demo', ar,
    current_date - 120 + cc, case when sg >= 1 then current_date - 100 + cc end, case when sg >= 1 then current_date - 95 + cc end, case when sg >= 2 then current_date - 60 + cc end,
    case when sg >= 3 then current_date - atr_f end, case when sg >= 4 then current_date - 5 end, case when sg >= 5 then current_date - 3 end, null, null, case when sg >= 6 then current_date + 700 end
  from (values (1,'Hotel Panoramic — 120 kWp',120,'atr',3,'ATR/2026/118',22),(2,'Casă Rusu — 8,8 kWp',8.8,'montaj',2,null,0),(4,'Fabrica Textil Nord — 250 kWp',250,'atr',3,'ATR/2026/131',31),(8,'Școala nr. 18 — 40 kWp',40,'contract',1,null,0),(9,'Ansamblu Vest Residence — 60 kWp',60,'punere_in_functiune',5,'ATR/2026/090',12),(10,'Pensiunea Valea Verde — 15 kWp',15,'oferta',0,null,0)) v(cc,pn,kw,stg,sg,ar,atr_f);

  -- conformitate: ANRE (10 persoane), mașini, aparate
  for i in 1..10 loop
    insert into public.compliance_items (organization_id, kind, title, subject, profile_id, domain, issued_on, expires_on, notes)
    values (oid, 'person', case when i <= 5 then 'Autorizație ANRE grad IIB' else 'Legitimație instalator gaze' end, names[i], tech_ids[i], case when i <= 5 then 'electric' else 'gaze' end,
      current_date - 1400, current_date + (array[-12, 18, 45, 200, 400, 25, 90, 600, 12, 300])[i], 'Date demo');
  end loop;
  for i in 1..5 loop
    insert into public.compliance_items (organization_id, kind, title, subject, expires_on) values
      (oid,'vehicle','ITP',plates[i], current_date + (array[-3, 40, 130, 210, 20])[i]),
      (oid,'vehicle','RCA',plates[i], current_date + (array[60, 15, 160, 300, 250])[i]);
  end loop;
  insert into public.compliance_items (organization_id, kind, title, subject, expires_on, domain) values
    (oid,'device','Calibrare multimetru','Fluke 117 SN 4471', current_date + 35,'electric'),
    (oid,'device','Calibrare analizor gaze','Testo 330 SN 1190', current_date - 8,'gaze'),
    (oid,'device','Calibrare tester izolație','Megger MIT 410 SN 8820', current_date + 200,'electric');
  raise notice 'Compania demo creată: %', oid;
end
$demo$;
