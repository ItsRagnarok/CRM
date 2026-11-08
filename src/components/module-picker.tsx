import { MODULES } from "@/lib/modules";

// Modules for a company. Plain checkboxes named "modules" so it works in any
// server-action form. Modules not built yet are listed but disabled.
export function ModulePicker({ defaultValue }: { defaultValue?: string[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
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
            defaultChecked={m.available && (defaultValue ? defaultValue.includes(m.id) : true)}
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
