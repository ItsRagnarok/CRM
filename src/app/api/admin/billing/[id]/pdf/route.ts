import {safeOblioUrl} from "@/lib/billing/oblio";
import { notFound } from "next/navigation";
import { workflow } from "@/lib/billing/store";
import { invoicePdf } from "@/lib/billing/pdf";
import type { InvoiceDetail } from "@/lib/billing/types";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  const d = await workflow<InvoiceDetail | null>("detail", { id });
  if (!d || d.status !== "issued") notFound();
  if(d.imported){const url=safeOblioUrl(d.provider_url);if(!url)return new Response("Oblio nu a furnizat un link pentru document.",{status:422});return new Response(null,{status:302,headers:{Location:url,"Cache-Control":"private, no-store"}});}
  const file = await invoicePdf(d);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="factura-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
