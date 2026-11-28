/**
 * Legături în textul paginilor publice, scrise ca în Markdown: [textul legăturii](/cale).
 * Fără HTML: textul se împarte în bucăți, iar pagina le afișează ca text sau ca legătură.
 * În datele structurate (JSON-LD) rămâne doar textul legăturii (stripInlineLinks).
 *
 * Ținte acceptate (orice altceva rămâne text, neschimbat):
 * - „/cale”: pagină a site-ului; /blog…, /programare, /downloads/… și fișierele (cu extensie) sunt
 *   pagini statice, deschise cu o legătură obișnuită (kind „static”), restul prin next/link („page”);
 * - „#ancoră” pe aceeași pagină; „https://…” (surse externe); „mailto:” și „tel:”.
 */
export type InlineLinkKind = "page" | "static" | "anchor" | "external" | "contact";
export type InlineSegment = { text: string; href?: undefined; kind?: undefined } | { text: string; href: string; kind: InlineLinkKind };

const LINK = /\[([^[\]\n]+)\]\(([^()\s]+)\)/g;

/** Căile servite ca fișiere statice (nu pagini Next): un <Link> le-ar cere întâi ca navigare internă. */
function isStaticPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  if (pathname === "/blog" || pathname.startsWith("/blog/") || pathname === "/programare" || pathname.startsWith("/downloads/")) return true;
  return /\.[a-z0-9]+$/i.test(pathname.slice(pathname.lastIndexOf("/") + 1));
}

/** Tipul legăturii pentru o țintă, sau null dacă ținta nu e acceptată (rămâne text). */
export function inlineLinkKind(href: string): InlineLinkKind | null {
  if (/^\/(?![/\\])[^\s\\]*$/.test(href)) return isStaticPath(href) ? "static" : "page";
  if (/^#[A-Za-z0-9_-]+$/.test(href)) return "anchor";
  if (/^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/.test(href)) return "external";
  if (/^mailto:[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(href) || /^tel:\+?[0-9]{6,15}$/.test(href)) return "contact";
  return null;
}

/** Împarte textul în bucăți simple și legături, în ordine. Textul fără legături dă o singură bucată. */
export function parseInlineLinks(text: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let plain = "";
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    const kind = label.trim() ? inlineLinkKind(href) : null;
    plain += text.slice(last, m.index);
    last = m.index + whole.length;
    if (!kind) {
      plain += whole;
      continue;
    }
    if (plain) out.push({ text: plain });
    plain = "";
    out.push({ text: label, href, kind });
  }
  plain += text.slice(last);
  if (plain || out.length === 0) out.push({ text: plain });
  return out;
}

/** Textul fără sintaxa legăturilor (pentru JSON-LD, meta description): rămâne doar textul legăturii. */
export function stripInlineLinks(text: string): string {
  return parseInlineLinks(text).map((s) => s.text).join("");
}

/** Țintele legăturilor valide din text (pentru verificări). */
export function inlineLinkTargets(text: string): { href: string; kind: InlineLinkKind }[] {
  return parseInlineLinks(text).flatMap((s) => (s.href ? [{ href: s.href, kind: s.kind }] : []));
}
