import { createClient } from "@/lib/supabase/server";
import { setAiEnabled } from "./actions";

const FEATURE: Record<string, string> = {
  bon: "Bon → cheltuială",
  placuta: "Plăcuță → marcă, model, serie",
  eticheta: "Etichetă scanată",
  descriere: "Lucrare nouă din descriere",
  dictare: "Dictare vocală",
};
const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

/** Setări → AI: comutatorul firmei, ce se trimite și unde, cât de des corectează oamenii ce citește AI-ul. */
export async function AiTab({ organizationId, enabled, canEdit }: { organizationId: string; enabled: boolean; canEdit: boolean }) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: rows } = await supabase
    .from("ai_log")
    .select("id, feature, provider, model, ok, error, ms, fields, corrected, confirmed_at, created_at, profiles(full_name)")
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  const list = rows ?? [];
  const stats = Object.keys(FEATURE).map((f) => {
    const r = list.filter((x) => x.feature === f);
    const ok = r.filter((x) => x.ok);
    const checked = ok.filter((x) => x.confirmed_at && (x.fields ?? 0) > 0);
    const fields = checked.reduce((a, x) => a + (x.fields ?? 0), 0);
    const corrected = checked.reduce((a, x) => a + (x.corrected ?? 0), 0);
    const ms = ok.length ? Math.round(ok.reduce((a, x) => a + (x.ms ?? 0), 0) / ok.length / 100) / 10 : null;
    return { f, uses: r.length, ok: ok.length, checked: checked.length, fields, corrected, ms };
  }).filter((s) => s.uses > 0 || ["bon", "placuta"].includes(s.f));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[13px] border border-border bg-white p-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-[640px]">
            <div className="text-[15px] font-bold text-foreground">AI cu confirmare</div>
            <p className="mt-1 text-[12.5px] text-muted">
              AI-ul doar completează câmpuri; omul verifică și trimite. Nu salvează, nu aprobă și nu contabilizează nimic singur.
              Fiecare citire intră în jurnal (cine, ce, cât a durat, câte câmpuri a corectat omul). Poza nu se păstrează în jurnal.
            </p>
          </div>
          <form action={setAiEnabled} className="flex items-center gap-3">
            <input type="hidden" name="on" value={enabled ? "0" : "1"} />
            <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${enabled ? "bg-success-bg text-success" : "bg-neutral-bg text-neutral"}`}>{enabled ? "Pornit" : "Oprit"}</span>
            {canEdit && <button className="rounded-[9px] border border-[#d0d5dd] px-3.5 py-2 text-[13px] font-bold">{enabled ? "Oprește AI-ul" : "Pornește AI-ul"}</button>}
          </form>
        </div>
        <ul className="mt-4 grid gap-2 text-[13px] text-[#344054] sm:grid-cols-2">
          <li className="rounded-[10px] bg-[#f9fafb] p-3"><b>Bon → cheltuială</b> (telefon: Cheltuială nouă, Am cumpărat de la magazin): suma, data, furnizorul, articolele.</li>
          <li className="rounded-[10px] bg-[#f9fafb] p-3"><b>Plăcuță → marcă, model, serie</b> (formularele tehnice: invertor, panou, baterie, tablou, aparat de măsură; Scanează → Etichetă).</li>
          <li className="rounded-[10px] bg-[#f9fafb] p-3"><b>Lucrare nouă din descriere</b> și <b>dictare</b> (birou): ca până acum, acum cu jurnal.</li>
          <li className="rounded-[10px] bg-[#f9fafb] p-3"><b>Unde pleacă datele:</b> pozele ajung la Google Gemini (dacă nu răspunde și e configurat, la Groq); textul de la „Lucrare nouă” și dictarea, la Groq. Doar când omul apasă butonul AI, niciodată automat.</li>
        </ul>
        <p className="mt-3 text-[12px] text-muted">
          Pozele pot conține date personale (nume pe bon, adresa clientului). Înainte de folosirea cu clienți reali: acord de prelucrare (DPA) cu furnizorul, mențiune în politica de confidențialitate și informarea angajaților. Oprit, butoanele AI dispar din aplicație și de pe platformă.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[13px] border border-border bg-white">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Ultimele 30 de zile</th><th className="px-4 py-3">Folosiri</th><th className="px-4 py-3">Citite</th><th className="px-4 py-3">Verificate de om</th><th className="px-4 py-3">Câmpuri corectate</th><th className="px-4 py-3">Durată medie</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.f} className="border-t border-[#f2f4f7]">
                <td className="px-4 py-3 font-semibold">{FEATURE[s.f]}</td>
                <td className="px-4 py-3">{s.uses}</td>
                <td className="px-4 py-3">{s.uses ? `${s.ok} (${pct(s.ok, s.uses)})` : "—"}</td>
                <td className="px-4 py-3">{["descriere", "dictare"].includes(s.f) ? "—" : s.checked}</td>
                <td className="px-4 py-3">{s.fields ? `${s.corrected} din ${s.fields} (${pct(s.corrected, s.fields)})` : "—"}</td>
                <td className="px-4 py-3">{s.ms !== null ? `${String(s.ms).replace(".", ",")} s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pb-3 text-[12px] text-muted">„Câmpuri corectate” arată cât de des greșește AI-ul pe pozele voastre: dacă rămâne mare, completați de mână.</p>
      </div>

      {list.length > 0 && (
        <details className="rounded-[13px] border border-border bg-white p-4">
          <summary className="cursor-pointer text-[13.5px] font-bold">Jurnal ({list.length} în 30 de zile)</summary>
          <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-[#475467]">
            {list.slice(0, 50).map((r) => (
              <li key={r.id}>
                <b className="text-foreground">{when(r.created_at)}</b> · {r.profiles?.full_name ?? "—"} · {FEATURE[r.feature] ?? r.feature} · {r.ok ? `${r.provider ?? ""} ${r.model ?? ""}`.trim() : <span className="text-danger">nereușit{r.error ? ` (${r.error})` : ""}</span>}
                {r.ms ? ` · ${(r.ms / 1000).toFixed(1).replace(".", ",")} s` : ""}
                {r.confirmed_at ? ` · verificat: ${r.corrected ?? 0} din ${r.fields ?? 0} câmpuri corectate` : r.ok && !["descriere", "dictare"].includes(r.feature) ? " · neverificat încă" : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
