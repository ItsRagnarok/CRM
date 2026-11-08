import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 p-7" aria-busy="true" aria-label="Se încarcă">
      <div>
        <Skeleton className="h-6 w-72" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-5">
        <Skeleton className="h-5 w-52" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="mt-4 h-10 w-full" />)}
      </div>
    </div>
  );
}
