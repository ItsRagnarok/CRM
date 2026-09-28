"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13px] font-bold text-[#344054]"
    >
      Printează
    </button>
  );
}
