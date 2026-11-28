import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Ecranul unui document în aplicație: antet cu „Înapoi”, conținutul și „Înapoi la lucrare” jos. */
export function DocScreen({ jobId, title, children }: { jobId: string; title: string; children: React.ReactNode }) {
  const back = `/mobil/lucrari/${jobId}`;
  return (
    <div className="flex h-full flex-col">
      <header className="m-hd">
        <Link href={back} aria-label="Înapoi" className="m-ib sm">
          <ChevronRight className="m-i" style={{ transform: "rotate(180deg)" }} />
        </Link>
        <div className="m-fl" style={{ textAlign: "center", minWidth: 0 }}>
          <div className="m-lb" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        </div>
        <span style={{ width: 44 }} aria-hidden="true" />
      </header>
      {children}
      <div className="m-ft">
        <Link href={back} className="m-bt2">Înapoi la lucrare</Link>
      </div>
    </div>
  );
}
