import { StaticLink } from "@/components/static-link";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import {
  breadcrumbName,
  formatRoDate,
  MARKETING_PAGES,
  marketingPage,
  ogImagePath,
  type MarketingBlock,
  type MarketingPage,
  type MarketingSection,
} from "@/lib/marketing-pages";
import { parseInlineLinks, stripInlineLinks } from "@/lib/inline-links";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  ORGANIZATION_ID,
  organizationJsonLd,
  publicPageMetadata,
  serializeJsonLd,
  SITE_URL,
  SOFTWARE_ID,
  softwareJsonLd,
  WEBSITE_ID,
  websiteJsonLd,
} from "@/lib/seo";
import { LEGAL_SHORT } from "@/lib/contact";
import s from "./site-page.module.css";

// Paginile publice pe meserie și funcționalitate. Doar slug-urile din listă există; restul dau 404.
export const dynamicParams = false;
export const generateStaticParams = () => MARKETING_PAGES.map((p) => ({ slug: p.slug }));

/** Imaginea Open Graph a paginii, dacă fișierul există în public/; altfel cea implicită a site-ului. */
async function ogImageFor(page: MarketingPage) {
  const wanted = ogImagePath(page);
  if (/^https?:\/\//.test(wanted)) return wanted;
  try {
    await access(path.join(process.cwd(), "public", wanted));
    return wanted;
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = marketingPage((await params).slug);
  if (!page) return {};
  return publicPageMetadata(page.title, stripInlineLinks(page.description), `/${page.slug}`, {
    ogImage: await ogImageFor(page),
    ogAlt: page.h1,
  });
}

/** Titlul articolului din blog (fără „| ElectroField”), citit din fișierul lui. */
async function articleTitle(slug: string) {
  try {
    const html = await readFile(path.join(process.cwd(), "public", "blog", `${slug}.html`), "utf8");
    return (/<title>([^<]+)<\/title>/.exec(html)?.[1] ?? slug).replace(/\s*\|\s*ElectroField\s*$/, "").trim();
  } catch {
    return null;
  }
}

/** Text cu legături [text](/cale): paginile Next prin <Link>, /blog și /programare prin StaticLink. */
function Rich({ text }: { text: string }) {
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

function Block({ block }: { block: MarketingBlock }) {
  switch (block.type) {
    case "p":
      return <p><Rich text={block.text} /></p>;
    case "list":
      return <ul>{block.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>;
    case "steps":
      return <ol className={s.steps}>{block.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ol>;
    case "table":
      return (
        // Tabelul se derulează orizontal pe ecrane înguste; zona primește focus ca să se deruleze și de la tastatură.
        <div className={s.tableWrap} role="region" aria-label={block.caption ? stripInlineLinks(block.caption) : "Tabel"} tabIndex={0}>
          <table className={s.table}>
            {block.caption && <caption><Rich text={block.caption} /></caption>}
            <thead>
              <tr>{block.head.map((h, i) => <th key={i} scope="col"><Rich text={h} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}><Rich text={c} /></td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <div className={s.callout} role="note">
          {block.title && <p className={s.calloutTitle}>{block.title}</p>}
          <p><Rich text={block.text} /></p>
        </div>
      );
  }
}

function Section({ sec }: { sec: MarketingSection }) {
  return (
    <section>
      <h2 id={sec.id}>{sec.h}</h2>
      {sec.answer && <p className={s.answer}><Rich text={sec.answer} /></p>}
      {sec.p?.map((t, i) => <p key={i}><Rich text={t} /></p>)}
      {sec.list && <ul>{sec.list.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>}
      {sec.blocks?.map((b, i) => <Block key={i} block={b} />)}
    </section>
  );
}

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = marketingPage((await params).slug);
  if (!page) notFound();
  const related = (await Promise.all(page.related.map(async (slug) => ({ slug, title: await articleTitle(slug) })))).filter((r) => r.title);
  const others = MARKETING_PAGES.filter((p) => p.slug !== page.slug);
  const url = `${SITE_URL}/${page.slug}`;
  const crumb = breadcrumbName(page);
  const ogImage = absoluteUrl(await ogImageFor(page));

  // Graful e complet pe fiecare pagină: WebSite, Organization și SoftwareApplication sunt incluse, nu doar referite.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: page.title,
        description: stripInlineLinks(page.description),
        inLanguage: "ro-RO",
        dateModified: page.updated,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": SOFTWARE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        primaryImageOfPage: { "@type": "ImageObject", url: ogImage, contentUrl: ogImage, width: 1200, height: 630, caption: page.h1 },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: crumb, item: url },
        ],
      },
      ...(page.faq.length > 0
        ? [{
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            mainEntity: page.faq.map((f) => ({
              "@type": "Question",
              name: stripInlineLinks(f.q),
              acceptedAnswer: { "@type": "Answer", text: stripInlineLinks(f.a) },
            })),
          }]
        : []),
      websiteJsonLd(),
      organizationJsonLd(),
      softwareJsonLd(),
    ],
  };

  return (
    <div className={s.site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <header className={s.top}>
        <div className={`${s.wrap} ${s.nav}`}>
          <Link className={s.logo} href="/" aria-label="ElectroField">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={26} height={26} />
            ElectroField
          </Link>
          <Link className={`${s.l} ${s.h} ${s.hw}`} href="/software-management-echipe-teren">Software echipe teren</Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-instalatii-electrice">Electrice</Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-gaze-verificari-revizii">Gaze</Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-fotovoltaice">Fotovoltaice</Link>
          <StaticLink className={s.l} href="/blog">Blog</StaticLink>
          <Link className={`${s.btn} ${s.ghost} ${s.h}`} href="/login">Conectează-te</Link>
          <StaticLink className={s.btn} href="/programare">Programează un demo</StaticLink>
        </div>
      </header>

      <main className={s.art}>
        <nav className={s.crumbs} aria-label="Fir de navigare"><Link href="/">Acasă</Link> / <span aria-current="page">{crumb}</span></nav>
        <p className={s.kicker}>{page.kicker}</p>
        <h1>{page.h1}</h1>
        <p className={s.updated}>Actualizat la <time dateTime={page.updated}>{formatRoDate(page.updated)}</time></p>
        <p className={s.lead}><Rich text={page.lead} /></p>

        {page.sections.map((sec, i) => <Section key={i} sec={sec} />)}

        <div className={s.cta}>
          <h2>Vezi platforma pe firma ta</h2>
          <p>O discuție de 15 minute la telefon sau 30 de minute pe Google Meet, cu platforma pe ecran, pe lucrările și echipele tale.</p>
          <StaticLink className={s.btn} href="/programare">Programează un demo</StaticLink>
        </div>

        {page.faq.length > 0 && (
          <section className={s.faq}>
            <h2>Întrebări frecvente</h2>
            {page.faq.map((f, i) => (
              <details key={i}><summary>{f.q}</summary><p><Rich text={f.a} /></p></details>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <section>
            <h2>Ghiduri legate</h2>
            <ul className={s.related}>
              {related.map((r) => <li key={r.slug}><StaticLink href={`/blog/${r.slug}`}>{r.title}</StaticLink></li>)}
            </ul>
          </section>
        )}

        <section>
          <h2>Mai multe despre ElectroField</h2>
          <ul className={s.more}>
            {others.map((p) => <li key={p.slug}><Link href={`/${p.slug}`}>{p.h1}</Link></li>)}
          </ul>
        </section>
      </main>

      <footer className={s.foot}>
        <div className={s.wrap}>
          <nav className={s.footPages} aria-label="Paginile ElectroField">
            {MARKETING_PAGES.map((p) => (
              <Link key={p.slug} href={`/${p.slug}`} aria-current={p.slug === page.slug ? "page" : undefined}>{breadcrumbName(p)}</Link>
            ))}
          </nav>
          <Link href="/">Acasă</Link><StaticLink href="/blog">Blog</StaticLink><StaticLink href="/programare">Programează un demo</StaticLink>
          <Link href="/termeni">Termeni</Link><Link href="/confidentialitate">Confidențialitate</Link>
          <p>© 2026 ElectroField · {LEGAL_SHORT} · contact@electrofield.ro · 0750 425 670</p>
        </div>
      </footer>
    </div>
  );
}
