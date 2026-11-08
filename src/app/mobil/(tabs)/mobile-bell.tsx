"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

// The bell in the home header. The count comes from the server render and
// then ticks up live (Supabase Realtime) when a notification arrives while
// the app is open.
export function MobileBell({ profileId, initialUnread }: { profileId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  // The realtime client is loaded after the screen is interactive, not with the first paint.
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return;
      const supabase = createClient();
      const channel = supabase
        .channel(`bell-${profileId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` },
          () => setUnread((c) => c + 1)
        )
        .subscribe();
      cleanup = () => { supabase.removeChannel(channel); };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [profileId]);

  return (
    <Link
      href="/mobil/notificari"
      aria-label={unread > 0 ? `Notificări, ${unread} necitite` : "Notificări"}
      className="m-ib"
    >
      <Bell className="m-i" strokeWidth={1.9} />
      {unread > 0 && (
        <span className="m-dot">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
