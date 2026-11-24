# AI util pentru firme de instalații: ce merită, ce e marketing (nov. 2026)

Etichete: **[C]** confirmat pe pagină citită integral / **[S]** doar din rezumat de căutare / **[E]** estimare. Aproape totul despre concurenți e [S]: nu am citit pagini de preț complete, iar forumul Jobber a dat 403 la citire. Nu există dovezi din România despre vreo funcție AI în software de instalații.

## 1. Ce au lansat concurenții
- **ServiceTitan**: „Titan Intelligence" alimentează Atlas (asistent în platformă, cereri scrise sau vorbite: rapoarte, găsit lucrări, dispecerat) și suita „Pro" (Dispatch Pro, Contact Center Pro, Marketing/Scheduling/Sales Pro), anunțate la Pantheon 2025 [S]. Documentația proprie spune că unele sunt doar „select accounts" sau „private preview"; singurul rezultat citat e „−10% timp de condus" cu Dispatch Pro la clienți early-access, deci cifră de vendor [S]. https://www.servicetitan.com/press/servicetitan-major-product-expansions-pantheon-2025 · https://www.servicetitan.com/features/pro
- **Jobber**: AI Receptionist (răspunde la apeluri/SMS 24/7, creează cerere sau task în Jobber). Preț contradictoriu între sursele găsite: 29 $/lună vs 99 $/lună, fără volum inclus clar [S]. https://getjobber.com/features/ai-receptionist/ · https://contractortoolstack.com/software/jobber/pricing/
- **Housecall Pro**: „AI Team"; CSR AI (apeluri/chat, programează în calendar) e add-on cu preț nepublicat (estimări terțe 200–500 $/lună, [E]). Chat pe site inclus. https://help.housecallpro.com/en/articles/9311875-ai-team-overview
- Pattern comun: **toți au pus AI în jurul telefonului/biroului (recepție, dispecerat, marketing)**. Niciunul dintre rezumatele găsite nu menționează dictare de raport, OCR de bonuri sau citire de plăcuță din poză ca funcții-vedetă [S, negăsit ≠ inexistent].

## 2. Ce spun utilizatorii (doar forum Jobber, prin rezumat [S])
- Pozitiv: „niciun apel nu mai ajunge în căsuța vocală", util **după program și la depășire de volum**.
- Negativ: „în cel mai bun caz mediu, adesea iritant"; fluxul de întrebări „blocat"; unii clienți cer să nu mai vorbească cu AI.
- Consens: domeniu îngust (adresă, problemă, callback) și **scriere înapoi în sistem** ca cerere reală. Mărimea de piață e SUA; clienții români de gaze/electric sună rar la o recepție, deci valoarea e mai mică [E].
- Trustpilot (Housecall Pro 3/5 din 573; Jobber 4/5 din 143) e despre produs în general, nu despre AI [S].

## 3. Funcție cu funcție pentru ElectroField

