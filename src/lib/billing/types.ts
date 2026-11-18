export type InvoiceRow = {
  id: string;
  client_id: string;
  document_type: "invoice" | "proforma" | "credit_note";
  original_invoice_id: string | null;
  status: "draft" | "pending" | "issued";
  issue_date: string;
  due_date: string;
  provider_series: string | null;
  provider_number: string | null;
  provider_url: string | null;
  client_name: string;
  client_email: string | null;
  total: string;
  subtotal: string;
  vat_total: string;
  paid: string;
  balance: string;
  payment_status: string;
  email_status: string;
  created_at: string;
};
export type Party = {
  name?: string;
  cui?: string;
  address?: string;
  email?: string;
  phone?: string;
  city?: string;
  county?: string;
  registration_number?: string;
  banks?: { bank_name: string; iban: string }[];
};
export type InvoiceDetail = InvoiceRow & {
  request_status?: string | null;
  series_id: string | null;
  notes: string | null;
  company: Party;
  client: Party;
  lines: {
    id: string;
    name: string;
    unit: string;
    is_service: boolean;
    quantity: string;
    unit_price: string;
    vat_rate: string;
    net_amount: string;
    vat_amount: string;
  }[];
  payments: { id: string; amount: string; paid_on: string; method: string }[];
};
export type EditLine = {
  name: string;
  unit: string;
  service: boolean;
  quantity: string;
  price: string;
  vat: string;
};
export type Dashboard = {
  collected: string;
  outstanding: string;
  overdue: string;
  attention: InvoiceRow[];
  latest: InvoiceRow[];
};
export type Report = {
  months: { month: string; revenue: string }[];
  vat: string;
  count: number;
};
