import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKETING_PAGES, marketingPage } from "@/lib/marketing-pages";
import { publicPageMetadata, SITE_URL } from "@/lib/seo";
import s from "./site-page.module.css";

// Paginile publice pe meserie și funcționalitate. Doar slug-urile din listă există; restul dau 404.
export const dynamicParams = false;
export const generateStaticParams = () => MARKETING_PAGES.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = marketingPage((await params).slug);
  return page ? publicPageMetadata(page.title, page.description, `/${page.slug}`) : {};
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

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = marketingPage((await params).slug);
  if (!page) notFound();
  const related = (await Promise.all(page.related.map(async (slug) => ({ slug, title: await articleTitle(slug) })))).filter((r) => r.title);
  const others = MARKETING_PAGES.filter((p) => p.slug !== page.slug);
  const url = `${SITE_URL}/${page.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: page.title,
        description: page.description,
        inLanguage: "ro-RO",
        dateModified: page.updated,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: page.h1, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <div className={s.site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className={s.top}>
        <div className={`${s.wrap} ${s.nav}`}>
          <Link className={s.logo} href="/" aria-label="ElectroField">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={26} height={26} />
            ElectroField
          </Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-instalatii-electrice">Electrice</Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-gaze-verificari-revizii">Gaze</Link>
          <Link className={`${s.l} ${s.h}`} href="/firme-fotovoltaice">Fotovoltaice</Link>
          <Link className={s.l} href="/blog">Blog</Link>
          <Link className={`${s.btn} ${s.ghost} ${s.h}`} href="/login">Conectează-te</Link>
          <Link className={s.btn} href="/programare">Programează un demo</Link>
        </div>
      </header>

      <main className={s.art}>
        <nav className={s.crumbs} aria-label="Navigare"><Link href="/">Acasă</Link> / {page.h1}</nav>
        <p className={s.kicker}>{page.kicker}</p>
        <h1>{page.h1}</h1>
        <p className={s.lead}>{page.lead}</p>

        {page.sections.map((sec) => (
          <section key={sec.h}>
            <h2>{sec.h}</h2>
            {sec.p?.map((t) => <p key={t}>{t}</p>)}
            {sec.list && <ul>{sec.list.map((t) => <li key={t}>{t}</li>)}</ul>}
          </section>
        ))}

        <div className={s.cta}>
          <h2>Vezi platforma pe firma ta</h2>
          <p>O discuție de 15 minute la telefon sau 30 de minute pe Google Meet, cu platforma pe ecran, pe lucrările și echipele tale.</p>
          <Link className={s.btn} href="/programare">Programează un demo</Link>
        </div>

        <section className={s.faq}>
          <h2>Întrebări frecvente</h2>
          {page.faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </section>

        {related.length > 0 && (
          <section>
            <h2>Ghiduri legate</h2>
            <ul className={s.related}>
              {related.map((r) => <li key={r.slug}><Link href={`/blog/${r.slug}`}>{r.title}</Link></li>)}
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
          <Link href="/">Acasă</Link><Link href="/blog">Blog</Link><Link href="/programare">Programează un demo</Link>
          <Link href="/termeni">Termeni</Link><Link href="/confidentialitate">Confidențialitate</Link>
          <p>© 2026 ElectroField · contact@electrofield.ro · 0750 425 670</p>
        </div>
      </footer>
    </div>
  );
}
