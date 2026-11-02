import { requireAdminContext } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin-topbar";
import { cookies } from "next/headers";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";

// Reads the signed-in platform admin's identity on every request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName } = await requireAdminContext();
  const preview = parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value);

  return (
    <div className="ef-app-theme flex min-h-screen flex-col bg-[#f4f3f9]">
      <AdminTopbar fullName={fullName} />
      {preview && <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-soft px-6 py-3 text-sm"><span>Vizualizarea doar în citire este activă în acest browser. Închide-o înainte de a administra companiile sau programările.</span><form action="/api/admin/preview-exit" method="post"><button className="rounded-lg border border-border px-3 py-1 font-semibold">Închide vizualizarea</button></form></div>}
      <main className="flex-1">{children}</main>
    </div>
  );
}
