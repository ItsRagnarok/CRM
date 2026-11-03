# Panoul Mail pentru Super Admin

Ruta `/admin/mail` este un client IMAP/SMTP real. Nu conține adrese sau mesaje demonstrative. Afișările Inbox unificat și Pe adrese au fiecare Toate adresele și păstrează selecția la comutare. Preferința de afișare este singura informație păstrată în localStorage.

## Conectare

Din Mail → Adrese → Adaugă adresă se introduc numele afișat, adresa, username-ul și parola, serverul IMAP, serverul SMTP, porturile și securitatea din Hostico / Mail Client Manual Settings. IMAP acceptă 993 SSL/TLS sau 143 STARTTLS obligatoriu; SMTP acceptă 465 SSL/TLS sau 587 STARTTLS obligatoriu. Autentificarea SMTP poate folosi date diferite. Nu există conexiuni fără criptare sau opțiune de ignorare a certificatului.

Testează conexiunea verifică autentificarea și accesul la INBOX, precum și autentificarea SMTP, fără expedierea unui mesaj. Verifică și salvează repetă verificările înainte de persistență. Editarea permite păstrarea parolelor existente prin câmpuri goale. Deconectarea șterge configurația și secretul Vault; nu șterge căsuța sau mesajele de pe Hostico.

## Funcții și limite explicite

- Listare din server, 30 de mesaje per adresă și pagină, cu încărcarea mesajelor mai vechi. Actualizarea este manuală prin butonul de reîmprospătare; nu există sincronizare în fundal sau notificări push de mail.
- Căutare în expeditori și subiectele mesajelor încărcate. Nu reprezintă o căutare în întreaga arhivă de pe server.
- Citire și marcarea ca citit, răspuns de pe adresa destinatară cu antete de conversație și redirecționare inclusiv cu atașamentele originale.
- Compunere cu destinatari multipli în Către, CC și BCC (maximum 50 de adrese în total, separate prin virgulă sau punct și virgulă), Reply-To și Mail-Followup-To. BCC intră în anvelopa SMTP, dar este eliminat din MIME-ul primit de destinatari; rămâne în copia privată și în ciorne.
- Text simplu sau editor HTML cu aldin, cursiv, subliniere, liste și linkuri. HTML este filtrat pe server; scripturile, imaginile externe și atributele periculoase sunt eliminate. Versiunea text rămâne inclusă în mesajele HTML.
- Prioritate ridicată, normală sau scăzută, prin antetele standard. Confirmarea de citire este solicitată prin Disposition-Notification-To, iar notificările de livrare prin SMTP DSN. Acestea depind de suportul serverului și acordul destinatarului; nu sunt garanții de livrare sau citire. Lipsa suportului DSN anunțat de SMTP generează avertizare după acceptare. Mail-Followup-To indică adresele conversației, nu programează o retrimitere.
- Ciorne persistate în dosarul IMAP. La editare se salvează noua versiune, iar cea veche se mută în Coș; nu se expunge întregul dosar.
- Mutare în Coș și marcarea ca necitit persistă pe server. Nu există ștergere definitivă. Mutarea necesită MOVE sau UIDPLUS, pentru a evita expungerea altor mesaje marcate pentru ștergere de un alt client.
- Mesajele de maximum 25 MB pot fi citite și atașamentele lor descărcate. Cele mai mari se deschid în webmail. Citirea afișează text simplu, inclusiv conversia HTML în text; nu încarcă imagini externe și nu execută HTML.
- Compunerea permite maximum 20 de atașamente, cu 15 MB în total, inclusiv cele păstrate din ciorna/mesajul original. Încărcarea merge direct către bucketul privat Supabase `platform-mail-uploads`, pentru a evita limita de corp a funcțiilor Vercel. Serverul verifică proprietarul, manifestul și dimensiunea reală, apoi descarcă fișierele prin sesiunea autorizată pentru includere MIME. Nu primește URL-uri sau căi locale arbitrare.
- Fișierele temporare sunt eliminate prin Storage API după succes sau abandon confirmat. Dacă browserul se închide ori conexiunea cade, la următoarea deschidere a compunerii se încearcă eliminarea a cel mult 100 de fișiere proprii mai vechi de 24 de ore. Nu există un proces automat în fundal; fișierele abandonate pot rămâne până la următoarea utilizare. Ciornele deja salvate păstrează atașamentele în IMAP, independent de încărcările temporare.
- Salvarea unei copii după trimitere este opțională. Se poate alege un dosar IMAP existent, încărcat de la server, sau dosarul implicit Trimise. Dezactivarea opțiunii oprește crearea copiei de către platformă. Ciornele păstrează separat aceste opțiuni la redeschidere.
- SMTP acceptat nu înseamnă confirmarea livrării la destinatar. Dacă salvarea copiei în Trimise eșuează după acceptarea SMTP, se afișează avertizare de succes parțial și mesajul nu se retrimite automat.
- Un identificator de expediere revendicat atomic în baza de date previne repetarea aceleiași trimiteri. Dacă rezultatul SMTP este incert, se cere verificarea în webmail înainte de a compune o nouă expediere. Nu există retransmitere automată după timeout.
- Dacă SMTP acceptă doar o parte dintre destinatari, rezultatul este acceptare parțială cu lista celor refuzați. Nu se raportează eșec total și nu se retrimite întregul mesaj automat.
- Maximum 20 de căsuțe; 120 de operații sensibile pe minut per Super Admin.

