export type Provider = "smartbill" | "oblio";
export type DocType = "factura" | "proforma";
export type PayMethod = "numerar" | "card" | "ordin_plata" | "alta";

export type Connection = {
  provider: Provider;
  accountEmail: string;
  vatCode: string;
  series: string;
  proformaSeries: string | null;
  receiptSeries: string | null;
  taxPercent: number;
  dueDays: number;
  sendEmail: boolean;
  /** Demo mode: no external call is made and every invoice is marked as simulated. */
  simulated: boolean;
};

export type Line = { name: string; unit: string; quantity: number; price: number; vatPercent: number; isService: boolean; code?: string | null };

export type ClientData = {
  name: string;
  vatCode: string | null;
  isTaxPayer: boolean;
  regCom?: string | null;
  address: string | null;
  city: string | null;
  county?: string | null;
  email: string | null;
  phone?: string | null;
};

/** Money collected together with (or after) the invoice. */
export type Collect = { method: PayMethod; amount: number; date: string; document?: string | null };

export type Draft = {
  docType: DocType;
  series: string;
  client: ClientData;
  lines: Line[];
  issueDate: string;
  dueDate: string;
  mentions?: string | null;
  sendEmail?: boolean;
  collect?: Collect | null;
  /** Invoice issued from an existing proforma. */
  fromProforma?: { series: string; number: string } | null;
};

export type DocRef = { docType: DocType; series: string; number: string };
export type Issued = { series: string; number: string; url: string | null };
export type PaymentState = { paid: boolean; paidAmount: number | null; total: number | null; eInvoice: string | null; cancelled: boolean | null };
export type Catalog = { invoiceSeries: string[]; proformaSeries: string[]; receiptSeries: string[]; vatRates: { name: string; percent: number }[] };
export type Product = { name: string; code: string | null; unit: string; price: number; vatPercent: number | null; isService: boolean; source: "furnizor" | "materiale" };
export type Pdf = { kind: "bytes"; data: ArrayBuffer } | { kind: "url"; url: string };

export const PAY_LABEL: Record<PayMethod, string> = { numerar: "Numerar", card: "Card", ordin_plata: "Ordin de plată", alta: "Altă încasare" };

/** Message safe to show to the user; never contains credentials. */
export class InvoicingError extends Error {}
