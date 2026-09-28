import { requireAdminContext } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin-topbar";

// Reads the signed-in platform admin's identity on every request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName } = await requireAdminContext();

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f3f9]">
      <AdminTopbar fullName={fullName} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
