import { Skeleton } from "@/components/skeleton";

/**
 * Schelet generic pentru paginile de birou care nu au unul propriu: la clic în meniu apare imediat,
 * în loc să rămână pagina veche pe ecran până vin datele.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5 p-7" aria-busy="true" aria-label="Se încarcă">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-36 rounded-[10px]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-[13px] border border-border bg-white">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t border-[#f2f4f7] px-5 py-3.5 first:border-t-0">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
