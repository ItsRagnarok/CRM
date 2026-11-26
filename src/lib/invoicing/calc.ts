// Totalurile unui document, cu aceleași rotunjiri ca baza de date (invoice_lines.net_amount / line_vat):
// valoarea fără TVA a rândului se rotunjește la bani, apoi TVA-ul rândului se calculează din ea.
export type CalcLine = { quantity: number; price: number; vatPercent: number; isService: boolean };

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineNet(l: CalcLine) {
  return r2(l.quantity * l.price);
}
export function lineVat(l: CalcLine) {
  return r2(lineNet(l) * l.vatPercent / 100);
}

export function totals(lines: CalcLine[]) {
  let services = 0, goods = 0, vat = 0;
  const byRate = new Map<number, { net: number; vat: number }>();
  for (const l of lines) {
    const net = lineNet(l), v = lineVat(l);
    if (l.isService) services += net; else goods += net;
    vat += v;
    const b = byRate.get(l.vatPercent) ?? { net: 0, vat: 0 };
    b.net = r2(b.net + net); b.vat = r2(b.vat + v);
    byRate.set(l.vatPercent, b);
  }
  services = r2(services); goods = r2(goods); vat = r2(vat);
  const net = r2(services + goods);
  return { services, goods, net, vat, gross: r2(net + vat), byRate: [...byRate.entries()].sort((a, b) => b[0] - a[0]).map(([rate, v]) => ({ rate, ...v })) };
}

export function lei(n: number) {
  return `${n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
}

export function addDays(iso: string, days: number) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
