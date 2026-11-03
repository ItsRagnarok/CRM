# Panoul Mail pentru Super Admin

Ruta `/admin/mail` este un client IMAP/SMTP real. Nu conține adrese sau mesaje demonstrative. Afișările Inbox unificat și Pe adrese au fiecare Toate adresele și păstrează selecția la comutare. Preferința de afișare este singura informație păstrată în localStorage.

## Conectare

Din Mail → Adrese → Adaugă adresă se introduc numele afișat, adresa, username-ul și parola, serverul IMAP, serverul SMTP, porturile și securitatea din Hostico / Mail Client Manual Settings. IMAP acceptă 993 SSL/TLS sau 143 STARTTLS obligatoriu; SMTP acceptă 465 SSL/TLS sau 587 STARTTLS obligatoriu. Autentificarea SMTP poate folosi date diferite. Nu există conexiuni fără criptare sau opțiune de ignorare a certificatului.

Testează conexiunea verifică autentificarea și accesul la INBOX, precum și autentificarea SMTP, fără expedierea unui mesaj. Verifică și salvează repetă verificările înainte de persistență. Editarea permite păstrarea parolelor existente prin câmpuri goale. Deconectarea șterge configurația și secretul Vault; nu șterge căsuța sau mesajele de pe Hostico.

## Funcții și limite explicite

- Listare din server, 30 de mesaje per adresă și pagină, cu încărcarea mesajelor mai vechi. Actualizarea este manuală prin butonul de reîmprospătare; nu există sincronizare în fundal sau notificări push de mail.
- Căutare în expeditori și subiectele mesajelor încărcate. Nu reprezintă o căutare în întreaga arhivă de pe server.
- Citire și marcarea ca citit, răspuns de pe adresa destinatară cu antete de conversație, redirecționarea textului, compunere text simplu, un destinatar.
- Ciorne persistate în dosarul IMAP. La editare se salvează noua versiune, iar cea veche se mută în Coș; nu se expunge întregul dosar.
- Mutare în Coș și marcarea ca necitit persistă pe server. Nu există ștergere definitivă. Mutarea necesită MOVE sau UIDPLUS, pentru a evita expungerea altor mesaje marcate pentru ștergere de un alt client.
- Mesajele de maximum 10 MB pot fi citite și atașamentele lor descărcate. Cele mai mari se deschid în webmail. Citirea afișează text simplu, inclusiv conversia HTML în text; nu încarcă imagini externe și nu execută HTML.
- Atașamentele primite pot fi descărcate printr-o rută cu autentificare și autorizare. Compunerea nu include încă încărcare de atașamente, CC/BCC sau redirecționarea atașamentelor.
- SMTP acceptat nu înseamnă confirmarea livrării la destinatar. Dacă salvarea copiei în Trimise eșuează după acceptarea SMTP, se afișează avertizare de succes parțial și mesajul nu se retrimite automat.
- Un identificator de expediere revendicat atomic în baza de date previne repetarea aceleiași trimiteri. Dacă rezultatul SMTP este incert, se cere verificarea în webmail înainte de a compune o nouă expediere. Nu există retransmitere automată după timeout.
- Maximum 20 de căsuțe; 120 de operații sensibile pe minut per Super Admin.

## Securitate și stocare

Pagina, fiecare server action și ruta de atașamente verifică identitatea prin `requireAdminContext`, bazat pe `platform_admins`, nu pe rolul editabil din profilul companiei. Modul de vizualizare a companiei blochează accesul la operațiile de mail.

Tabelele sunt în schema neexpusă `private`, au RLS activ și nu au privilegii de acces direct pentru anon/authenticated. Parolele sunt stocate criptat în Supabase Vault. API-ul SQL invoker apelează implementarea din schema privată, care verifică independent apartenența la `platform_admins` pentru fiecare operație. Conturile obișnuite nu pot lista configurații, salva, șterge sau recupera secrete.

Doar un Super Admin autorizat poate recupera secretul prin RPC; aplicația îl consumă exclusiv în codul server IMAP/SMTP. Parolele nu sunt trimise în props, liste sau rezultate de server actions, nu sunt salvate în localStorage și nu sunt jurnalizate de bibliotecile de mail. Administratorii bazei de date păstrează accesul administrativ la Vault.

Serverele configurate trebuie să aibă exclusiv IP-uri publice. Conexiunea folosește IP-ul verificat, fără a rezolva din nou DNS, și păstrează hostname-ul pentru SNI și verificarea certificatului. Nu sunt permise IP-uri private, loopback, link-local sau URL-uri cu credențiale. Conexiunile au timeout, iar citirea are limită de volum.

Migrarea este `supabase/migrations/20261103005330_platform_mail_vault.sql`. Nu sunt necesare chei suplimentare în Vercel; se utilizează sesiunea Supabase verificată și Vault-ul proiectului.

## Verificări

`node --test scripts/mail-security.test.mjs` verifică validarea, gestionarea parolelor la editare, protecția SSRF/DNS, TLS și lipsa trimiterii la verificare, referințele UID, limita de dimensiune și rezultatul SMTP acceptat cu eșec la copia Trimise. Testele folosesc transporturi simulate și nu expediază mesaje.

`db/check-platform-mail.sql` rulează cu rollback integral: testează privilegiile anon, toate rolurile de companie existente, ciclul criptat creare/actualizare/ștergere, absența parolelor din listare, refuzul în preview și revendicarea unică a expedierii. Nu conectează servere și nu afișează parole reale.

Testarea cu datele reale Hostico se face după completarea formularului. Pentru acceptarea funcțională completă: conectare, mesaj de test către o adresă controlată de proprietar, răspuns, ciornă verificată în webmail și atașament primit. Acestea nu trebuie raportate ca verificate înainte de efectuare. Verificarea vizuală într-o sesiune Super Admin trebuie făcută separat.

Documentație consultată: [ImapFlow](https://imapflow.com/docs/api/imapflow-client/), [Nodemailer SMTP](https://nodemailer.com/smtp), [MailParser](https://nodemailer.com/extras/mailparser), [Supabase Vault](https://supabase.com/docs/guides/database/vault).
