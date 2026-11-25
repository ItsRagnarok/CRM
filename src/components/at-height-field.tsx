"use client";

import { useEffect, useRef } from "react";

/**
 * „Lucru la înălțime” pe formularul lucrării. Pe lucrare nouă se bifează singur când alegi
 * domeniul Fotovoltaic (cât timp nu l-ai atins de mână). Avertizările se recalculează la schimbare.
 */
export function AtHeightField({ defaultChecked = false, autoFromDomain = false }: { defaultChecked?: boolean; autoFromDomain?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const touched = useRef(false);
  useEffect(() => {
    if (!autoFromDomain) return;
    const box = ref.current;
    const sel = box?.closest("form")?.querySelector<HTMLSelectElement>('select[name="domain"]');
    if (!box || !sel) return;
    const sync = () => {
      if (touched.current) return;
      const want = sel.value === "fotovoltaic";
      if (box.checked !== want) {
        box.checked = want;
        box.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    sync();
    sel.addEventListener("change", sync);
    return () => sel.removeEventListener("change", sync);
  }, [autoFromDomain]);
  return (
    <label className="flex items-start gap-2.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] text-[#344054]">
      <input ref={ref} type="checkbox" name="atHeight" defaultChecked={defaultChecked} onChange={() => (touched.current = true)} className="mt-0.5 h-4 w-4 accent-[#0b6b3a]" />
      <span>
        <b>Lucru la înălțime</b> (acoperiș, schelă, scară)
        <span className="block text-[12px] text-muted">Echipa trebuie să aibă „apt pentru lucru la înălțime” valabil în Conformitate; pe telefon, verificarea de dinainte include hamul și ancorarea.</span>
      </span>
    </label>
  );
}
