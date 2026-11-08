import { Skeleton } from "@/components/skeleton";

// Fallback for every office page that has no skeleton of its own.
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5 p-7" aria-busy="true" aria-label="Se încarcă">
      <Skeleton className="h-7 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-5">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mt-4 h-9 w-full" />)}
      </div>
    </div>
  );
}
