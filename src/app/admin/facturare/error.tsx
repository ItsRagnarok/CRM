"use client";
export default function BillingError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6" role="alert">
      <h2 className="font-bold">Facturarea nu poate fi încărcată acum</h2>
      <p className="mt-2 text-sm text-muted">
        Închide vizualizarea unei companii dacă este activă, apoi reîncearcă.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-purple px-4 py-2 font-semibold text-white"
      >
        Reîncearcă
      </button>
    </div>
  );
}
