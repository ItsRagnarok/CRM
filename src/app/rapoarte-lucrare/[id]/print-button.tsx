"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white"
    >
      Printează / Salvează ca PDF
    </button>
  );
}
