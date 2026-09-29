"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { addMember } from "../actions";
import { ROLE_LABELS } from "@/lib/role-labels";
import type { Database } from "@/lib/supabase/database.types";

type Profile = { id: string; full_name: string; role: Database["public"]["Enums"]["user_role"] };

export function AddTeamMember({ teamId, profiles }: { teamId: string; profiles: Profile[] }) {
  const [query, setQuery] = useState("");

  const filtered = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mt-2 border-t border-[#f2f4f7] pt-4">
      {profiles.length > 5 && (
        <div className="mb-2.5 flex items-center gap-2 rounded-[9px] bg-neutral-bg px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută coleg…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
          />
        </div>
      )}
      <div className="flex flex-col divide-y divide-[#f2f4f7]">
        {filtered.map((p) => (
          <form key={p.id} action={addMember} className="flex items-center gap-3 py-2">
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="profileId" value={p.id} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-foreground">{p.full_name}</div>
              <div className="truncate text-[11.5px] text-muted-2">{ROLE_LABELS[p.role]}</div>
            </div>
            <button
              type="submit"
              className="flex shrink-0 items-center justify-center gap-1 rounded-[8px] bg-neutral-bg px-3 py-1.5 text-[12px] font-bold text-[#344054] hover:bg-electric-soft hover:text-electric"
            >
              <Plus className="h-3.5 w-3.5" /> Adaugă
            </button>
          </form>
        ))}
        {filtered.length === 0 && (
          <p className="py-2 text-[12.5px] text-muted-2">Niciun rezultat pentru „{query}”.</p>
        )}
      </div>
    </div>
  );
}
