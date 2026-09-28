import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5 p-7">
      <h1 className="text-[17px] font-extrabold text-foreground">{title}</h1>
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white px-6 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-soft">
          <Icon className="h-6 w-6 text-electric" strokeWidth={1.8} />
        </div>
        <h2 className="text-[15px] font-bold text-foreground">În construcție</h2>
        <p className="max-w-sm text-[13.5px] text-muted">{description}</p>
      </div>
    </div>
  );
}
