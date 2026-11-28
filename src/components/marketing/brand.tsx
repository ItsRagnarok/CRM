import Image from "next/image";

/**
 * Sigla ElectroField pentru pagina principală (meniu și subsol). Arată ca <Logo />, dar numele „ElectroField”
 * stă pe un element cu role="img": aria-label nu e permis pe un <span> fără rol (accesibilitate, Lighthouse).
 * `size` e înălțimea semnului, în px; `priority` doar pentru sigla din meniu, vizibilă la încărcare.
 */
export function BrandLogo({ size = 30, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span role="img" aria-label="ElectroField" className="inline-flex items-center gap-2.5">
      <Image src="/logo-mark.png" alt="" width={181} height={192} style={{ height: size, width: "auto" }} priority={priority} />
      <span className="flex items-baseline font-extrabold tracking-tight" style={{ fontSize: size * 0.66 }}>
        Electro
        <Image src="/logo-wordmark-field.png" alt="" width={275} height={96} style={{ height: size * 0.62, width: "auto", transform: "translateY(1px)" }} />
      </span>
    </span>
  );
}
