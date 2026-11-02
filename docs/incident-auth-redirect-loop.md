# Incident: buclă de redirecționare la autentificare

2 noiembrie 2026. Raportat de proprietar după publicarea administrării platformei.

## Cauză

Cheia primară compusă a tabelei noi `platform_usage_daily` includea atât `organization_id`, cât și `profile_id`. PostgREST a dedus astfel o relație many-to-many suplimentară între profiluri și organizații. Cererile existente `profiles?select=*,organizations(*)` au început să răspundă HTTP 300 / PGRST201 din cauza ambiguității.

Codul de sesiune ignora eroarea de citire, trata rezultatul ca profil lipsă, încerca onboardingul, apoi trimitea către login. Middleware-ul vedea sesiunea validă și redirecționa din nou. Compilarea, testele SQL și verificările HTTP fără sesiune nu detectaseră rezolvarea relațiilor prin PostgREST. Aceasta a fost o regresie introdusă în actualizarea administrării platformei.

## Remediere

- Aplicat imediat în baza de date de production: cheie primară UUID simplă pentru telemetrie și constrângere UNIQUE separată pentru cheia de agregare. Datele și comportamentul ON CONFLICT se păstrează. Reload al schemei PostgREST. Cererea veche a revenit la HTTP 200.
- Toate încărcările profil–companie indică explicit `profiles_organization_id_fkey`, inclusiv acceptarea termenilor și pagina de suspendare.
- Erorile API sunt tratate ca erori; nu declanșează onboarding sau redirecționare la login pentru o sesiune deja validă.
- Contextul de preview invalid este curățat pe o rută dedicată, evitând bucla dashboard/admin pentru un utilizator fără rol de platform admin.
- Ecran de eroare cu reîncercare și ieșire din vizualizare pentru interfața companiei.

## Verificări și lansare

`node scripts/check-auth-relations.mjs` verifică API-ul real cu cheia publică și limit=0: relația veche, relația explicită și fluxul de termeni. Nu citește date de cont. Testele de înregistrare a activității sunt repetate cu ROLLBACK după schimbarea cheii.

Corecția de cod se publică pe ramura deja conectată la domeniul de production, apoi se verifică starea Vercel și răspunsurile live. Nu se consideră suficientă existența unui preview sau un build local reușit.
