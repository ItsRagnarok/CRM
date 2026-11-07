"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// The bell in the home header. The count comes from the server render and
// then ticks up live (Supabase Realtime) when a notification arrives while
// the app is open.
export function MobileBell({ profileId, initialUnread }: { profileId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bell-${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` },
        () => setUnread((c) => c + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return (
    <Link
      href="/mobil/notificari"
      aria-label={unread > 0 ? `Notificări, ${unread} necitite` : "Notificări"}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eaecf0] bg-white text-[#344054]"
    >
      <Bell className="h-5 w-5" strokeWidth={1.9} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1.5 text-[10.5px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
