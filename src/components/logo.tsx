import Image from "next/image";

/** ElectroField logo: the mark plus "Electro" in text and the "Field" wordmark. `size` is the mark's height in px. */
export function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="ElectroField">
      <Image src="/logo-mark.png" alt="" width={537} height={571} style={{ height: size, width: "auto" }} priority />
      <span className="flex items-baseline font-extrabold tracking-tight" style={{ fontSize: size * 0.66 }} aria-hidden>
        Electro
        <Image src="/logo-wordmark-field.png" alt="" width={496} height={173} style={{ height: size * 0.62, width: "auto", transform: "translateY(1px)" }} />
      </span>
    </span>
  );
}
