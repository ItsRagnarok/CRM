"use server";

import { createClient } from "@/lib/supabase/server";
import { isBackOfficeRole, requireSessionContext } from "@/lib/auth";
import { loadScheduleWarnings, type WarningRequest } from "@/lib/schedule-warnings-server";
import type { ScheduleWarning } from "@/lib/schedule-warnings";

/** Avertizările pentru o programare încă nesalvată (formularul de lucrare nouă sau de editare). */
export async function checkScheduleWarnings(req: WarningRequest): Promise<ScheduleWarning[]> {
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) return [];
  const supabase = await createClient();
  return loadScheduleWarnings(supabase, organization, req);
}
