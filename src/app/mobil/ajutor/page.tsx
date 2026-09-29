import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";

const FAQ = [
  {
    q: "Cum finalizez o lucrare?",
    a: "Din Lucrări, deschide lucrarea → Pornește lucrul → Fotografii → Cheltuială (opțional) → Finalizare → Semnătură.",
  },
  {
    q: "Ce fac dacă clientul nu e disponibil pentru semnătură?",
    a: "Pe ecranul de semnătură apasă „Clientul nu este disponibil — continuă fără semnătură”. Lucrarea se finalizează, iar administratorul va vedea că semnătura lipsește.",
  },
  {
    q: "Ce fac dacă nu am materialele necesare în mașină?",
    a: "Contactează administratorul companiei (mai jos) ca să confirme ce ai la dispoziție înainte să pleci la lucrare.",
  },
  {
    q: "Cum îmi pornesc/opresc pontajul?",
    a: "Pontajul se înregistrează automat pe măsură ce treci prin etapele lucrării (plecare, sosire, început lucru, pauză, finalizare).",
  },
];

export default async function MobileHelpPage() {
  const { organization } = await requireSessionContext();

  return (
    <div className="flex flex-col px-5 pb-6 pt-3">
      <Link href="/mobil/profil" className="mb-3 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi la profil
      </Link>
      <h1 className="text-[19px] font-extrabold">Ajutor & suport</h1>

      <div className="mt-4 overflow-hidden rounded-[13px] border border-[#eaecf0] bg-white">
        <div className="border-b border-[#f2f4f7] px-4 py-3 text-[13px] font-bold text-[#344054]">
          Contactează administratorul companiei
        </div>
        {organization.phone ? (
          <a href={`tel:${organization.phone}`} className="flex items-center gap-3 border-b border-[#f2f4f7] px-4 py-3.5">
            <Phone className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
            <div className="flex-1 text-[13.5px] font-semibold">{organization.phone}</div>
          </a>
        ) : null}
        {organization.email ? (
          <a href={`mailto:${organization.email}`} className="flex items-center gap-3 px-4 py-3.5">
            <Mail className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
            <div className="flex-1 text-[13.5px] font-semibold">{organization.email}</div>
          </a>
        ) : (
          <div className="px-4 py-3.5 text-[12.5px] text-muted-2">
            Compania nu are încă un contact de suport configurat.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <div className="text-[11.5px] font-bold text-muted-2">ÎNTREBĂRI FRECVENTE</div>
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-[13px] border border-[#eaecf0] bg-white p-3.5">
            <div className="text-[13.5px] font-bold text-[#101828]">{item.q}</div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-[#475467]">{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
