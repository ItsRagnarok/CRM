export type Provider = "smartbill" | "oblio";

export type Connection = {
  provider: Provider;
  accountEmail: string;
  vatCode: string;
  series: string;
  taxPercent: number;
  dueDays: number;
  sendEmail: boolean;
  /** Demo mode: no external call is made and every invoice is marked as simulated. */
  simulated: boolean;
};

export type Line = { name: string; unit: string; quantity: number; price: number; isService: boolean };

export type Draft = {
  client: { name: string; vatCode: string | null; isTaxPayer: boolean; address: string | null; city: string | null; email: string | null };
  lines: Line[];
  issueDate: string;
  dueDate: string;
};

export type Issued = { series: string; number: string; url: string | null };
export type PaymentState = { paid: boolean; paidAmount: number | null; eInvoice: string | null };

/** Message safe to show to the user; never contains credentials. */
export class InvoicingError extends Error {}
