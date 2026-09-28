export function StatusBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}
