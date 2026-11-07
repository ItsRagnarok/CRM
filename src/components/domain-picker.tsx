import { DOMAINS, type DomainId } from "@/lib/domains";

// One, two or all trades. Plain checkboxes named "domains" so it works inside
// any server-action form; the action validates and defaults.
export function DomainPicker({ defaultValue }: { defaultValue?: DomainId[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-[#344054]">Cu ce se ocupă firma? Alege unul sau mai multe domenii.</legend>
      {DOMAINS.map((d) => (
        <label key={d.id} className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 has-[:checked]:border-[#101828] has-[:checked]:bg-[#f9fafb]">
          <input type="checkbox" name="domains" value={d.id} defaultChecked={!defaultValue || defaultValue.includes(d.id)} className="mt-1 h-4 w-4" />
          <span>
            <span className="block text-[13.5px] font-bold text-foreground">{d.label}</span>
            <span className="block text-[12px] text-muted">{d.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
