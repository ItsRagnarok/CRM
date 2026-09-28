import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-soft">
        <Icon className="h-6 w-6 text-electric" strokeWidth={1.8} />
      </div>
      <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
      <p className="max-w-sm text-[13.5px] text-muted">{description}</p>
      {action}
    </div>
  );
}
