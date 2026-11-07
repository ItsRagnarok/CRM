"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { unregisterPushToken } from "@/app/mobil/push-actions";
import { PUSH_TOKEN_STORAGE_KEY } from "@/app/mobil/push-registration";

export function SignOutForm() {
  async function handleSignOut() {
    try {
      const token = window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (token) {
        await unregisterPushToken(token);
        window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Never let a failed cleanup trap someone inside the app.
    }
    await signOut();
  }

  return (
    <form action={handleSignOut} className="mt-4">
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-danger-bg bg-white py-3.5 text-[13.5px] font-bold text-danger"
      >
        <LogOut className="h-4 w-4" /> Deconectare
      </button>
    </form>
  );
}
