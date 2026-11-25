"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";
import { BookingRotation, type Rotation } from "./booking-rotation";
import { bookingConfirmation } from "@/lib/booking-confirmation";
import { PersonalConfirmation } from "./personal-confirmation";

type Settings = Database["public"]["Tables"]["booking_settings"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Day = Database["public"]["Tables"]["booking_days"]["Row"];
type Weekday = { on: boolean; from: string; to: string };
type Weekly = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", Weekday>> & { _texts?: Record<string, string>; _rotation?: Rotation };
const WEEKDAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const DEFAULT_TEXTS: Record<string, string> = {
  title: "Programează o discuție", sub: "Alege o zi din calendar, apoi ora. Zilele cu linie galbenă au ore libere.",
  slotsEmpty: "Ora", pickDay: "Alege o zi din calendar.", slotsTitle: "Ore libere: {data}",
  noSlots: "Nu mai sunt ore libere în această zi.", formTitle: "Datele tale pentru {data}, ora {ora}",
  book: "Confirmă programarea", ok: "Programat: {data}, ora {ora}. Te contactăm.",
};
const TEXT_LABELS: Record<string, string> = { title: "Titlul paginii", sub: "Descriere", slotsEmpty: "Titlu ore", pickDay: "Alege o zi", slotsTitle: "Ore disponibile", noSlots: "Fără ore disponibile", formTitle: "Titlu formular", book: "Buton confirmare", ok: "Mesaj confirmare" };
const input = "rounded-lg border border-border bg-white px-3 py-2 text-sm";
const button = "rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const card = "space-y-4 rounded-xl border border-border bg-white p-5";
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const clock = (date: string) => new Date(date).toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" });
function datesBetween(from: string, to: string) {
  const days: string[] = [];
  for (const day = new Date(`${from}T12:00:00Z`); day <= new Date(`${to}T12:00:00Z`) && days.length < 366; day.setUTCDate(day.getUTCDate() + 1)) days.push(day.toISOString().slice(0, 10));
  return days;
}
function standardSlots(day: string, weekly: Weekly, minutes: number) {
  const value = weekly[String(new Date(`${day}T12:00:00Z`).getUTCDay()) as "0"];
  if (!Number.isFinite(minutes) || minutes < 10 || minutes > 240) return [];
  if (!value?.on) return [];
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const result: string[] = [];
  for (let n = toMinutes(value.from); n + minutes <= toMinutes(value.to); n += minutes) result.push(`${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`);
  return result;
}

function groupByDay(list: Booking[]) {
  const map = new Map<string, Booking[]>();
  for (const b of list) { const k = dayKey(new Date(b.slot_start)); map.set(k, [...(map.get(k) ?? []), b]); }
  return [...map.entries()];
}
function dayTitle(day: string, today: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const tomorrow = new Date(`${today}T12:00:00Z`); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const long = date.toLocaleDateString("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  return day === today ? `Azi, ${long}` : day === tomorrow.toISOString().slice(0, 10) ? `Mâine, ${long}` : long;
}

export function BookingAdmin({ settings, days, bookings, past }: { settings: Settings; days: Day[]; bookings: Booking[]; past: Booking[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"lista" | "program" | "texte">("lista");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [weekly, setWeekly] = useState(settings.weekly as unknown as Weekly);
  const [texts, setTexts] = useState({ ...DEFAULT_TEXTS, ...((settings.weekly as unknown as Weekly)._texts ?? {}) });
  const [slotMinutes, setSlotMinutes] = useState(settings.slot_minutes);
  const [confirmation, setConfirmation] = useState(() => bookingConfirmation(settings.weekly));
  const [daysAhead, setDaysAhead] = useState(settings.days_ahead);
  const today = dayKey(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [customSlots, setCustomSlots] = useState<string[] | null>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const dayBookings = bookings.filter((b) => dayKey(new Date(b.slot_start)) === selectedDay);
  const stored = days.find((d) => d.day === selectedDay)?.slots as string[] | undefined;
  const selectedSlots = customSlots ?? stored ?? standardSlots(selectedDay, weekly, slotMinutes);
  const safeMinutes = Number.isInteger(slotMinutes) && slotMinutes >= 10 && slotMinutes <= 240 ? slotMinutes : 30;
  const allSlots = [...new Set([...Array.from({ length: Math.floor(24 * 60 / safeMinutes) }, (_, n) => `${Math.floor(n * safeMinutes / 60).toString().padStart(2, "0")}:${(n * safeMinutes % 60).toString().padStart(2, "0")}`), ...selectedSlots, ...dayBookings.map((b) => clock(b.slot_start))])].sort();

  function run(action: () => Promise<{ error: { message: string } | null }>, success: string, onSuccess?: () => void) {
    setMessage("");
    startTransition(async () => {
      try { const result = await action(); if (result.error) setMessage(`Eroare: ${result.error.message}`); else { onSuccess?.(); setMessage(success); router.refresh(); } }
      catch { setMessage("Eroare de conexiune. Modificările nu au fost confirmate."); }
    });
  }
  function saveSettings() {
    if (!confirmation.subject.trim() || !confirmation.message.trim()) { setMessage("Completează subiectul și textul confirmării."); return; }
    if (!Number.isInteger(slotMinutes) || slotMinutes < 10 || slotMinutes > 240 || !Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > 731) { setMessage("Durata trebuie să fie 10–240 minute, iar intervalul 1–731 zile."); return; }
    if ([0, 1, 2, 3, 4, 5, 6].some((key) => { const d = weekly[String(key) as "0"]; return d?.on && d.from >= d.to; })) { setMessage("Ora de început trebuie să fie înainte de ora de final."); return; }
    run(async () => await createClient().from("booking_settings").upsert({ id: 1, slot_minutes: slotMinutes, days_ahead: daysAhead, weekly: { ...weekly, _texts: texts, _confirmation: confirmation } as unknown as Json }), "Programul și textele au fost salvate.");
  }
  function saveDays(keys: string[], getSlots: (key: string) => string[]) {
    if (!keys.length || keys.some((key) => key < today)) { setMessage("Alege o perioadă validă, începând de astăzi."); return; }
    const rows = keys.map((day) => ({ day, slots: [...new Set(getSlots(day))].sort() }));
    run(async () => await createClient().from("booking_days").upsert(rows), "Disponibilitatea a fost actualizată. Programările existente au fost păstrate.");
  }
  function applyRotation(rotation: Rotation) {
    if (!rotation.start || !rotation.end || rotation.end < today || rotation.end < rotation.start) {
      setMessage("Verifică data de început și data de final.");
      return;
    }
    run(async () => await createClient().rpc("apply_booking_rotation", {
      p_start: rotation.start,
      p_end: rotation.end,
      p_pattern: rotation.pattern,
    }), "Rotația a fost aplicată. Programările confirmate au fost păstrate.", () => {
      setCustomSlots(null);
      setWeekly((previous) => ({
        ...previous,
        ...Object.fromEntries(WEEKDAYS.map((_, index) => [index, { on: false, from: "10:00", to: "19:00" }])),
        _rotation: rotation,
      }));
      setDaysAhead((previous) => Math.max(previous, (Date.parse(rotation.end) - Date.parse(today)) / 864e5));
    });
  }
  const tabClass = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-bold ${on ? "border-foreground bg-foreground text-white" : "border-border bg-white text-foreground"}`;
  const groups = groupByDay(bookings);
  return <div className="mx-auto max-w-5xl space-y-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Programări</h1><a href="/programare" target="_blank" rel="noreferrer" className="text-sm font-semibold text-purple">Vezi pagina publică ↗</a></div>
    <nav className="flex flex-wrap gap-2" aria-label="Secțiuni">
      <button type="button" className={tabClass(tab === "lista")} aria-pressed={tab === "lista"} onClick={() => { setTab("lista"); setMessage(""); }}>Programări · {bookings.length}</button>
      <button type="button" className={tabClass(tab === "program")} aria-pressed={tab === "program"} onClick={() => { setTab("program"); setMessage(""); }}>Program și zile libere</button>
      <button type="button" className={tabClass(tab === "texte")} aria-pressed={tab === "texte"} onClick={() => { setTab("texte"); setMessage(""); }}>Texte și e-mail</button>
    </nav>
    {message && <p role="status" className="rounded-lg border border-border bg-neutral-bg p-3 text-sm">{message}</p>}
    <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
      {tab === "lista" && <>
        {!bookings.length && <section className={card}><p className="text-sm font-semibold">Nicio programare viitoare.</p><p className="text-sm text-muted">Când cineva rezervă pe pagina publică, apare aici și primești e-mail.</p></section>}
        {groups.map(([day, list]) => <section key={day} className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{dayTitle(day, today)} · {list.length}</h2>
          {list.map((b) => <article key={b.id} className="flex flex-wrap gap-4 rounded-xl border border-border bg-white p-4">
            <div className="w-14 shrink-0 text-xl font-extrabold tabular-nums sm:w-16 sm:text-2xl">{clock(b.slot_start)}</div>
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <p className="text-base font-bold">{b.name}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1"><a href={`tel:${b.phone}`} className="font-semibold text-purple">{b.phone}</a>{b.email && <a href={`mailto:${b.email}`} className="text-purple">{b.email}</a>}</p>
              {b.note && <p className="whitespace-pre-line rounded-lg bg-neutral-bg p-2.5 text-foreground">{b.note}</p>}
              {b.created_at && <p className="text-xs text-muted">Rezervată {new Date(b.created_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
            </div>
            <div className="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
              {cancelling === b.id
                ? <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end"><span>Anulezi?</span><button type="button" className="rounded-lg bg-danger px-3 py-1.5 font-semibold text-white" onClick={() => run(async () => await createClient().from("bookings").delete().eq("id", b.id), "Programarea a fost anulată.", () => setCancelling(null))}>Da, anulează</button><button type="button" className="rounded-lg border border-border px-3 py-1.5" onClick={() => setCancelling(null)}>Nu</button></div>
                : <button type="button" className="rounded-lg border border-border px-3 py-1.5 text-sm text-danger" onClick={() => setCancelling(b.id)}>Anulează</button>}
            </div>
            {b.email && <div className="order-last basis-full"><PersonalConfirmation id={b.id} email={b.email} template={confirmation} /></div>}
          </article>)}
        </section>)}
        {!!past.length && <details className={card}>
          <summary className="cursor-pointer text-base font-bold">Programări trecute (ultimele 90 de zile) · {past.length}</summary>
          <ul className="divide-y divide-border text-sm">{past.map((b) => <li key={b.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2.5"><span className="w-40 tabular-nums text-muted">{new Date(b.slot_start).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span><span className="font-semibold">{b.name}</span><a href={`tel:${b.phone}`} className="text-purple">{b.phone}</a>{b.email && <span className="text-muted">{b.email}</span>}{b.note && <span className="basis-full whitespace-pre-line text-muted">{b.note}</span>}</li>)}</ul>
        </details>}
      </>}

      {tab === "program" && <>
        <p className="text-sm text-muted">Orele sunt în ora României. Programările deja făcute nu se șterg când schimbi programul.</p>
        <section className={card}><h2 className="text-lg font-bold">Program standard</h2><p className="text-sm text-muted">Zilele și orele în care se poate rezerva de obicei.</p>{[1, 2, 3, 4, 5, 6, 0].map((n) => { const day = weekly[String(n) as "0"] ?? { on: false, from: "09:00", to: "17:00" }; return <div key={n} className="flex flex-wrap items-center gap-3 text-sm"><label className="w-28"><input type="checkbox" checked={day.on} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, on: e.target.checked } })} /> {WEEKDAYS[n]}</label><input aria-label={`${WEEKDAYS[n]} început`} type="time" value={day.from} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, from: e.target.value } })} className={input} /><span>–</span><input aria-label={`${WEEKDAYS[n]} final`} type="time" value={day.to} onChange={(e) => setWeekly({ ...weekly, [n]: { ...day, to: e.target.value } })} className={input} /></div>; })}<div className="flex flex-wrap gap-4"><label className="text-sm">Durată (minute) <input type="number" min={10} max={240} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className={`${input} w-24`} /></label><label className="text-sm">Zile în avans <input type="number" min={1} max={731} value={daysAhead} onChange={(e) => setDaysAhead(Number(e.target.value))} className={`${input} w-24`} /></label></div><button className={button} onClick={saveSettings}>Salvează programul</button></section>
        <section className={card}><h2 className="text-lg font-bold">Schimbă o singură zi</h2><p className="text-sm text-muted">Bifează orele libere din ziua aleasă sau închide ziua.</p>
          <label className="flex flex-wrap items-center gap-3 text-sm">Ziua <input type="date" min={today} value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value || today); setCustomSlots(null); }} className={input} /></label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{allSlots.map((time) => { const booking = dayBookings.find((b) => clock(b.slot_start) === time); const selected = selectedSlots.includes(time); return <button key={time} type="button" disabled={!!booking} title={booking ? `Rezervat: ${booking.name}` : undefined} aria-pressed={selected} onClick={() => setCustomSlots(selected ? selectedSlots.filter((t) => t !== time) : [...selectedSlots, time])} className={`rounded-lg border p-2 text-xs ${booking ? "border-border bg-amber-soft" : selected ? "border-purple bg-purple-soft text-purple" : "border-border"}`}>{time}{booking ? " · rezervat" : ""}</button>; })}</div>
          <div className="flex flex-wrap gap-2"><button className={button} onClick={() => saveDays([selectedDay], () => selectedSlots)}>Salvează ziua</button><button className={input} onClick={() => saveDays([selectedDay], () => [])}>Închide ziua</button><button className={input} onClick={() => run(async () => await createClient().from("booking_days").delete().eq("day", selectedDay), "Ziua folosește din nou programul standard.")}>Revino la programul standard</button>
          <button className={input} onClick={() => { const date = new Date(`${selectedDay}T12:00:00Z`); const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10); saveDays(datesBetween(selectedDay, end).filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === date.getUTCDay()), () => selectedSlots); }}>Repetă în aceeași zi a săptămânii, până la sfârșitul lunii</button></div>
          {!!dayBookings.length && <p className="text-sm text-muted">Rezervări: {dayBookings.map((b) => `${clock(b.slot_start)} — ${b.name}`).join("; ")}</p>}
        </section>
        <section className={card}><h2 className="text-lg font-bold">Concediu sau zile libere</h2><p className="text-sm text-muted">Nimeni nu poate rezerva în perioada aleasă. Programările confirmate se păstrează.</p><div className="flex flex-wrap gap-3"><label className="text-sm">De la <input aria-label="Prima zi" type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className={input} /></label><label className="text-sm">Până la <input aria-label="Ultima zi" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} className={input} /></label></div><div className="flex flex-wrap gap-3"><button className={button} onClick={() => saveDays(datesBetween(from, to), () => [])}>Blochează perioada</button><button className={input} onClick={() => { if (!from || !to || to < from || datesBetween(from, to).length > 365) { setMessage("Alege o perioadă de maximum 365 de zile."); return; } run(async () => await createClient().from("booking_days").delete().gte("day", from).lte("day", to), "Perioada folosește programul standard."); }}>Revino la programul standard</button></div></section>
        <details className={card}><summary className="cursor-pointer text-lg font-bold">Avansat: program în rotație (ture)</summary><BookingRotation saved={weekly._rotation} today={today} onApply={applyRotation} /></details>
      </>}

      {tab === "texte" && <>
        <section className={card}>
          <h2 className="text-lg font-bold">E-mail de confirmare pentru client</h2>
          <p className="text-sm text-muted">Se trimite automat după rezervare. Folosește {"{nume}"}, {"{data}"} și {"{ora}"}; se înlocuiesc singure.</p>
          <label className="block space-y-1 text-sm">Subiect
            <input className={`${input} block w-full`} maxLength={160} value={confirmation.subject} onChange={(event) => setConfirmation({ ...confirmation, subject: event.target.value })} />
          </label>
          <label className="block space-y-1 text-sm">Mesaj
            <textarea className={`${input} block w-full`} rows={5} maxLength={3000} value={confirmation.message} onChange={(event) => setConfirmation({ ...confirmation, message: event.target.value })} />
          </label>
          <button className={button} onClick={saveSettings}>Salvează</button>
        </section>
        <details className={card}><summary className="cursor-pointer text-lg font-bold">Textele paginii publice</summary><p className="text-sm text-muted">Poți păstra {"{data}"} și {"{ora}"} pentru afișarea datei și orei.</p>{Object.keys(DEFAULT_TEXTS).map((key) => <label key={key} className="block space-y-1 text-sm">{TEXT_LABELS[key]}<textarea rows={2} value={texts[key]} onChange={(e) => setTexts({ ...texts, [key]: e.target.value })} className={`${input} block w-full`} /></label>)}<button className={button} onClick={saveSettings}>Salvează textele</button></details>
      </>}
    </fieldset>
  </div>;
}
