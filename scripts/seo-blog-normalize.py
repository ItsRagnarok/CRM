# Rulat o dată pe 27.11.2026 (python3 scripts/seo-blog-normalize.py .). Pentru articole noi, copiază tiparul din head-ul unui articol existent.
"""Normalizează SEO-ul articolelor statice din public/blog (rulat o dată, idempotent)."""
import json, re, sys, html
from pathlib import Path

ROOT = Path(sys.argv[1])
BLOG = ROOT / "public" / "blog"
SITE = "https://www.electrofield.ro"
SUFFIX = " | ElectroField"

# slug: (titlu fără sufix, descriere nouă sau None, cluster)
DATA = {
 "autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira": ("Autorizații ANRE: cine semnează lucrarea și când expiră", "Cine poate semna o lucrare electrică sau de gaze, cum funcționează autorizațiile ANRE și legitimațiile de instalator și un calculator pentru alerta de expirare.", "el"),
 "calculator-tarif-ora-electrician-instalator": ("Tarif minim pe oră pentru electricieni, 2026", None, "bani"),
 "cat-avans-ceri-lucrari-electrice-fotovoltaice": ("Cât avans ceri la o lucrare electrică sau fotovoltaică", "Cât avans să ceri la lucrări electrice și fotovoltaice, cum îl pui în ofertă și un calculator care îți arată câți bani blochezi până la prima încasare.", "bani"),
 "checklist-instalare-sistem-fotovoltaic": ("Checklist instalare fotovoltaic: de la vizită la predare", None, "pv"),
 "contract-mentenanta-camere-supraveghere-securitate": ("Contract de mentenanță pentru camere de supraveghere", None, "echipe"),
 "cum-calculezi-profitul-pe-lucrare": ("Cum calculezi profitul pe o lucrare (cu exemplu)", None, "bani"),
 "cum-gestionezi-clientii-dificili": ("Cum gestionezi clienții dificili într-o firmă de instalații", "Reclamații, cereri în plus și discuții despre bani: cum răspunzi clienților dificili fără să pierzi lucrarea, cu exemple de mesaje pentru firmele de instalații.", "bani"),
 "documente-predare-client-dupa-instalare": ("Ce documente predai clientului după o instalare", None, "el"),
 "dosar-prosumator-etape-termene-atr": ("Dosar de prosumator: etape, termene ATR și întârzieri", "Etapele dosarului de prosumator de la ofertă la punerea în funcțiune, termenele operatorului pentru ATR și ce faci când întârzie, cu un calculator de termen.", "pv"),
 "e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice": ("e-Factura B2B 2026 pentru firmele de instalații", None, "bani"),
 "evidenta-orelor-tehnicieni-teren-pontaj": ("Pontajul tehnicienilor din teren: ce conține, fără hârtii", "Ce cere Codul muncii la evidența orelor, ce trebuie să conțină pontajul angajaților din teren, greșeli frecvente și un calculator de pontaj săptămânal.", "pontaj"),
 "excel-sau-aplicatie-gestionare-lucrari": ("Excel, WhatsApp sau aplicație pentru echipe de teren?", "Un test de 2 minute pentru firmele de instalații: afli dacă Excelul și WhatsApp-ul îți mai ajung sau începi să pierzi bani, plus 5 reguli pentru un Excel ordonat.", "echipe"),
 "fisa-evidenta-verificare-revizie-gaze-scadentar": ("Fișa de evidență gaze și scadențar pe bloc (Ord. 179/2015)", None, "gaze"),
 "garantie-legala-lucrari-electrice-fotovoltaice-cat-tii-raspunderea": ("Garanția legală la lucrări electrice și fotovoltaice", "Cât timp răspunzi pentru o lucrare electrică sau fotovoltaică după Legea 10/1995, pe categorii de importanță, cum o scrii în ofertă și un calculator al termenului.", "el"),
 "gestionare-echipe-de-teren": ("Cum gestionezi echipele de tehnicieni din teren", "Cele 6 probleme frecvente ale firmelor cu echipe în teren (lucrări, materiale, programări, dovezi) și cum le rezolvi, cu exemple din instalații electrice și PV.", "echipe"),
 "gestiune-materiale-ce-ai-cumparat-ce-ai-folosit": ("Gestiunea materialelor în firmele de instalații", None, "stoc"),
 "model-oferta-lucrari-electrice-fotovoltaice": ("Model de ofertă pentru lucrări electrice și fotovoltaice", "Ce trebuie să conțină o ofertă pentru lucrări electrice, fotovoltaice și de supraveghere, plus un calculator care îți arată prețul și marja după reducere.", "bani"),
 "model-proces-verbal-raport-lucrare": ("Model proces-verbal de lucrare pentru instalații", None, "el"),
 "panouri-fotovoltaice-produc-putin-verificari": ("Panouri fotovoltaice care produc puțin: ce verifici", "Ce verifici când un client spune că panourile fotovoltaice produc puțin: date lipsă sau producție scăzută, întrebările de pus și ce trimiți echipei la intervenție.", "pv"),
 "proces-verbal-punere-in-functiune-fotovoltaic-model": ("Proces-verbal punere în funcțiune fotovoltaic: model", None, "pv"),
 "program-management-firma-instalatii": ("Program de management pentru firme de instalații: 8 criterii", None, "echipe"),
 "reducere-timpi-deplasare-lucrari": ("Cum reduci timpii de deplasare între lucrări", "Cum scazi timpul pierdut pe drum într-o firmă cu echipe în teren: lucrări grupate pe zone, ordinea zilei, stocul din mașină și ce măsori ca să vezi progresul.", "drum"),
 "service-sezonier-centrale-termice": ("Revizii sezoniere la centrale termice și pompe de căldură", "Cum organizezi reviziile sezoniere la centrale termice și pompe de căldură: calendar, reamintiri pentru clienți, contracte de mentenanță și loc pentru urgențe.", "gaze"),
 "tehnician-vs-administrator": ("Tehnician vs. administrator: ce trebuie să vadă fiecare", "Ce trebuie să vadă tehnicianul în teren și ce vede administratorul la birou, unde se pierd informații între ei și cum închizi golurile într-o firmă de instalații.", "echipe"),
 "urmarire-gps-echipe-teren-gdpr": ("Urmărirea angajaților cu GPS: ce cere GDPR", "GPS pe mașină sau în telefon? Ce au reproșat autoritățile firmelor amendate, regulile de bază pentru urmărirea echipelor din teren și un checklist interactiv.", "pontaj"),
 "verificare-pram-rezistenta-priza-de-pamant-periodicitate": ("Verificarea PRAM: ce este și cât de des se face", "Ce înseamnă verificarea PRAM a prizei de pământ, la ce interval se face, ce valori se consideră normale și un calculator pentru data următoarei verificări.", "el"),
 "verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti": ("Verificare și revizie gaze: când se face, ce pregătești", "Când se face verificarea (la 2 ani) și revizia (la 10 ani) a instalației de gaze, ce documente pregătești înainte de vizită și un calculator pentru scadențe.", "gaze"),
}

