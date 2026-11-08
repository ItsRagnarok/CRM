"use client";

import { useEffect, useRef } from "react";
import { MODULES, defaultModules } from "@/lib/modules";

// Modules for a company. Plain checkboxes named "modules" so it works in any
// server-action form. Modules not built yet are listed but disabled. With
// `followDomains`, the checkboxes follow the domains ticked in the same form
// until the admin changes a module by hand.
export function ModulePicker({ defaultValue, followDomains = false }: { defaultValue?: string[]; followDomains?: boolean }) {
  const root = useRef<HTMLFieldSetElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (!followDomains) return;
    const form = root.current?.closest("form");
    if (!form) return;
    const sync = () => {
      if (touched.current) return;
      const domains = [...form.querySelectorAll<HTMLInputElement>('input[name="domains"]:checked')].map((i) => i.value);
      const wanted = defaultModules(domains);
      root.current?.querySelectorAll<HTMLInputElement>('input[name="modules"]').forEach((i) => { i.checked = wanted.includes(i.value); });
    };
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, [followDomains]);

  return (
    <fieldset ref={root} className="flex flex-col gap-2" onChange={(e) => { if ((e.target as unknown as HTMLInputElement).name === "modules") touched.current = true; }}>
      <legend className="mb-1.5 text-[13px] font-semibold text-[#344054]">Module active pentru această firmă</legend>
      {MODULES.map((m) => (
        <label
          key={m.id}
          className={`flex items-start gap-3 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 has-[:checked]:border-[#101828] has-[:checked]:bg-[#f9fafb] ${m.available ? "cursor-pointer" : "opacity-60"}`}
        >
          <input
            type="checkbox"
            name="modules"
            value={m.id}
            disabled={!m.available}
            defaultChecked={m.available && (defaultValue ? defaultValue.includes(m.id) : defaultModules(["electric", "gaze", "fotovoltaic"]).includes(m.id))}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block text-[13.5px] font-bold text-foreground">
              {m.label}
              {!m.available && <span className="ml-2 rounded-full bg-[#f2f4f7] px-2 py-0.5 text-[11px] font-semibold text-muted">în curând</span>}
            </span>
            <span className="block text-[12px] text-muted">{m.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
