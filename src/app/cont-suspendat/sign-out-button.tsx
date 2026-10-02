"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push("/login");
        })
      }
      className="mt-5 rounded-[10px] border border-[#d0d5dd] px-5 py-2.5 text-[13.5px] font-bold text-[#344054] disabled:opacity-50"
    >
      {pending ? "Se deconectează…" : "Deconectare"}
    </button>
  );
}
