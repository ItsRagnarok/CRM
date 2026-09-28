import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[13px] border border-border bg-white p-[18px]">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-[9px]" />
            </div>
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[13px] border border-border bg-white p-5">
          <Skeleton className="h-4 w-44" />
          <div className="mt-5 flex flex-col gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-12 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="mt-2 h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[13px] border border-border bg-white p-2.5">
            <Skeleton className="h-[200px] w-full rounded-[10px]" />
          </div>
          <div className="rounded-[13px] border border-border bg-white p-5">
            <Skeleton className="h-4 w-36" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3.5 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