CLUSTER = {
 "el": ("firme-instalatii-electrice", "Program pentru firme de instalații electrice", "pylons"),
 "gaze": ("firme-gaze-verificari-revizii", "Program pentru verificări și revizii gaze", "van-dusk"),
 "pv": ("firme-fotovoltaice", "Program pentru firme de montaj fotovoltaic", "pylons"),
 "echipe": ("aplicatie-tehnician", "Aplicația pentru tehnicieni", "technician-phone"),
 "pontaj": ("pontaj-tehnicieni", "Pontaj pentru tehnicienii din teren", "technician-phone"),
 "bani": ("facturare-smartbill-oblio", "Facturare din lucrări prin SmartBill sau Oblio", "city-night"),
 "stoc": ("stoc-materiale-pe-masini", "Stoc de materiale pe mașini și registru de scule", "van-dusk"),
 "drum": ("foaie-de-parcurs-electronica", "Foaie de parcurs electronică", "van-dusk"),
}
COVER_ALT = {
 "pylons": "Stâlpi și linii electrice la apus",
 "technician-phone": "Tehnician cu telefonul în mână, la o lucrare",
 "van-dusk": "Duba unei echipe de instalatori, la apus",
 "city-night": "Oraș seara, birou cu facturi de emis",
}

def full_title(core):
    return core + SUFFIX if len(core + SUFFIX) <= 60 else core

def related_for(slug, cluster):
    same = [s for s, v in DATA.items() if v[2] == cluster and s != slug]
    other = [s for s, v in DATA.items() if v[2] != cluster and s != slug]
    # deterministic: same-cluster first, then neighbours
    picks = (same + other)[:3]
    return picks

def article_title_core(slug):
    return DATA[slug][0]

def build_head(slug, title_core, desc, image, w, h, published, modified):
    url = f"{SITE}/blog/{slug}"
    e = lambda s: html.escape(s, quote=True)
    tags = [
        f'<meta property="og:type" content="article">',
        f'<meta property="og:site_name" content="ElectroField">',
        f'<meta property="og:locale" content="ro_RO">',
        f'<meta property="og:title" content="{e(title_core)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{image}">',
        f'<meta property="og:image:width" content="{w}">',
        f'<meta property="og:image:height" content="{h}">',
        f'<meta property="article:published_time" content="{published}">',
        f'<meta property="article:modified_time" content="{modified}">',
        f'<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title_core)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{image}">',
    ]
    return "\n".join(tags)

