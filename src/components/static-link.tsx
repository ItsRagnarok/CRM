import type { AnchorHTMLAttributes } from "react";

/**
 * Legătură obișnuită (încărcare completă) spre paginile statice ale site-ului: /programare și /blog.
 * Ele sunt fișiere HTML, nu pagini Next; un <Link> le-ar încerca întâi ca navigare internă, ar eșua
 * și abia apoi le-ar deschide, de unde o sacadare vizibilă.
 */
export function StaticLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />;
}
