"use client";

import { useEffect } from "react";
import { markConversationRead } from "@/app/(app)/mesaje/actions";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";

// Opening a conversation marks it read — mirrors the notification bell fix:
// seeing it is enough, nobody should have to click something separate to
// clear the unread badge.
export function AutoMarkRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    const value = document.cookie.split("; ").find((c) => c.startsWith(`${PREVIEW_COOKIE}=`))?.split("=").slice(1).join("=");
    if (parsePreview(value ? decodeURIComponent(value) : undefined)) return;
    markConversationRead(conversationId);
  }, [conversationId]);
  return null;
}