## Securitate și stocare

Pagina, fiecare server action și ruta de atașamente verifică identitatea prin `requireAdminContext`, bazat pe `platform_admins`, nu pe rolul editabil din profilul companiei. Modul de vizualizare a companiei blochează accesul la operațiile de mail.

Tabelele sunt în schema neexpusă `private`, au RLS activ și nu au privilegii de acces direct pentru anon/authenticated. Parolele sunt stocate criptat în Supabase Vault. API-ul SQL invoker apelează implementarea din schema privată, care verifică independent apartenența la `platform_admins` pentru fiecare operație. Conturile obișnuite nu pot lista configurații, salva, șterge sau recupera secrete.

Doar un Super Admin autorizat poate recupera secretul prin RPC; aplicația îl consumă exclusiv în codul server IMAP/SMTP. Parolele nu sunt trimise în props, liste sau rezultate de server actions, nu sunt salvate în localStorage și nu sunt jurnalizate de bibliotecile de mail. Administratorii bazei de date păstrează accesul administrativ la Vault.

Serverele configurate trebuie să aibă exclusiv IP-uri publice. Conexiunea folosește IP-ul verificat, fără a rezolva din nou DNS, și păstrează hostname-ul pentru SNI și verificarea certificatului. Nu sunt permise IP-uri private, loopback, link-local sau URL-uri cu credențiale. Conexiunile au timeout, iar citirea are limită de volum.

Migrarea este `supabase/migrations/20261103010031_platform_mail_vault.sql`, cu versiunea confirmată în istoricul bazei găzduite. Nu sunt necesare chei suplimentare în Vercel; se utilizează sesiunea Supabase verificată și Vault-ul proiectului. Proiectul avea migrări mai vechi înainte de acest repository; nu folosi acest dosar ca istoric complet pentru un `db push` sau reset fără reconcilierea istoricului existent.

Migrarea `supabase/migrations/20261103013732_platform_mail_uploads.sql` creează bucketul privat pentru atașamente, cu RLS pentru INSERT/SELECT/DELETE. Sunt permise doar operațiile Super Adminului pe prefixul propriei identități, în afara modului preview. Nu există politică UPDATE pentru suprascrierea unui fișier. Politicile celorlalte bucketuri sunt păstrate.

## Afișare și scroll

Doar ruta Mail folosește înălțimea dinamică a ferestrei (100dvh); celelalte pagini administrative își păstrează scrollul obișnuit. Antetul și comenzile rămân vizibile, iar adresele, lista mesajelor și mesajul deschis au scroll independent. Afișarea pe adrese are o zonă limitată pentru carduri. Pe mobil se afișează lista sau mesajul ales, cu buton Înapoi. Compunerea are antet și butoane fixe, iar câmpurile și editorul se derulează în interior.

## Verificări

`node --test scripts/mail-security.test.mjs` verifică validarea, gestionarea parolelor la editare, protecția SSRF/DNS, TLS și lipsa trimiterii la verificare, referințele UID, limita de dimensiune și rezultatul SMTP acceptat cu eșec la copia Trimise. Testele folosesc transporturi simulate și nu expediază mesaje.

`db/check-platform-mail.sql` rulează cu rollback integral: testează privilegiile anon, toate rolurile de companie existente, ciclul criptat creare/actualizare/ștergere, absența parolelor din listare, refuzul în preview și revendicarea unică a expedierii. Nu conectează servere și nu afișează parole reale.

`db/check-mail-uploads.sql` verifică cu rollback metadatele și politicile bucketului: accesul Super Adminului la propriul prefix, refuzul celorlalte prefixe, refuzul rolurilor de companie și al accesului anonim/preview. Nu creează fișiere binare și nu ocolește protecția Supabase împotriva ștergerii directe prin SQL. Încărcarea și ștergerea efectivă se fac exclusiv prin Storage API.

Testarea cu datele reale Hostico se face după completarea formularului. Pentru acceptarea funcțională completă: conectare, mesaj de test către o adresă controlată de proprietar, răspuns, ciornă verificată în webmail și atașament primit. Acestea nu trebuie raportate ca verificate înainte de efectuare. Verificarea vizuală într-o sesiune Super Admin trebuie făcută separat.

Documentație consultată: [ImapFlow](https://imapflow.com/docs/api/imapflow-client/), [Nodemailer SMTP](https://nodemailer.com/smtp), [MailParser](https://nodemailer.com/extras/mailparser), [Supabase Vault](https://supabase.com/docs/guides/database/vault).
