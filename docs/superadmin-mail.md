# Panoul Mail pentru Super Admin

Ruta `/admin/mail` folosește verificarea server `requireAdminContext`, bazată pe apartenența la `platform_admins`. Administratorii companiilor și tehnicienii nu primesc acces prin simplul rol din companie.

Sunt disponibile afișările Inbox unificat și Pe adrese, ambele cu Toate adresele. Comutarea păstrează filtrarea și mesajul ales; doar preferința de afișare se păstrează în localStorage.

În această etapă nu există conexiuni Hostico. Starea inițială este goală; demonstrația se activează explicit și folosește exclusiv mesaje fictive și adrese exemplificative. Compunerea, răspunsul, ciornele și mutarea în Coș sunt simulări în memoria paginii. Reîncărcarea le elimină. Nu există expediere, sincronizare, descărcare de atașamente sau stocare de parole.

Pentru etapa de conectare sunt necesare adresele reale și configurația Hostico IMAP/SMTP. Se vor implementa accesul server, păstrarea sigură a secretelor, sincronizarea, expedierea și tratarea sigură a conținutului HTML. Prezenta interfață afișează text simplu.

Verificare manuală cu un cont Super Admin: deschide Mail, activează demonstrația, schimbă afișarea și selectează Toate adresele sau o adresă, caută și schimbă dosarul, deschide un mesaj și răspunde de pe adresa destinatară, salvează o ciornă și redeschide-o. Verifică afișarea pe mobil și în ambele teme. Verifică separat refuzul accesului pentru un administrator de companie și un tehnician, precum și redirecționarea la autentificare fără sesiune.