def ld_for(slug, headline, desc, image, published, modified):
    url = f"{SITE}/blog/{slug}"
    org = {"@type": "Organization", "@id": f"{SITE}/#organization", "name": "ElectroField", "url": SITE,
           "logo": {"@type": "ImageObject", "url": f"{SITE}/icon-512.png", "width": 512, "height": 512}}
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": f"{url}#article", "headline": headline[:110], "description": desc,
         "image": image, "datePublished": published, "dateModified": modified, "inLanguage": "ro-RO",
         "author": org, "publisher": org, "mainEntityOfPage": url, "isPartOf": {"@id": f"{SITE}/#website"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Acasă", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE}/blog"},
            {"@type": "ListItem", "position": 3, "name": headline[:110], "item": url}]},
    ]}
    return '<script type="application/ld+json">' + json.dumps(graph, ensure_ascii=False).replace("</", "<\\/") + "</script>"

def process(slug):
    p = BLOG / f"{slug}.html"
    s = p.read_text()
    core, newdesc, cluster = DATA[slug]
    title = full_title(core)
    s = re.sub(r"<title>[^<]*</title>", f"<title>{html.escape(title, quote=False)}</title>", s, count=1)
    m = re.search(r'<meta name="description" content="([^"]*)">', s)
    desc = newdesc or (html.unescape(m.group(1)) if m else "")
    if m:
        s = s.replace(m.group(0), f'<meta name="description" content="{html.escape(desc, quote=True)}">', 1)
    # dates from existing JSON-LD
    pub = re.search(r'"datePublished"\s*:\s*"([^"]+)"', s); pub = pub.group(1) if pub else "2026-10-19"
    mod = re.search(r'"dateModified"\s*:\s*"([^"]+)"', s); mod = mod.group(1) if mod else pub
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    headline = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else core
    # cover
    cover = re.search(r'<img[^>]*class="cover"[^>]*>', s)
    image, w, h = None, 1200, 630
    if cover:
        src = re.search(r'src="([^"]+)"', cover.group(0)).group(1)
        mm = re.match(r"/marketing/([a-z-]+)\.jpg$", src)
        if mm:
            name = mm.group(1)
            image = f"{SITE}/marketing/og-{name}.jpg"
            alt = re.search(r'alt="([^"]*)"', cover.group(0))
            alt = alt.group(1) if alt and alt.group(1) else COVER_ALT[name]
            newcover = f'<img class="cover" src="/marketing/{name}-1200.webp" alt="{alt}" width="1200" height="525" fetchpriority="high" decoding="async">'
            s = s.replace(cover.group(0), newcover, 1)
        else:
            image = f"{SITE}{src}"
    if not image:
        image = f"{SITE}/marketing/og-{CLUSTER[cluster][2]}.jpg"
    # head: drop old og/twitter/article meta and simple JSON-LD; keep @graph ones (rich, with FAQ/HowTo)
    s = re.sub(r'\s*<meta (?:property|name)="(?:og:[^"]+|twitter:[^"]+|article:[^"]+)" content="[^"]*">', "", s)
    rich = '"@graph"' in s
    if not rich:
        s = re.sub(r'<script type="application/ld\+json">.*?</script>\s*', "", s, flags=re.S)
    head = build_head(slug, core, desc, image, w, h, pub, mod)
    if not rich:
        head += "\n" + ld_for(slug, headline, desc, image, pub, mod)
    canon = re.search(r'<link rel="canonical" href="[^"]+">', s)
    s = s.replace(canon.group(0), canon.group(0) + "\n" + head, 1)
    # related block
    if "Citește și" not in s:
        page_slug, page_name, _ = CLUSTER[cluster]
        items = "".join(f'<li><a href="/blog/{r}">{html.escape(article_title_core(r))}</a></li>' for r in related_for(slug, cluster))
        block = (f'<section class="related"><h2>Citește și</h2><ul>{items}'
                 f'<li><a href="/{page_slug}">{html.escape(page_name)}</a></li></ul></section>')
        anchor = s.find('<div class="cta"')
        if anchor == -1:
            anchor = s.find("</main>")
        s = s[:anchor] + block + "\n" + s[anchor:]
    p.write_text(s)
    return title, len(title), len(desc)

for slug in DATA:
    print(slug[:50], *process(slug)[1:])
