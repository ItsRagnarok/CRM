"use client";

import { useEffect } from "react";
import { markMobileConversationRead } from "./actions";

// Opening a conversation is enough to mark it read.
export function AutoMarkReadMobile({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    markMobileConversationRead(conversationId);
  }, [conversationId]);
  return null;
}
