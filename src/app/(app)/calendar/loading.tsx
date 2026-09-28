import { Skeleton } from "@/components/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[66px] shrink-0 items-center gap-3.5 border-b border-border bg-white px-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-40 rounded-[9px]" />
        <Skeleton className="h-4 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-10 w-40 rounded-[9px]" />
        <Skeleton className="h-10 w-36 rounded-[10px]" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Skeleton className="h-[600px] min-w-[1180px] rounded-[13px]" />
      </div>
    </div>
  );
}
