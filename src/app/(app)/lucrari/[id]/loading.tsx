import { Skeleton } from "@/components/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-border bg-white px-7 py-4.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-[30px] w-[30px] rounded-[9px]" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex flex-wrap gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-28" />
          ))}
        </div>
        <div className="mt-4 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-16" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-7 xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[13px] border border-border bg-white p-5">
            <Skeleton className="mb-3.5 h-4 w-40" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="mt-1.5 h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[13px] border border-dashed border-border bg-white p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <Skeleton className="mb-3.5 h-4 w-28" />
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="mt-1 h-2 w-2 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-1.5 h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
