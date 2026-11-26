import { Skeleton } from "@/components/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-5 p-5 md:p-7" aria-busy="true" aria-label="Se încarcă">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-[60vw]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Skeleton className="h-10 w-10 rounded-[11px]" />
        <Skeleton className="h-10 w-60 rounded-[11px]" />
        <Skeleton className="h-10 w-10 rounded-[11px]" />
        <Skeleton className="h-10 w-72 rounded-full" />
        <Skeleton className="ml-auto h-10 w-48 rounded-[11px]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)}
      </div>
      <Skeleton className="h-[420px] rounded-2xl" />
    </div>
  );
}
