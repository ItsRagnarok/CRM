"use client";

import Link from "next/link";

export default function AppError({ reset }: { reset: () => void }) {
  return <div role="alert" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-xl font-bold">Pagina nu a putut fi încărcată</h1><p className="text-sm text-muted">A apărut o eroare la încărcarea datelor. Sesiunea ta este păstrată. Reîncearcă sau revino la pagina principală.</p><button onClick={reset} className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">Reîncearcă</button><Link href="/" prefetch={false} className="ml-4 text-sm font-semibold text-electric">Pagina principală</Link><a href="/auth/clear-preview" className="ml-4 text-sm font-semibold text-electric">Închide vizualizarea companiei</a></div>;
}
