import { Skeleton } from "@/components/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[9px]" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      <div className="flex items-center justify-between rounded-[14px] border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[60px] w-[60px] rounded-2xl" />
          <div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2.5 h-3.5 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-24 rounded-[10px]" />
          <Skeleton className="h-10 w-32 rounded-[10px]" />
          <Skeleton className="h-10 w-32 rounded-[10px]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[13px] border border-border bg-white p-[18px]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-5 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[13px] border border-border bg-white p-5">
            <Skeleton className="h-4 w-36" />
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[13px] border border-border bg-white p-5">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
