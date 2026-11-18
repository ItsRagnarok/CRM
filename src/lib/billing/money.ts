// Exact integer arithmetic shared by the preview and formatting. PostgreSQL is authoritative.
export function scaled(value: string, digits = 4): bigint {
  const v = String(value).trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(v)) throw new Error("Valoare numerică invalidă.");
  const negative = v.startsWith("-");
  const [whole, fraction = ""] = v.replace("-", "").split(".");
  if (fraction.length > digits) throw new Error("Prea multe zecimale.");
  return BigInt((negative ? "-" : "") + whole + fraction.padEnd(digits, "0"));
}
export function rounded(n: bigint, d: bigint) {
  const sign = n < BigInt(0) ? BigInt(-1) : BigInt(1);
  return sign * ((n * sign + d / BigInt(2)) / d);
}
export function decimal(n: bigint, digits = 2) {
  const neg = n < BigInt(0);
  const s = (neg ? -n : n).toString().padStart(digits + 1, "0");
  return (neg ? "-" : "") + s.slice(0, -digits) + "." + s.slice(-digits);
}
export function money(v: string) {
  const s = decimal(scaled(String(v), 2));
  const [a, b] = s.split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + b + " lei";
}
export function preview(
  lines: { quantity: string; price: string; vat: string }[],
) {
  let subtotal = BigInt(0),
    vat = BigInt(0);
  for (const l of lines) {
    const net = rounded(scaled(l.quantity) * scaled(l.price), BigInt(1000000));
    subtotal += net;
    vat += rounded(net * scaled(l.vat, 2), BigInt(10000));
  }
  return {
    subtotal: decimal(subtotal),
    vat: decimal(vat),
    total: decimal(subtotal + vat),
  };
}
export function todayRo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function displayDate(date: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
