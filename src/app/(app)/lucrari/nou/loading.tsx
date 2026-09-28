import { Skeleton } from "@/components/skeleton";

export default function NewJobLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[9px]" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-1.5 h-10 w-full rounded-[10px]" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-10 w-24 rounded-[10px]" />
          <Skeleton className="h-10 w-36 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
