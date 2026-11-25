// Ora unei acțiuni făcute pe telefon fără semnal (sosire, început lucru, poză, semnătură,
// închidere). Acțiunea ajunge la server mai târziu, dar în pontaj și în dosar trebuie să
// rămână ora reală. Acceptăm ora trimisă de telefon doar dacă e plauzibilă:
//  - nu în viitor (toleranță 5 minute pentru ceasuri ușor decalate);
//  - nu mai veche de 7 zile (o coadă uitată nu poate rescrie pontajul de luna trecută).
// Altfel folosim ora serverului.

const FUTURE_TOLERANCE_MS = 5 * 60_000;
const MAX_AGE_MS = 7 * 86_400_000;

export function acceptClientTime(value: unknown, now: number = Date.now()): string {
  if (typeof value === "string" && value.length <= 40) {
    const t = Date.parse(value);
    if (Number.isFinite(t) && t <= now + FUTURE_TOLERANCE_MS && t >= now - MAX_AGE_MS) {
      return new Date(Math.min(t, now)).toISOString();
    }
  }
  return new Date(now).toISOString();
}

/** Id-ul unei operații din coada telefonului: folosit ca să nu dublăm o poză/eveniment trimis de două ori. */
export function safeOpId(value: unknown): string | null {
  return typeof value === "string" && /^[a-z0-9-]{8,64}$/i.test(value) ? value : null;
}
