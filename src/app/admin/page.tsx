import { Building2, CreditCard, Users, ShieldCheck } from "lucide-react";

const UPCOMING = [
  {
    icon: Building2,
    title: "Companii",
    description:
      "Lista tuturor firmelor client (tenants) — vezi, activezi, suspenzi sau editezi orice companie din platformă.",
  },
  {
    icon: CreditCard,
    title: "Planuri & abonamente",
    description:
      "Starter / Team / Pro / Enterprise pentru fiecare companie, limite de utilizatori și lucrări, facturare ElectroField.",
  },
  {
    icon: Users,
    title: "Utilizatori pe companie",
    description:
      "Vezi cine e administrator de companie la fiecare client și intervii dacă e nevoie de suport.",
  },
  {
    icon: ShieldCheck,
    title: "Feature flags",
    description:
      "Activezi funcționalități în avans pentru anumite companii, înainte de lansarea generală.",
  },
];

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-3 py-1 text-[12.5px] font-semibold text-purple">
        Panou Admin ElectroField
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-[#17151f]">
        Aici gestionezi toate companiile client din platformă.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#5c5670]">
        Acest cont (contul tău, ca proprietar al ElectroField) nu aparține niciunei
        companii client — el vede și administrează toate firmele care folosesc
        platforma. Construim panoul pas cu pas; mai jos e ce urmează.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {UPCOMING.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-[#e7e3f5] bg-white p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-purple-soft">
              <Icon className="h-5 w-5 text-purple" strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-[14.5px] font-bold text-[#17151f]">
              {title}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6b647f]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
