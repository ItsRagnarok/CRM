import { Skeleton } from "@/components/skeleton";

export default function ClientiLoading() {
  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-36 rounded-[10px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-[42px] max-w-[360px] flex-1 rounded-[10px]" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-[9px]" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[13px] border border-border bg-white">
        <div className="border-b border-[#f2f4f7] bg-[#f9fafb] px-5 py-3">
          <Skeleton className="h-3 w-full max-w-3xl" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t border-[#f2f4f7] px-5 py-3.5">
            <div className="flex flex-1 items-center gap-2.5">
              <Skeleton className="h-[34px] w-[34px] rounded-[9px]" />
              <div>
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-8" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
