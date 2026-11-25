/**
 * Din „user agent” (și, pe Android cu Chrome, din antetul Sec-CH-UA-Model): sistemul, browserul
 * și tipul de telefon, pentru Analitice. Fără cookie-uri și fără nimic care identifică persoana.
 * Funcții pure, testate în scripts/user-agent.test.mjs.
 */

export type DeviceInfo = { os: string | null; browser: string | null; model: string | null };

const BRANDS: [RegExp, string][] = [
  [/^SM-|^Galaxy/i, "Samsung"],
  [/^Pixel/i, "Google"],
  [/^(Redmi|POCO|Mi )|^M2\d{3}|^2\d{3}[A-Z0-9]{4,}/i, "Xiaomi"],
  [/^CPH\d/i, "Oppo"],
  [/^RMX\d/i, "Realme"],
  [/^moto|^XT\d/i, "Motorola"],
  [/^(ELE|VOG|ANE|MAR|LYA|NOH|JNY)-/i, "Huawei"],
  [/^(Nokia|TA-\d)/i, "Nokia"],
  [/^(ONEPLUS|[A-Z]{2}\d{4}$)/i, "OnePlus"],
  [/^V\d{4}/i, "Vivo"],
];

function androidModel(ua: string, hint: string | null): string | null {
  const raw = (hint ?? "").replace(/^"|"$/g, "").trim() || ua.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/)?.[1]?.trim() || "";
  if (!raw || raw === "K" || /^wv$/i.test(raw)) return "Telefon Android";
  const brand = BRANDS.find(([re]) => re.test(raw))?.[1];
  return brand && !raw.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${raw}` : raw;
}

export function parseUserAgent(ua: string, modelHint: string | null = null): DeviceInfo {
  if (!ua) return { os: null, browser: null, model: null };
  let os: string | null = null;
  let model: string | null = null;
  const ios = ua.match(/(iPhone|iPad|iPod)[^)]*? OS (\d+)[_.]/);
  const android = ua.match(/Android (\d+)/);
  if (ios) { os = `iOS ${ios[2]}`; model = ios[1] === "iPod" ? "iPod" : ios[1]; }
  else if (android) { os = `Android ${android[1]}`; model = androidModel(ua, modelHint); }
  else if (/Windows NT/.test(ua)) { os = "Windows"; model = "Calculator"; }
  else if (/CrOS/.test(ua)) { os = "ChromeOS"; model = "Chromebook"; }
  else if (/Macintosh|Mac OS X/.test(ua)) { os = "macOS"; model = /Mobile\//.test(ua) ? "iPad" : "Mac"; }
  else if (/Linux/.test(ua)) { os = "Linux"; model = "Calculator"; }

  let browser: string | null = null;
  if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = "Facebook (în aplicație)";
  else if (/Instagram/.test(ua)) browser = "Instagram (în aplicație)";
  else if (/LinkedInApp/.test(ua)) browser = "LinkedIn (în aplicație)";
  else if (/WhatsApp/.test(ua)) browser = "WhatsApp";
  else if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung Internet";
  else if (/Firefox|FxiOS/.test(ua)) browser = "Firefox";
  else if (/CriOS|Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";
  return { os, browser, model };
}

/** „390x844” din ecranul trimis de pagină; altceva nu se păstrează. */
export function cleanScreen(v: unknown): string | null {
  return typeof v === "string" && /^\d{3,4}x\d{3,4}$/.test(v) ? v : null;
}
/** „ro-RO” → „ro”. */
export function cleanLang(v: unknown): string | null {
  return typeof v === "string" && /^[a-z]{2,3}([-_][A-Za-z]{2,4})?$/.test(v) ? v.slice(0, 2).toLowerCase() : null;
}
