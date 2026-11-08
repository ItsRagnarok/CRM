import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTopbar } from "@/components/admin-topbar";
import { cookies } from "next/headers";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";
import { AdminViewport } from "@/components/admin-viewport";

// Reads the signed-in platform admin's identity on every request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName } = await requireAdminContext();
  const adminDb = await createClient({ ignorePreview: true });
  const { count: upcomingBookings } = await adminDb.from("bookings").select("id", { count: "exact", head: true }).gte("slot_start", new Date().toISOString());
  const { count: openRequests } = await adminDb.from("subscription_requests").select("id", { count: "exact", head: true }).is("resolved_at", null);
  const preview = parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value);

  return (
    <AdminViewport topbar={<AdminTopbar fullName={fullName} upcomingBookings={upcomingBookings ?? 0} openRequests={openRequests ?? 0} />} banner={preview && <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-amber-soft px-6 py-3 text-sm"><span>Vizualizarea doar în citire este activă în acest browser. Închide-o înainte de a administra companiile sau programările.</span><form action="/api/admin/preview-exit" method="post"><button className="rounded-lg border border-border px-3 py-1 font-semibold">Închide vizualizarea</button></form></div>}>
      {children}
    </AdminViewport>
  );
}