| Funcție | Dovadă | Risc | Verdict |
|---|---|---|---|
| **Dictare raport în română** | Whisper zero-shot pe română: large-v2 15,8% WER Common Voice / 14,4% FLEURS; large-v3-turbo 20,7% WER CV20; fine-tuned large-v3 ~9,8% FLEURS / 11,4% CV25 [S: model cards HF, seturi și normalizări diferite, necomparabile direct]. Nu am găsit test pe vorbire de șantier (zgomot, termeni: „disjunctor diferențial", „PRAM", „racord"). Google Chirp 3 listează ro-RO ca GA [S]. | Erori la cifre, serii, valori (Ω, mA) | **Da, ca ciornă editabilă**, niciodată date măsurate. Valorile se introduc în câmpuri, nu din voce. |
| **OCR bon/factură materiale** | Studiu academic [C]: modele multimodale citesc direct imaginea; pe bonuri (SROIE) cel mai bun 87,5% acuratețe la nivel de document (Gemini 2.5 Pro), GPT-5-chat 69%, GPT-5-mini 54%; facturi curate ~96%, scanate ~92%. Câmpurile alfanumerice lungi (IBAN) greșesc cel mai des (0 vs O). https://arxiv.org/html/2509.04469v1 | Bonuri românești termice șterse; totaluri/TVA greșite; set de test englezesc/ICDAR | **Da, cu confirmare umană**: pre-completează furnizor, dată, total, TVA, linii; omul apasă „corect". Nu automatizăm contabilizarea. |
| **Plăcuță invertor/contor/centrală din poză** | N-am găsit evaluare publicată pe plăcuțe. Logic [E]: text scurt pe suprafață lucioasă; modelele multimodale ar trebui să citească bine, dar nu e dovedit. | O serie citită greșit intră în garanție/dosar PV | **Da, ca pre-completare** (marcă, model, serie) cu poza alăturată și câmp editabil; măsurăm rata de corectare în pilot. |
| **Verificare poze obligatorii** | Partea sigură e **regula, nu AI**: lista de poze cerute pe tip de lucrare (deja posibilă). AI adaugă doar „poza e neclară/întunecată" (verificare de blur/luminozitate se poate face local, fără AI) [E]. | AI care „decide" că poza e bună = fals sentiment de conformitate | **Regulă + verificare de claritate locală**; fără model AI pentru conținut. |
| **Rezumat zilei pentru birou** | Fără studii; dar e sarcină de text pe date proprii, risc mic [E]. | Rezumă greșit dacă datele sunt incomplete | **Da, ieftin**: din pontaj, lucrări închise, materiale, „bani de recuperat". Să arate linkuri la sursă. |
| **Răspuns automat la cereri clienți** | Recepție vocală: valoare contestată de utilizatori (secțiunea 2). | Clienți nemulțumiți; GDPR la apeluri înregistrate | **Nu în prima etapă.** Eventual doar ciornă de răspuns pe link-ul de status, trimisă de om. |
| **Estimare durată lucrare** | N-am găsit dovezi pentru instalatori. Cu 3–50 firme, istoricul e mic [E]. | Cifre false cu date puține | **Nu AI**: medie istorică pe tip de lucrare din pontaj (statistică simplă), afișată cu „n lucrări". |
| **Sugestii de ofertă** | Nicio dovadă găsită. | Preț greșit = pierdere de marjă | **Mai târziu**: din catalog + marjă pe lucrare, sugestie de linii după lucrări similare, fără prețuri inventate. |

## 4. Cost, GDPR, date în afara UE
- **Cost**: nu am găsit prețuri verificate pentru API-uri de transcriere/OCR; la volumul unei firme de 5 oameni e probabil mic per lucrare, dar de calculat pe tarifele curente [E, necercetat]. Concurenții cer 29–500 $/lună doar pentru recepție.
- **GDPR** (ghid AEPD Spania, [S]): cine folosește transcriere AI e operator; trebuie informare prealabilă, evaluare continuă a riscului de erori, atenție la reutilizarea înregistrărilor pentru antrenare. Dictarea tehnicianului e voce de angajat la locul de muncă: informare internă + regula „fără antrenare pe datele noastre". https://www.aepd.es/en/press-and-communication/blog/ai-voice-transcription
- **Date în UE**: OpenAI oferă rezidență în Europa doar pentru proiecte **noi**, iar în rezumat nu am putut confirma că acoperă transcrierea audio [S] — de verificat în ghidul lor. Google Chirp 3: listarea găsită arată regiune „us" în preview, disponibilitatea în UE neconfirmată [S]. Nu am cercetat poziția ANSPDCP. https://openai.com/index/introducing-data-residency-in-europe/ · https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3
- **Fotografii cu clienți/case/adrese** trimise la un model extern sunt date personale; trebuie încheiat DPA cu furnizorul și menționat în politica de confidențialitate [E, de validat juridic].

## 5. Ce înseamnă pentru ElectroField

1. **Poză la bon → câmpuri pre-completate** (furnizor, dată, total, TVA, linii) în ecranul de cheltuială; buton „corect/modific", jurnal al corecțiilor. Prioritate: **mare**. Pentru: tehnician, birou.
2. **Poză la plăcuță → marcă/model/serie** pe fișa aparatului (invertor, contor, centrală), poza păstrată ca dovadă. Prioritate: **mare** (se leagă de garanții și dosar PV). Pentru: tehnician, birou.
3. **Dictare în câmpul „observații/raport"** cu transcriere editabilă, marcată „ciornă"; câmpurile numerice (măsurători) rămân manuale. Prioritate: **medie** (testăm întâi pe 20 de înregistrări reale de șantier). Pentru: tehnician.
4. **Listă poze obligatorii pe tip de lucrare** + verificare locală de claritate/întuneric înainte de închidere; fără model AI. Prioritate: **mare**, efort mic. Pentru: tehnician, birou.
5. **Rezumat de seară pentru birou/patron**: lucrări închise, ore, materiale, lipsuri de poze, bani de recuperat, cu linkuri la sursă. Prioritate: **medie**. Pentru: patron, birou.
6. **Durata estimată = medie istorică pe tip de lucrare** din pontaj, cu numărul de lucrări pe care se bazează. Prioritate: **medie**. Pentru: birou.
7. **Comutator AI pe firmă + registru de utilizare** (ce s-a trimis, către cine, furnizor în UE) și text de informare pentru angajați. Prioritate: **mare** înainte de orice funcție AI. Pentru: patron.
8. **Răspuns la clienți și sugestii de ofertă**: doar ciorne trimise de om, abia după pilot. Prioritate: **mică**. Pentru: birou, client.
9. **Măsurare în pilot**: rata de corectare la OCR/plăcuțe/dictare și minute economisite; fără ea nu justificăm costul. Prioritate: **mare**. Pentru: echipa de produs.

**Lacune**: lipsesc test WER pe română de șantier, test OCR pe bonuri românești, prețuri API verificate, confirmare rezidență UE pentru audio, poziția ANSPDCP, opinii reale de la instalatori (forumurile citite sunt americane).
