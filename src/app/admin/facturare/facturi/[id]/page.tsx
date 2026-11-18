import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Download,
  Mail,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { workflow } from "@/lib/billing/store";
import { safeOblioUrl } from "@/lib/billing/oblio";
import { money, displayDate } from "@/lib/billing/money";
import type { InvoiceDetail } from "@/lib/billing/types";
import { card, primary, secondary, Badge } from "../../ui";
import {
  IssueForm,
  PaymentForm,
  CreditForm,
  CorrectionForm,
} from "../../workflow-forms";
export default async function Invoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  const d = await workflow<InvoiceDetail | null>("detail", { id });
  if (!d) notFound();
  const issued = d.status === "issued";
  const title =
    d.document_type === "proforma"
      ? "Proforma"
      : d.document_type === "credit_note"
        ? "Stornarea"
        : "Factura";
  const label = d.provider_number
    ? `${d.provider_series} ${d.provider_number}`
    : "fără număr";
  const url = safeOblioUrl(d.provider_url);
  const share = `${title} ${label}, ${money(d.total)}${url ? " — " + url : ""}`;
  return (
    <div className="space-y-6">
      <Link
        href="/admin/facturare/facturi"
        className="inline-flex items-center gap-2 text-sm text-muted"
      >
        <ArrowLeft size={18} />
        Facturi
      </Link>
      <header className="py-3 text-center">
        <div
          className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${issued ? "bg-purple text-white" : "bg-purple-soft text-purple"}`}
        >
          {issued ? <Check size={40} /> : <Clock size={36} />}
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {issued
            ? `${title} ${label} este emisă`
            : d.status === "pending"
              ? "Verificăm emiterea în Oblio"
              : `${title} este salvată ca ciornă`}
        </h1>
        <p className="mt-3 text-muted">
          {d.client_name} · {money(d.total)}
        </p>
      </header>
      <section className={card}>
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Check className="text-success" />
          <span className="font-semibold">Salvată în aplicație</span>
          <span className="ml-auto">
            <Badge status={d.payment_status} />
          </span>
        </div>
        <div className="border-b border-border py-4">
          <p className="font-semibold">E-mail client</p>
          <p className="mt-1 text-sm text-muted">
            {d.email_status === "unknown"
              ? "Trimitere solicitată prin Oblio. Livrarea nu este confirmată de API."
              : d.email_status === "sent"
                ? "Trimitere confirmată."
                : "Nu a fost solicitată trimiterea prin Oblio."}
          </p>
        </div>
        <div className="pt-4">
          <p className="font-semibold">e-Factura / ANAF</p>
          <p className="mt-1 text-sm text-muted">
            Integrarea ANAF nu este activată în ElectroField. Verifică separat
            starea din contul Oblio.
          </p>
        </div>
      </section>
      {!issued && (
        <section className={card}>
          {d.status === "draft" && d.document_type !== "credit_note" && (
            <Link
              href={`/admin/facturare/facturi/noua?draft=${id}`}
              className={secondary + " mb-4"}
            >
              Editează ciorna
            </Link>
          )}
          {d.request_status === "rejected" ? (
            <CorrectionForm id={id} />
          ) : (
            <IssueForm
              id={id}
              pending={d.status === "pending"}
              credit={d.document_type === "credit_note"}
            />
          )}
        </section>
      )}
      {issued && (
        <div className="grid grid-cols-2 gap-3">
          {url && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(share)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={
                card +
                " flex flex-col items-center gap-3 font-semibold hover:border-purple"
              }
            >
              <MessageCircle className="text-purple" />
              WhatsApp
            </a>
          )}
          <a
            href={`mailto:${encodeURIComponent(d.client_email ?? "")}?subject=${encodeURIComponent(title + " " + label)}&body=${encodeURIComponent("Bună ziua,\n\n" + share + "\n\nVă mulțumim!")}`}
            className={
              card +
              " flex flex-col items-center gap-3 font-semibold hover:border-purple"
            }
          >
            <Mail className="text-purple" />
            E-mail
          </a>
          <a
            href={`/api/admin/billing/${id}/pdf`}
            className={
              card +
              " flex flex-col items-center gap-3 font-semibold hover:border-purple"
            }
          >
            <Download className="text-purple" />
            Descarcă PDF
          </a>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={
                card +
                " flex flex-col items-center gap-3 font-semibold hover:border-purple"
              }
            >
              <ExternalLink className="text-purple" />
              Factura în Oblio
            </a>
          )}
        </div>
      )}
      {issued && (
        <p className="text-xs text-muted">
          E-mail deschide aplicația ta de mail cu mesajul pregătit. WhatsApp
          include linkul facturii din Oblio.
        </p>
      )}
      <section className={card}>
        <div className="mb-5 flex flex-wrap justify-between gap-3 text-sm text-muted">
          <span>Data: {displayDate(d.issue_date)}</span>
          <span>Scadență: {displayDate(d.due_date)}</span>
        </div>
        {d.lines.map((l) => (
          <div
            key={l.id}
            className="flex justify-between gap-3 border-b border-border py-3"
          >
            <div>
              <p className="font-semibold">{l.name}</p>
              <p className="text-sm text-muted">
                {l.quantity} {l.unit} × {l.unit_price} lei · TVA {l.vat_rate}%
              </p>
            </div>
            <span className="font-semibold">{money(l.net_amount)}</span>
          </div>
        ))}
        <div className="ml-auto mt-5 max-w-sm space-y-2 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(d.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>TVA</span>
            <span>{money(d.vat_total)}</span>
          </p>
          <p className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{money(d.total)}</span>
          </p>
        </div>
      </section>
      {issued && d.document_type !== "proforma" && (
        <section id="incasare" className={card}>
          <h2 className="mb-4 font-bold">
            {d.document_type === "credit_note" ? "Restituire" : "Încasare"} ·
            sold {money(d.balance)}
          </h2>
          {d.balance !== "0.00" && (
            <PaymentForm id={id} balance={d.balance} paymentId={randomUUID()} />
          )}
          <ul className="mt-4 divide-y divide-border">
            {d.payments.map((p) => (
              <li key={p.id} className="flex justify-between py-3 text-sm">
                <span>{displayDate(p.paid_on)}</span>
                <strong>{money(p.amount)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      {issued && d.document_type === "invoice" && (
        <details className={card}>
          <summary className="cursor-pointer font-semibold">
            Corectează prin stornare
          </summary>
          <div className="mt-4">
            <CreditForm id={id} />
          </div>
        </details>
      )}
      <Link href="/admin/facturare/facturi" className={primary + " w-full"}>
        Gata
      </Link>
      <Link
        href={`/admin/facturare/facturi/noua?client=${d.client_id}`}
        className="block text-center text-sm font-semibold text-muted"
      >
        Factură nouă pentru același client
      </Link>
    </div>
  );
}
