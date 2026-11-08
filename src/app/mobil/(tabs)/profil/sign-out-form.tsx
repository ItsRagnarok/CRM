"use client";

import { LogOut } from "lucide-react";
import { signOutMobile } from "@/app/(app)/actions";
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
    await signOutMobile();
  }

  return (
    <form action={handleSignOut}>
      <button type="submit" className="m-bt2 bad">
        <LogOut className="m-i" /> Deconectare
      </button>
    </form>
  );
}
