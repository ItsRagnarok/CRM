import { Fragment } from "react";
import Link from "next/link";
import { StaticLink } from "@/components/static-link";
import { parseInlineLinks } from "@/lib/inline-links";

/**
 * Text cu legături scrise [text](/cale) (vezi src/lib/inline-links.ts): paginile Next prin <Link>,
 * /blog și /programare prin StaticLink, sursele externe în filă nouă.
 */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInlineLinks(text).map((seg, i) => {
        if (!seg.href) return <Fragment key={i}>{seg.text}</Fragment>;
        if (seg.kind === "page") return <Link key={i} href={seg.href}>{seg.text}</Link>;
        if (seg.kind === "static") return <StaticLink key={i} href={seg.href}>{seg.text}</StaticLink>;
        if (seg.kind === "external") return <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer">{seg.text}</a>;
        return <a key={i} href={seg.href}>{seg.text}</a>;
      })}
    </>
  );
}
