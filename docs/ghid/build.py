#!/usr/bin/env python3
"""Generează ghidul ElectroField: content.py → ghid.html (A4), apoi render.js → PDF."""
import html, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import *

D = os.path.dirname(os.path.abspath(__file__))
e = html.escape

def img(name, cap, kind):
    src = f"img/{name}.jpg"
    if not os.path.exists(os.path.join(D, src)):
        return ""
    return f'<figure class="{kind}"><img src="{src}" alt="{e(cap)}"><figcaption>{e(cap)}</figcaption></figure>'

def section(s, n, phone=False):
    imgs = s["imgs"]
    figs = "".join(img(*i) for i in imgs)
    cum = "".join(f"<li>{e(x)}</li>" for x in s["cum"])
    nota = f'<p class="nota"><b>De reținut:</b> {e(s["nota"])}</p>' if s["nota"] else ""
    meta = f'<div class="meta"><span><b>Pentru</b> {e(s["cine"])}</span><span><b>Unde</b> {e(s["unde"])}</span></div>'
    text = f"""<h4>Ce este</h4><p>{e(s["ce"])}</p>
<h4>Cum se folosește</h4><ol>{cum}</ol>
<div class="dece"><h4>De ce există și cum a fost gândit</h4><p>{e(s["dece"])}</p></div>{nota}"""
    head = f'<div class="num">{n}</div><h3>{e(s["titlu"])}</h3>{meta}'
    if phone and len(imgs) == 1:
        # un telefon: captura în stânga, textul alături; titlul nu se desparte de ele
        body = f'<div class="keep">{head}<div class="phone-row"><div class="phones">{figs}</div><div class="ptext">{text}</div></div></div>'
    elif phone and imgs:
        body = f'<div class="keep">{head}<div class="phones two">{figs}</div></div>{text}'
    else:
        first = img(*imgs[0]) if imgs else ""
        rest = "".join(img(*i) for i in imgs[1:])
        body = f'<div class="keep">{head}{first}</div>{text}{rest}'
    return f'<section class="sec" id="{s["id"]}">{body}</section>'

def toc_items():
    out = [("1", "Cum e gândită platforma", "gandire")]
    out += [("2", "Platforma de birou", "birou")] + [(f"2.{i}", s["titlu"], s["id"]) for i, s in enumerate(BIROU, 1)]
    out += [("3", "Aplicația tehnicianului", "telefon")] + [(f"3.{i}", s["titlu"], s["id"]) for i, s in enumerate(TELEFON, 1)]
    out += [("4", "Ce vede clientul", "client"), ("5", "Super Admin", "sa"), ("6", "Securitate și date", "securitate"), ("7", "Primii pași pentru o firmă nouă", "start"), ("8", "Glosar", "glosar")]
    return out

