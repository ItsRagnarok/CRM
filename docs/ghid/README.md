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
