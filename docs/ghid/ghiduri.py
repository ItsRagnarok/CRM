#!/usr/bin/env python3
"""Ghidurile simple: simplu.py → ghid-platforma.html și ghid-aplicatie.html (A4), apoi render.js → PDF."""
import html, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from simplu import *

D = os.path.dirname(os.path.abspath(__file__))
e = html.escape

def fig(name, cap, phone):
    src = f"img/{name}.jpg"
    if not os.path.exists(os.path.join(D, src)):
        return ""
    return f'<figure class="{"phone" if phone else "wide"}"><img src="{src}" alt="{e(cap)}"><figcaption>{e(cap)}</figcaption></figure>'

def section(s, n, phone):
    figs = [fig(name, cap, phone) for name, cap in s["imgs"]]
    figs = [f for f in figs if f]
    pasi = "".join(f"<li>{e(x)}</li>" for x in s["pasi"])
    scurt = "".join(f"<li>{e(x)}</li>" for x in s["scurt"])
    sfat = f'<p class="sfat"><b>Bine de știut:</b> {e(s["sfat"])}</p>' if s["sfat"] else ""
    head = f'<div class="num">{n}</div><h3>{e(s["titlu"])}</h3><p class="unde"><span>Unde îl găsești</span>{e(s["unde"])}</p><p class="ce">{e(s["ce"])}</p>'
    text = f'<div class="cols"><div><h4>Pașii</h4><ol>{pasi}</ol></div><div class="scurt"><h4>Scurtături</h4><ul>{scurt}</ul></div></div>{sfat}'
    if phone:
        body = f'<div class="keep">{head}<div class="phones">{"".join(figs)}</div></div>{text}'
    else:
        first = figs[0] if figs else ""
        body = f'<div class="keep">{head}{first}</div>{text}{"".join(figs[1:])}'
    return f'<section class="sec" id="{s["id"]}">{body}</section>'

def page(title, lead, parts, intro_title, intro, sections, phone, end_html):
    toc = "".join(f'<li><a href="#{s["id"]}"><span class="tn">{i}</span><span class="tt">{e(s["titlu"])}</span></a></li>' for i, s in enumerate(sections, 1))
    intro_rows = "".join(f'<div class="pr"><h4>{e(t)}</h4><p>{e(d)}</p></div>' for t, d in intro)
    secs = "".join(section(s, str(i), phone) for i, s in enumerate(sections, 1))
    parts_html = "".join(f"<div><b>{e(a)}</b><span>{e(b)}</span></div>" for a, b in parts)
    return f"""<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>ElectroField · {e(title)}</title>
<link rel="stylesheet" href="ghid.css"><link rel="stylesheet" href="simplu.css"></head><body>
<section class="cover">
  <div class="brand"><div class="logo">⚡</div><div>ElectroField</div></div>
  <div class="streak"></div>
  <h1>{e(title)}</h1>
  <p class="lead">{e(lead)}</p>
  <div class="parts">{parts_html}</div>
  <p class="ed">Ediția {EDITIE} · www.electrofield.ro</p>
</section>
<section class="toc"><h2>Cuprins</h2><ol class="simple">{toc}</ol>
<div class="howto"><h3 class="h3c">{e(intro_title)}</h3><div class="princ">{intro_rows}</div></div>
<p class="small">Capturile sunt reale, din contul demonstrativ ElectroField (date fictive). La fiecare ecran: unde îl găsești, ce face, pașii și scurtăturile.</p></section>
{secs}
{end_html}
</body></html>"""

def build():
    start = "".join(f"<li>{e(x)}</li>" for x in PLATFORMA_START)
    plat = page(
        "Ghidul platformei",
        "Cum folosești platforma de birou, ecran cu ecran: unde găsești fiecare lucru, ce face, pașii și scurtăturile.",
        [("Birou", "patron, administrator, manager"), ("Zilnic", "panou, lucrări, calendar, hartă"), ("Bani și firmă", "facturare, stoc, pontaj, conformitate")],
        "Cum te orientezi", PLATFORMA_INTRO, PLATFORMA, False,
        f'<section class="chapter" id="start"><h2>Primii pași pentru o firmă nouă</h2><p class="intro">În ordinea asta, ca de la prima lucrare avertizările, stocul și facturarea să funcționeze:</p><ol class="big">{start}</ol>'
        f'<p class="small end">ElectroField · ediția {EDITIE}. Formularele legale (Ord. ANRE 179/2015, SSM, procese-verbale) sunt pe forma oficială; verifică-le cu responsabilul tehnic și cu responsabilul SSM.</p></section>')
    app = page(
        "Ghidul aplicației tehnicianului",
        "Cum folosești aplicația de pe telefon, pas cu pas: de la lucrările zilei la semnătura clientului și raportul trimis.",
        [("Teren", "tehnician, șef de echipă"), ("Lucrarea", "drum, poze, formular, semnătură"), ("Restul", "materiale, pontaj, siguranță")],
        "Pe scurt", APP_INTRO, APLICATIE, True,
        f'<section class="chapter" id="final"><h2>Ziua unui tehnician, pe scurt</h2><ol class="big">'
        '<li>Deschizi aplicația: vezi lucrările de azi pe Acasă.</li>'
        '<li>Deschizi lucrarea, verifici ce ai de luat și apeși „Plec spre locație”.</li>'
        '<li>La client: „Am ajuns”, verificarea de siguranță, poze, formular, materiale.</li>'
        '<li>Clientul semnează; apeși „Finalizează” și scrii ce s-a încasat.</li>'
        '<li>Din „Raportul lucrării” vezi PDF-ul și îl trimiți clientului.</li>'
        f'</ol><p class="small end">ElectroField · ediția {EDITIE}. Pentru întrebări: Meniu → Ajutor și suport, sau biroul firmei tale.</p></section>')
    open(os.path.join(D, "ghid-platforma.html"), "w").write(plat)
    open(os.path.join(D, "ghid-aplicatie.html"), "w").write(app)
    print("ghid-platforma.html, ghid-aplicatie.html scrise")

if __name__ == "__main__":
    build()
