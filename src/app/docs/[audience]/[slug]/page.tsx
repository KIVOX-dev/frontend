import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell, type NavGroup, type SearchDoc } from "@/components/docs/DocsShell";
import { AUDIENCES, DOCS, blockText, findDoc, resolveIntro, resolveSections, type Audience } from "@/content/docs";

type Params = { audience: string; slug: string };

const isAudience = (a: string): a is Audience => AUDIENCES.some((x) => x.id === a);

export function generateStaticParams(): Params[] {
  return DOCS.flatMap((d) => d.audiences.map((audience) => ({ audience, slug: d.slug })));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { audience, slug } = await params;
  const doc = isAudience(audience) ? findDoc(audience, slug) : null;
  if (!doc || !isAudience(audience)) return {};
  const label = AUDIENCES.find((a) => a.id === audience)!.label;
  return {
    title: `${doc.title} · ${label}`,
    description: resolveIntro(doc, audience),
    alternates: { canonical: `/docs/${audience}/${slug}` },
  };
}

export default async function DocPage({ params }: { params: Promise<Params> }) {
  const { audience, slug } = await params;
  if (!isAudience(audience)) notFound();
  const doc = findDoc(audience, slug);
  if (!doc) notFound();

  const docsHere = DOCS.filter((d) => d.audiences.includes(audience));
  const nav: NavGroup[] = (["Support", "Legal"] as const).map((group) => ({
    group,
    items: docsHere.filter((d) => d.group === group).map((d) => ({ slug: d.slug, title: d.title })),
  }));
  const search: SearchDoc[] = docsHere.map((d) => ({
    slug: d.slug,
    title: d.title,
    entries: resolveSections(d, audience).flatMap((s) => [
      { id: s.id, title: s.title, text: (s.blocks ?? []).map(blockText).join(" ") },
      ...(s.subsections ?? []).map((ss) => ({ id: ss.id, title: ss.title, text: ss.blocks.map(blockText).join(" ") })),
    ]),
  }));

  return (
    <DocsShell
      audience={audience}
      doc={{ slug: doc.slug, title: doc.title, updated: doc.updated, intro: resolveIntro(doc, audience), sections: resolveSections(doc, audience) }}
      nav={nav}
      search={search}
      availableIn={doc.audiences}
    />
  );
}
