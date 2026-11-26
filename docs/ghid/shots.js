const { chromium, devices } = require('playwright');
const B = 'https://www.electrofield.ro';
const ID = { job_fin: '0f1d9613-76d6-46f5-afae-fe45c8160ca7', job_lucru: '8fb03271-5571-4d0f-87aa-847c556ee179', job_el: 'eaa2e88a-d71d-432d-98c1-d5f17399635c', client: '47d54537-a28e-4dd2-9946-2ca13b31f0bb', bloc: 'e070f00d-e17a-4be4-bf2b-d1aa6233593c', pv: '95c65cd8-94c4-4b98-b599-d207665b6320', material: '58d24765-b6d1-4f20-8763-d89c22952fc7', team: 'e28d5d93-373e-44b3-83f3-10ab672a820c', invoice: '0e922562-b88a-45f5-940d-6efc817c0592', req: '47d5f621-5980-48ae-9874-33da91047af7', status: '83e133f7-1cbf-4a8c-96b3-4f0b1f436873', tech_job: 'ed92bcd2-ed66-409f-8406-2f213995fc19' };
const office = [
  ['dashboard','/dashboard'],['luni','/luni'],['cereri','/cereri'],['lucrari','/lucrari'],['lucrare','/lucrari/'+ID.job_fin],['lucrare_noua','/lucrari/nou'],
  ['calendar','/calendar'],['echipe','/echipe'],['echipa','/echipe/'+ID.team],['harta','/harta'],
  ['gaze','/gaze'],['gaze_bloc','/gaze/'+ID.bloc],['gaze_fise','/gaze/fise'],['gaze_registru','/gaze/registru'],
  ['pv','/fotovoltaic'],['pv_dosar','/fotovoltaic/'+ID.pv],['electric','/electric'],['electric_lucrare','/electric/'+ID.job_el],
  ['clienti','/clienti'],['client','/clienti/'+ID.client],['facturare','/facturare'],['factura_noua','/facturare/noua'],['factura','/facturare/'+ID.invoice],
  ['conformitate','/conformitate'],['ssm','/ssm'],['materiale','/materiale'],['masini','/materiale/masini'],['scule','/materiale/scule'],['aprobari','/aprobari'],['foaie','/foaie-parcurs'],
  ['pontaj','/pontaj'],['concedii','/pontaj/concedii'],['cheltuieli','/cheltuieli'],['rapoarte','/rapoarte'],['mesaje','/mesaje'],['notificari','/notificari'],
  ['setari','/setari'],['setari_util','/setari?tab=utilizatori'],['setari_integr','/setari?tab=integrari'],['setari_ai','/setari?tab=ai'],['setari_gps','/setari?tab=gps'],
];
const mobile = [
  ['m_acasa','/mobil'],['m_lucrari','/mobil/lucrari'],['m_lucrare','/mobil/lucrari/'+ID.tech_job],['m_foto','/mobil/lucrari/'+ID.tech_job+'/foto'],['m_checklist','/mobil/lucrari/'+ID.tech_job+'/checklist'],
  ['m_semnatura','/mobil/lucrari/'+ID.tech_job+'/semnatura'],['m_finalizare','/mobil/lucrari/'+ID.tech_job+'/finalizare'],['m_scaneaza','/mobil/scaneaza'],['m_mesaje','/mobil/mesaje'],['m_meniu','/mobil/meniu'],
  ['m_materiale','/mobil/materiale'],['m_scule','/mobil/scule'],['m_pontaj','/mobil/pontaj'],['m_cheltuieli','/mobil/cheltuieli/noua'],['m_ssm','/mobil/ssm'],['m_incident','/mobil/ssm/incident'],
  ['m_concediu','/mobil/concediu'],['m_documente','/mobil/documente'],['m_harta','/mobil/harta'],['m_setari','/mobil/setari'],
];
const pub = [['p_status','/status/'+ID.status],['p_solicitare','/solicitare/'+ID.req],['p_login','/login'],['p_home','/'],['p_programare','/programare']];
(async () => {
  const b = await chromium.launch();
  const d = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await d.newPage();
  await p.goto(B + '/login'); await p.fill('input[type=email]', 'admin@demo.electrofield.test'); await p.fill('input[type=password]', '12345678'); await p.click('button[type=submit]');
  await p.waitForURL(/dashboard|luni/, { timeout: 60000 });
  for (const [n, path] of office) {
    try { await p.goto(B + path, { waitUntil: 'networkidle', timeout: 45000 }); await p.waitForTimeout(700); await p.screenshot({ path: require('path').join(__dirname, 'img', `${n}.jpg`), type: 'jpeg', quality: 72 }); process.stdout.write(n + ' '); }
    catch (e) { console.log('\nEROARE', n, e.message.slice(0, 80)); }
  }
  const m = await b.newContext({ ...devices['iPhone 14 Pro'] });
  const q = await m.newPage();
  await q.goto(B + '/mobil-login'); await q.fill('input[type=email]', 'tehnician01@demo.electrofield.test'); await q.fill('input[type=password]', '12345678'); await q.click('button[type=submit]');
  await q.waitForURL(u => new URL(u).pathname === '/mobil' || new URL(u).pathname.startsWith('/mobil/'), { timeout: 60000 });
  for (const [n, path] of mobile) {
    try { await q.goto(B + path, { waitUntil: 'networkidle', timeout: 45000 }); await q.waitForTimeout(700); await q.screenshot({ path: require('path').join(__dirname, 'img', `${n}.jpg`), type: 'jpeg', quality: 72 }); process.stdout.write(n + ' '); }
    catch (e) { console.log('\nEROARE', n, e.message.slice(0, 80)); }
  }
  const x = await b.newContext({ viewport: { width: 1280, height: 860 } }); const r = await x.newPage();
  const xm = await b.newContext({ ...devices['iPhone 14 Pro'] }); const rm = await xm.newPage();
  for (const [n, path] of pub) {
    try { const page = n === 'p_status' || n === 'p_solicitare' ? rm : r; await page.goto(B + path, { waitUntil: 'networkidle', timeout: 45000 }); await page.waitForTimeout(700); await page.screenshot({ path: require('path').join(__dirname, 'img', `${n}.jpg`), type: 'jpeg', quality: 72 }); process.stdout.write(n + ' '); }
    catch (e) { console.log('\nEROARE', n, e.message.slice(0, 80)); }
  }
  console.log('\ngata');
  await b.close();
})();
