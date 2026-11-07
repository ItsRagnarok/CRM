import Link from "next/link";
import { Plus, Wallet, CheckCircle2 } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";

const CATEGORY_LABELS: Record<string, string> = {
  materiale: "Materiale", combustibil: "Combustibil", parcare: "Parcare", transport: "Transport", unelte: "Unelte", altele: "Altele",
};
const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "În așteptare", tone: "wr" },
  approved: { label: "Aprobată", tone: "ok" },
  rejected: { label: "Respinsă", tone: "bad" },
};

export default async function MobileExpensesPage({ searchParams }: { searchParams: Promise<{ trimis?: string }> }) {
  const { trimis } = await searchParams;
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, amount, vendor, expense_date, status, rejection_reason, paid_with, jobs(display_number, title)")
    .eq("submitted_by", profile.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  const pendingTotal = (expenses ?? []).filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const toReceive = (expenses ?? []).filter((e) => e.status === "approved" && e.paid_with === "own").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title="Cheltuieli"
        back="/mobil/meniu"
        right={<Link href="/mobil/cheltuieli/noua" className="m-ib ac" aria-label="Cheltuială nouă"><Plus className="m-i" /></Link>}
      />
      <div className="m-bd">
        {trimis && (
          <div className="m-note ac">
            <CheckCircle2 className="m-i" style={{ color: "var(--m-aci)" }} />
            <div className="m-fl" style={{ fontWeight: 700 }}>Cheltuiala a fost trimisă la birou.</div>
          </div>
        )}
        {(expenses ?? []).length > 0 && (
          <div className="m-cd m-r" style={{ gap: 0 }}>
            <div className="m-stat"><b>{pendingTotal.toFixed(2)}</b><span>lei în așteptare</span></div>
            <div style={{ width: 1, height: 34, background: "var(--m-ln)" }} />
            <div className="m-stat"><b>{toReceive.toFixed(2)}</b><span>lei de primit (decont)</span></div>
          </div>
        )}
        {(expenses ?? []).length === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={Wallet} title="Nicio cheltuială" action={<Link href="/mobil/cheltuieli/noua" className="m-btn" style={{ width: "auto", padding: "0 28px" }}>Adaugă cheltuială</Link>}>
              Aici apar bonurile pe care le-ai trimis la birou.
            </EmptyScreen>
          </div>
        ) : (
          <div className="m-list">
            {(expenses ?? []).map((e) => (
              <div key={e.id}>
                <div className="m-row">
                  <div className="m-fl">
                    <div className="t">{CATEGORY_LABELS[e.category] ?? e.category}{e.vendor ? ` · ${e.vendor}` : ""}</div>
                    <div className="d">
                      {new Date(`${e.expense_date}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "long", timeZone: "Europe/Bucharest" })}
                      {e.jobs ? ` · #${e.jobs.display_number}` : ""} · {e.paid_with === "own" ? "din banii mei" : "card firmă"}
                    </div>
                    {e.status === "rejected" && e.rejection_reason && <div className="d" style={{ color: "var(--m-bad)" }}>{e.rejection_reason}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Number(e.amount).toFixed(2)} lei</div>
                    <span className={`m-pl ${STATUS[e.status]?.tone ?? ""}`} style={{ marginTop: 4 }}>{STATUS[e.status]?.label ?? e.status}</span>
                  </div>
                </div>
                <hr className="m-sep" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
