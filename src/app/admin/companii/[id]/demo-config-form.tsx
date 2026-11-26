"use client";

import { useActionState } from "react";
import { DemoFields } from "@/app/admin/demo-fields";
import { convertDemoToClient, updateDemo } from "@/app/admin/actions";

export function DemoConfigForm({ orgId, demo, unlocked, expires }: { orgId: string; demo: boolean; unlocked: string[]; expires: string | null }) {
  const [state, action, pending] = useActionState(async (_p: { error?: string; saved?: string } | undefined, fd: FormData) => updateDemo(orgId, fd), undefined);
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-[14px] border border-[#e7e3f5] bg-white p-6">
      <form action={action} className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-[#17151f]">Cont demo</h2>
        <DemoFields defaultDemo={demo} defaultUnlocked={unlocked} defaultExpires={expires} />
        {state?.error && <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>}
        {state?.saved && <p className="text-sm font-medium text-green-700" role="status">{state.saved}</p>}
        <button disabled={pending} className="self-start rounded-[10px] bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Se salvează…" : "Salvează contul demo"}
        </button>
      </form>
      {demo && (
        <form action={convertDemoToClient.bind(null, orgId)} className="border-t border-[#f2f0f9] pt-3">
          <button className="rounded-[10px] bg-[#101828] px-5 py-2.5 text-sm font-bold text-white">Convertește în client activ</button>
          <span className="ml-3 text-[12.5px] text-[#5c5670]">Deblochează tot și scoate banda „Cont demo”. Datele rămân.</span>
        </form>
      )}
    </div>
  );
}
