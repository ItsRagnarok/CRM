import { NextRequest, NextResponse } from "next/server";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type View, type TimeEntry, resolveRange, pairHours, formatHM } from "../lib";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const view: View = searchParams.get("view") === "zi" ? "zi" : "saptamana";
  const date = searchParams.get("date") ?? undefined;
  const { rangeStartStr, rangeEndStr, rangeEndExclusiveStr } = resolveRange(view, date);

  const [{ data: profiles }, { data: entries }, { data: jobsInRange }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("time_entries")
      .select("profile_id, job_id, event_type, occurred_at")
      .eq("organization_id", organization.id)
      .gte("occurred_at", `${rangeStartStr}T00:00:00`)
      .lt("occurred_at", `${rangeEndExclusiveStr}T00:00:00`),
    supabase
      .from("jobs")
      .select("id, job_assignments(profile_id)")
      .eq("organization_id", organization.id)
      .gte("scheduled_date", rangeStartStr)
      .lte("scheduled_date", rangeEndStr),
  ]);

  const entriesByProfile = new Map<string, TimeEntry[]>();
  for (const e of entries ?? []) {
    if (!entriesByProfile.has(e.profile_id)) entriesByProfile.set(e.profile_id, []);
    entriesByProfile.get(e.profile_id)!.push(e);
  }

  const jobCountByProfile = new Map<string, Set<string>>();
  for (const job of jobsInRange ?? []) {
    for (const a of job.job_assignments) {
      if (!jobCountByProfile.has(a.profile_id)) jobCountByProfile.set(a.profile_id, new Set());
      jobCountByProfile.get(a.profile_id)!.add(job.id);
    }
  }

  const header = ["Angajat", "Ore lucrate", "Ore deplasare", "Ore pauză", "Lucrări"];
  const lines = [header.map(csvEscape).join(",")];

  for (const p of profiles ?? []) {
    const pEntries = entriesByProfile.get(p.id) ?? [];
    const worked = pairHours(pEntries, "work_start", "work_end");
    const travel = pairHours(pEntries, "travel_start", "arrival");
    const brk = pairHours(pEntries, "break_start", "break_end");
    const jobCount = jobCountByProfile.get(p.id)?.size ?? 0;
    lines.push(
      [p.full_name, formatHM(worked), formatHM(travel), formatHM(brk), String(jobCount)]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = "﻿" + lines.join("\n");
  const filename = `pontaj-${rangeStartStr}${view === "saptamana" ? `_${rangeEndStr}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
