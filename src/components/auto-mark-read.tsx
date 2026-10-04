"use client";

import { useEffect } from "react";
import { markConversationRead } from "@/app/(app)/mesaje/actions";

// Opening a conversation marks it read — mirrors the notification bell fix:
// seeing it is enough, nobody should have to click something separate to
// clear the unread badge.
export function AutoMarkRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);
  return null;
}
