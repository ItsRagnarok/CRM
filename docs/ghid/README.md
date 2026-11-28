# Ghidul platformei ElectroField (PDF)

Ghidul complet al platformei: fiecare ecran, ce conține, cum se folosește, de ce există și cum a fost gândit.

- `content.py`: textul ghidului (principii, roluri, fiecare secțiune). Aici se modifică conținutul.
- `shots.js`: capturile de ecran din contul demo de pe producție → `img/`.
- `build.py`: `content.py` + `ghid.css` → `ghid.html`.
- `render.js`: `ghid.html` → `ElectroField-ghid.pdf` (A4, antet, numere de pagină).

```bash
cd docs/ghid
node shots.js          # capturi noi (doar când s-au schimbat ecranele)
python3 build.py
node render.js         # → ElectroField-ghid.pdf
```

Când se schimbă un ecran sau se adaugă o funcție: actualizează secțiunea din `content.py`, ediția (`EDITIE`) și regenerează.
Imaginile și PDF-ul nu se urcă în repo (`.gitignore`).

## Ghidurile simple (două PDF-uri)

- `simplu.py`: textul (platforma de birou și aplicația tehnicianului): unde găsești ecranul, ce face, pașii, scurtăturile.
- `ghiduri.py`: `simplu.py` + `ghid.css` + `simplu.css` → `ghid-platforma.html` și `ghid-aplicatie.html`.

```bash
cd docs/ghid
node shots.js
python3 ghiduri.py
node render.js ghid-platforma.html ElectroField-ghid-platforma.pdf "Ghidul platformei" "28 noiembrie 2026"
node render.js ghid-aplicatie.html ElectroField-ghid-aplicatie.pdf "Ghidul aplicației tehnicianului" "28 noiembrie 2026"
```
