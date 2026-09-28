import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { ArrowLeft, Phone, Mail, MapPin, Plus } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, display_number, title, status, scheduled_date")
    .eq("client_id", client.id)
    .order("scheduled_date", { ascending: false });

  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/clienti"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <span className="text-[13.5px] text-muted-2">Clienți /</span>
        <span className="text-[15px] font-bold text-foreground">{client.name}</span>
      </div>

      <div className="flex items-center justify-between rounded-[14px] border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-electric-soft text-[18px] font-extrabold text-electric">
            {initials}
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-foreground">
              {client.name}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-[#475467]">
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted" /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted" /> {client.email}
                </span>
              )}
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted" /> {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/lucrari/nou?clientId=${client.id}`}
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Lucrare nouă
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Număr lucrări" value={jobs?.length ?? 0} />
        <StatCard
          label="Ultima intervenție"
          value={jobs?.[0]?.scheduled_date ?? "—"}
        />
        <StatCard label="CUI" value={client.cui ?? "—"} />
        <StatCard
          label="Status"
          value={client.status === "active" ? "Activ" : "Inactiv"}
        />
      </div>

      <div className="rounded-[13px] border border-border bg-white">
        <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
          Istoric lucrări
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="flex flex-col divide-y divide-[#f2f4f7]">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/lucrari/${job.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]"
              >
                <div className="w-16 shrink-0 text-[13px] font-bold text-electric">
                  #{job.display_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-foreground">
                    {job.title}
                  </div>
                  <div className="text-[12px] text-muted-2">{job.scheduled_date}</div>
                </div>
                <StatusBadge
                  label={JOB_STATUS_LABELS[job.status]}
                  className={JOB_STATUS_STYLES[job.status]}
                />
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-5 text-[13.5px] text-muted">
            Acest client nu are încă nicio lucrare.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[13px] border border-border bg-white p-[18px]">
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-2 text-[20px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}
