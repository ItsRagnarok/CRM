import { requireAdminContext } from "@/lib/auth";
import { ChangePasswordForm, TransferForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const { email, fullName } = await requireAdminContext();
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6 p-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Contul meu de Super Admin</h1>
        <p className="mt-1 text-sm text-muted">{fullName} · {email}</p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[16px] font-bold">Schimbă parola</h2>
        <p className="mt-1 text-sm text-muted">Minimum 12 caractere. Rămâi conectat după schimbare.</p>
        <ChangePasswordForm />
      </section>

      <section className="rounded-2xl border border-danger/40 bg-white p-6">
        <h2 className="text-[16px] font-bold">Transferă rolul de Super Admin</h2>
        <p className="mt-1 text-sm text-muted">
          Se creează un cont nou pe adresa de mai jos și i se trimite pe email o parolă temporară. Imediat după trimitere, rolul
          tău de Super Admin este retras și ești deconectat. Noul administrator își schimbă parola din această pagină.
          Dacă emailul nu pleacă, transferul se anulează și rămâi administrator.
        </p>
        <TransferForm />
      </section>
    </div>
  );
}
