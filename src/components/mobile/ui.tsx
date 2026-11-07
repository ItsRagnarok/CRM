import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

// Small presentational pieces of the technician app's design system.
// The look itself lives in src/app/mobil/mobile.css (classes prefixed `m-`).

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="m-hd">
      {back && (
        <Link href={back} aria-label="Înapoi" className="m-ib sm">
          <ChevronLeft className="m-i" />
        </Link>
      )}
      <div className="m-fl">
        <h1 className={back ? "m-t2" : "m-t1"}>{title}</h1>
        {subtitle && <div className="m-mu m-sm" style={{ marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </header>
  );
}

export function IconTile({ icon: Icon, tone, small }: { icon: LucideIcon; tone?: "g" | "w" | "bad"; small?: boolean }) {
  return (
    <span className={`m-ic ${small ? "sm" : ""} ${tone ?? ""}`}>
      <Icon className="m-i" />
    </span>
  );
}

/** One tappable row of a menu or settings list. */
export function MenuRow({
  href,
  icon,
  title,
  description,
  trailing,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  tone?: "g" | "w" | "bad";
}) {
  return (
    <>
      <Link href={href} className="m-row">
        <IconTile icon={icon} small tone={tone} />
        <div className="m-fl">
          <div className="t">{title}</div>
          {description && <div className="d">{description}</div>}
        </div>
        {trailing}
        <ChevronRight className="m-chev" />
      </Link>
      <hr className="m-sep" />
    </>
  );
}

export function StatusPill({ tone, children }: { tone?: "ac" | "ok" | "wr" | "bad" | "dark"; children: React.ReactNode }) {
  return <span className={`m-pl ${tone ?? ""}`}>{children}</span>;
}

export function EmptyScreen({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="m-empty">
      <div className="m-ill">
        <Icon className="m-i" strokeWidth={1.5} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div>
      {children && <div className="m-mu" style={{ fontSize: 15, lineHeight: 1.5 }}>{children}</div>}
      {action}
    </div>
  );
}