def build():
    toc = "".join(f'<li class="{"l1" if "." not in a else "l2"}"><a href="#{h}"><span class="tn">{a}</span><span class="tt">{e(t)}</span></a></li>' for a, t, h in toc_items())
    princ = "".join(f'<div class="pr"><h4>{e(t)}</h4><p>{e(d)}</p></div>' for t, d in PRINCIPII)
    roluri = "".join(f"<tr><td><b>{e(r)}</b></td><td>{e(d)}</td></tr>" for r, d in ROLURI)
    flux = "".join(f'<div class="step"><span>{i}</span>{e(x)}</div>' for i, x in enumerate(FLUX, 1))
    birou = "".join(section(s, f"2.{i}") for i, s in enumerate(BIROU, 1))
    tel = "".join(section(s, f"3.{i}", phone=True) for i, s in enumerate(TELEFON, 1))
    cli = "".join(section(s, f"4.{i}", phone=True) for i, s in enumerate(CLIENT, 1))
    sa = "".join(section(s, "5.1") for s in SUPERADMIN)
    sec = "".join(f"<tr><td><b>{e(t)}</b></td><td>{e(d)}</td></tr>" for t, d in SECURITATE)
    glos = "".join(f"<tr><td><b>{e(t)}</b></td><td>{e(d)}</td></tr>" for t, d in GLOSAR)
    start = "".join(f"<li>{e(x)}</li>" for x in [
        "Setări → Firma: datele firmei, logo-ul, sediul.",
        "Setări → Domenii: electrice, gaze, fotovoltaice. Meniul și formularele se adaptează.",
        "Setări → Utilizatori și roluri: contul fiecărui om, cu rolul și tariful orar.",
        "Setări → Echipe și vehicule: echipele, liderii și mașinile, cu stocul țintă pe mașină.",
        "Conformitate: autorizațiile oamenilor, ITP/RCA, calibrările, ca avertizările să funcționeze de la prima programare.",
        "Setări → Integrări: SmartBill sau Oblio, seriile, tariful de manoperă și adaosul la materiale.",
        "Tehnicienii instalează aplicația (Android, iPhone sau browser) și se autentifică cu contul primit.",
        "Prima lucrare: din „Cereri noi” sau „Lucrare nouă”; urmărești pașii în timp real și facturezi la final.",
    ])
    page = f"""<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>ElectroField · Ghidul platformei</title>
<link rel="stylesheet" href="ghid.css"></head><body>
<section class="cover">
  <div class="brand"><div class="logo">⚡</div><div>ElectroField</div></div>
  <div class="streak"></div>
  <h1>Ghidul platformei</h1>
  <p class="lead">Fiecare ecran, ce conține, cum se folosește, pentru ce e acolo și cum a fost gândit. Pentru patroni, birou, tehnicieni și pentru oricine ajută o firmă să înceapă.</p>
  <div class="parts"><div><b>Birou</b><span>planificare, facturare, conformitate</span></div><div><b>Teren</b><span>aplicația tehnicianului</span></div><div><b>Client</b><span>link de status, cereri</span></div></div>
  <p class="ed">Ediția {EDITIE} · www.electrofield.ro</p>
</section>
<section class="toc"><h2>Cuprins</h2><ol>{toc}</ol>
<p class="small">Capturile sunt din contul demonstrativ (date fictive). Ghidul se actualizează împreună cu platforma; ediția e pe copertă.</p></section>

<section class="chapter" id="gandire"><div class="cn">1</div><h2>Cum e gândită platforma</h2>
<p class="intro">ElectroField e făcută pentru firmele de instalații electrice, gaze și fotovoltaice cu 3–50 de oameni. Înlocuiește caietul de programări, grupurile de WhatsApp, Excel-ul cu pontaje, dosarele de hârtie și „sună-l pe Andrei să vezi unde e”. Are trei fețe: <b>biroul</b> (platforma web, pentru patron și dispecer), <b>terenul</b> (aplicația de telefon a tehnicianului) și <b>clientul</b> (linkul de status, fără cont).</p>
<h3 class="h3c">Principiile</h3><div class="princ">{princ}</div>
<h3 class="h3c">Ciclul unei lucrări</h3><p>Totul în platformă e construit în jurul acestui drum. Fiecare pas îl face cine trebuie, o singură dată, iar ceilalți îl văd imediat.</p><div class="flux">{flux}</div>
<h3 class="h3c">Rolurile</h3><table class="t">{roluri}</table>
<h3 class="h3c">Cum se citește ghidul</h3><p>Fiecare secțiune are aceeași formă: <b>Pentru</b> cine e, <b>Unde</b> o găsești în meniu, <b>Ce este</b>, <b>Cum se folosește</b> (pașii concreți) și <b>De ce există și cum a fost gândit</b> (problema reală pe care o rezolvă). Modulele de domeniu (gaze, fotovoltaic, electric) apar doar la firmele care au ales acel domeniu.</p>
</section>

<section class="chapter" id="birou"><div class="cn">2</div><h2>Platforma de birou</h2>
<p class="intro">Se deschide în browser, la www.electrofield.ro, pe calculator sau tabletă. Meniul din stânga e grupat după întrebarea pe care o ai: <b>Platformă</b> (ce e azi, lucrările, calendarul, harta, modulele de domeniu, clienții, facturarea, conformitatea, stocul, pontajul, rapoartele) și <b>Setări</b>. Bulinele roșii din meniu arată câte lucruri așteaptă o decizie. Tema deschisă sau întunecată se alege din colț.</p></section>
{birou}

<section class="chapter" id="telefon"><div class="cn">3</div><h2>Aplicația tehnicianului</h2>
<p class="intro">Aplicația de telefon e făcută pentru șantier: o mână ocupată, mănuși, soare, subsol fără semnal. Are cinci file jos: <b>Acasă</b>, <b>Lucrări</b>, butonul din mijloc <b>Scanează</b>, <b>Mesaje</b> și <b>Meniu</b>. Tehnicianul vede doar ce e al lui: lucrările lui, stocul mașinii lui, orele lui.</p></section>
{tel}

<section class="chapter" id="client"><div class="cn">4</div><h2>Ce vede clientul</h2>
<p class="intro">Clientul nu are cont și nu instalează nimic. Primește un link și îl deschide pe telefon. Tot ce vede a fost ales de firmă: pozele înainte și după și documentele bifate „Pentru client”. Linkul expiră și poate fi revocat.</p></section>
{cli}

<section class="chapter" id="sa-ch"><div class="cn">5</div><h2>Super Admin</h2></section>
{sa}

<section class="chapter" id="securitate"><div class="cn">6</div><h2>Securitate și date</h2>
<p class="intro">Datele unei firme de instalații înseamnă adrese de clienți, CNP-uri pe fișe, localizarea oamenilor și facturi. Regulile de mai jos sunt puse în baza de date, nu doar în ecrane, ca să țină și când cineva încearcă să ocolească aplicația.</p>
<table class="t">{sec}</table></section>

<section class="chapter" id="start"><div class="cn">7</div><h2>Primii pași pentru o firmă nouă</h2>
<p class="intro">Ordinea recomandată, ca de la prima lucrare avertizările, stocul și facturarea să funcționeze:</p><ol class="big">{start}</ol></section>

<section class="chapter" id="glosar"><div class="cn">8</div><h2>Glosar</h2><table class="t">{glos}</table>
<p class="small end">ElectroField · ediția {EDITIE}. Formularele legale (Ord. ANRE 179/2015, SSM, procese-verbale) sunt construite pe forma oficială; verifică-le cu responsabilul tehnic și responsabilul SSM înainte de a renunța la varianta pe hârtie.</p></section>
</body></html>"""
    open(os.path.join(D, "ghid.html"), "w").write(page)
    print("ghid.html scris")

if __name__ == "__main__":
    build()
