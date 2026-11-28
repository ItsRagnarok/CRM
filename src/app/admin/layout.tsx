import type { Viewport } from "next";

// Aplicația nu se mărește la atingere dublă sau ciupire (pe site-ul public zoomul rămâne permis).
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#1c1c22" };
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
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
  const { count: dueLeads } = await adminDb.from("platform_leads").select("id", { count: "exact", head: true }).lte("next_follow_up", today).in("stage", ["nou", "contactat", "discutie", "oferta", "negociere"]);
  const { count: dueTasks } = await adminDb.from("admin_tasks").select("id", { count: "exact", head: true }).is("done_at", null).lte("due_on", today);
  const preview = parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value);

  return (
    <AdminViewport topbar={<AdminTopbar fullName={fullName} upcomingBookings={upcomingBookings ?? 0} openRequests={openRequests ?? 0} dueLeads={dueLeads ?? 0} dueTasks={dueTasks ?? 0} />} banner={preview && <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-amber-soft px-6 py-3 text-sm"><span>Vizualizarea doar în citire este activă în acest browser. Închide-o înainte de a administra companiile sau programările.</span><form action="/api/admin/preview-exit" method="post"><button className="rounded-lg border border-border px-3 py-1 font-semibold">Închide vizualizarea</button></form></div>}>
      {children}
    </AdminViewport>
  );
}
