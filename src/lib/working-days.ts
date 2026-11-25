// Zile lucrătoare în România: fără sâmbătă, duminică și sărbătorile legale (Codul muncii, art. 139).
// Folosite pentru termenele din Ord. ANRE 179/2015: înregistrarea fișei la operator în cel mult
// 5 zile lucrătoare și predarea exemplarului către client în cel mult 2 zile lucrătoare.
// Procedura nu spune explicit cum se numără; aici: ziua întocmirii nu se numără, prima zi
// lucrătoare de după ea e ziua 1.
// Fără importuri: testat direct cu node.

/** Paștele ortodox (algoritmul Meeus pentru calendarul iulian + 13 zile, valabil 1900–2099). */
export function orthodoxEaster(year: number): string {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julian = Date.UTC(year, month - 1, day);
  return new Date(julian + 13 * 86_400_000).toISOString().slice(0, 10);
}

const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

const cache = new Map<number, Set<string>>();
export function romanianHolidays(year: number): Set<string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const easter = orthodoxEaster(year);
  const fixed = ["01-01", "01-02", "01-06", "01-07", "01-24", "05-01", "06-01", "08-15", "11-30", "12-01", "12-25", "12-26"].map((md) => `${year}-${md}`);
  const set = new Set([
    ...fixed,
    shift(easter, -2), // Vinerea Mare
    easter,
    shift(easter, 1),
    shift(easter, 49), // Rusalii
    shift(easter, 50),
  ]);
  cache.set(year, set);
  return set;
}

export function isWorkingDay(iso: string): boolean {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !romanianHolidays(Number(iso.slice(0, 4))).has(iso);
}

export function addWorkingDays(iso: string, n: number): string {
  let d = iso;
  let left = n;
  while (left > 0) {
    d = shift(d, 1);
    if (isWorkingDay(d)) left--;
  }
  return d;
}

/** Zile lucrătoare rămase de azi până la termen (0 = azi e ultima zi, negativ = depășit). */
export function workingDaysLeft(today: string, due: string): number {
  if (today === due) return 0;
  if (today < due) {
    let n = 0;
    let d = today;
    while (d < due) {
      d = shift(d, 1);
      if (isWorkingDay(d)) n++;
    }
    return n;
  }
  let n = 0;
  let d = due;
  while (d < today) {
    d = shift(d, 1);
    if (isWorkingDay(d)) n--;
  }
  return n === 0 ? -1 : n;
}

export type GasDeadline = { label: string; due: string; left: number; done: boolean };

/** Termenele de după fișă: înregistrare la operator, apoi exemplarul clientului. */
export function gasRecordDeadlines(r: {
  drawn_up_on: string | null;
  notice_due_on?: string | null;
  os_registered_on: string | null;
  client_delivered_on: string | null;
}, today: string): { register: GasDeadline | null; deliver: GasDeadline | null } {
  if (!r.drawn_up_on) return { register: null, deliver: null };
  let regDue = addWorkingDays(r.drawn_up_on, 5);
  if (r.notice_due_on && r.notice_due_on >= r.drawn_up_on && r.notice_due_on < regDue) regDue = r.notice_due_on;
  const register: GasDeadline = {
    label: "Înregistrare la operator",
    due: regDue,
    left: workingDaysLeft(today, regDue),
    done: Boolean(r.os_registered_on),
  };
  const deliver: GasDeadline | null = r.os_registered_on
    ? { label: "Exemplarul clientului", due: addWorkingDays(r.os_registered_on, 2), left: workingDaysLeft(today, addWorkingDays(r.os_registered_on, 2)), done: Boolean(r.client_delivered_on) }
    : null;
  return { register, deliver };
}
