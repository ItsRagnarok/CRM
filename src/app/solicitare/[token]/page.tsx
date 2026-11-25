import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RequestForm } from "./request-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cere o intervenție", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Formularul online al unei firme: clientul descrie problema și alege o zi; cererea ajunge la birou. */
export default async function PublicRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(token) ? await supabase.rpc("public_request_org", { p_token: token }) : { data: null };
  const org = data?.[0];

  return (
    <div className="min-h-screen bg-[#f4f6f2] px-4 py-8 text-[#16201b]" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-[560px]">
        {org ? (
          <>
            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#2f6b12]">{org.name}</div>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight">Cere o intervenție</h1>
            <p className="mt-2 text-[14.5px] text-[#5b6a61]">
              Spune-ne ce s-a întâmplat și când îți convine. Te contactăm ca să stabilim ziua și ora.
              {org.phone ? <> Pentru urgențe, sună la <b className="select-all text-[#16201b]">{org.phone}</b>.</> : null}
            </p>
            <RequestForm token={token} domains={org.enabled_domains ?? []} />
            <p className="mt-6 text-center text-[12px] text-[#7a887f]">
              Datele tale ajung doar la {org.name}, ca să te poată contacta pentru această cerere. Trimis prin ElectroField.
            </p>
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-[#dfe5dd] bg-white p-6">
            <h1 className="text-xl font-extrabold">Formularul nu mai este activ</h1>
            <p className="mt-2 text-[14.5px] text-[#5b6a61]">Linkul nu mai funcționează. Contactează firma direct, la telefon sau pe e-mail.</p>
          </div>
        )}
      </div>
    </div>
  );
}
