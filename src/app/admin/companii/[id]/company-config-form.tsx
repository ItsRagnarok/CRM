"use client";

import { useActionState } from "react";
import { DomainPicker } from "@/components/domain-picker";
import { ModulePicker } from "@/components/module-picker";
import { updateCompanyConfig } from "@/app/admin/actions";
import type { DomainId } from "@/lib/domains";

export function CompanyConfigForm({ orgId, domains, modules }: { orgId: string; domains: DomainId[]; modules: string[] }) {
  const [state, action, pending] = useActionState(async (_prev: { error?: string; saved?: boolean } | undefined, formData: FormData) => updateCompanyConfig(orgId, formData), undefined);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4 rounded-[14px] border border-[#e7e3f5] bg-white p-6">
      <h2 className="text-[15px] font-bold text-[#17151f]">Domenii și module</h2>
      <p className="-mt-2 text-[12.5px] text-[#5c5670]">Ce vede firma în platformă. Dezactivarea unui modul îl ascunde, nu șterge datele.</p>
      <DomainPicker defaultValue={domains} />
      <ModulePicker defaultValue={modules} />
      {state?.error && <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>}
      {state?.saved && <p className="text-sm font-medium text-green-700" role="status">Salvat.</p>}
      <button disabled={pending} className="self-start rounded-[10px] bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Se salvează…" : "Salvează domeniile și modulele"}
      </button>
    </form>
  );
}
