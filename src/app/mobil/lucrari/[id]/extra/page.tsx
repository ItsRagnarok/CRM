import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, MessageSquare, Camera } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addJobNote } from "../actions";
import { ProblemPicker } from "./problem-picker";
import { StepBadge } from "../step-badge";

export default async function MobileExtraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title, status")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: notes } = await supabase
    .from("job_notes")
    .select("id, kind, text, photo_path, created_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">Raportează — #{job.display_number}</div>
          <div className="mt-1"><StepBadge step="executie" /></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" /> Raportează o problemă
          </div>
          <ProblemPicker jobId={id} />
        </div>

        <div className="mt-4 rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-2.5 flex items-center gap-2 text-[14px] font-bold text-foreground">
            <MessageSquare className="h-4 w-4 text-electric" /> Adaugă comentariu sau poză
          </div>
          <form action={addJobNote} className="flex flex-col gap-2.5">
            <input type="hidden" name="jobId" value={id} />
            <input type="hidden" name="kind" value="comment" />
            <textarea
              name="text"
              required
              rows={3}
              placeholder="Ce vrei să notezi despre lucrare…"
              className="w-full resize-none rounded-[10px] border border-[#d0d5dd] p-3 text-[13.5px] outline-none focus:border-electric"
            />
            <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#344054]">
              <Camera className="h-4 w-4 text-muted-2" /> Poză (opțional)
              <input type="file" name="photo" accept="image/*" capture="environment" className="text-[12px]" />
            </label>
            <button
              type="submit"
              className="rounded-[10px] bg-electric py-3 text-center text-[13.5px] font-bold text-white"
            >
              Adaugă
            </button>
          </form>
        </div>

        {notes && notes.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5">
            <div className="text-[11.5px] font-bold text-muted-2">ISTORIC ({notes.length})</div>
            {notes.map((n) => (
              <div key={n.id} className="rounded-[12px] border border-[#eaecf0] bg-white p-3.5">
                <div className="flex items-center gap-2">
                  {n.kind === "problem" && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}
                  <div className="text-[13px] font-semibold text-[#344054]">{n.text}</div>
                </div>
                {n.photo_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicUrl(n.photo_path)}
                    alt=""
                    className="mt-2 h-[120px] w-full rounded-[8px] object-cover"
                  />
                )}
                <div className="mt-1 text-[11px] text-muted-2">{new Date(n.created_at).toLocaleString("ro-RO")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
