import { createHash } from "node:crypto";

// Excluding a person from the site statistics without storing their address: we keep only a one-way hash.
// IPv4 is matched exactly; IPv6 on the /64 prefix, because the lower 64 bits rotate (privacy extensions).
export function ipKey(raw: string): string | null {
  const ip = raw.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const v4 = ip.match(/^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    return parts.every((n) => n <= 255) ? `v4:${parts.join(".")}` : null;
  }
  if (!ip.includes(":") || !/^[0-9a-f:]+$/.test(ip)) return null;
  const [head, tail = ""] = ip.split("::");
  const a = head ? head.split(":") : [];
  const b = tail ? tail.split(":") : [];
  if (ip.includes("::") ? a.length + b.length > 7 : a.length !== 8) return null;
  const groups = ip.includes("::") ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b] : a;
  if (groups.some((g) => g.length === 0 || g.length > 4)) return null;
  return `v6:${groups.slice(0, 4).map((g) => g.padStart(4, "0").replace(/^0+(?=.)/, "")).join(":")}`;
}

export function ipHash(raw: string): string | null {
  const key = ipKey(raw);
  return key ? createHash("sha256").update(`ef-ip-exclude|${key}`).digest("hex") : null;
}
