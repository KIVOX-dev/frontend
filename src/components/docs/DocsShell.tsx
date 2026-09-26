"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { campusFonts } from "@/components/landing/campus/fonts";
import { CookieSettingsButton } from "@/components/shared/CookieSettingsButton";
import { AUDIENCES, type Audience, type Block, type Section } from "@/content/docs/types";
import { Inline } from "./Inline";

export type NavGroup = { group: string; items: { slug: string; title: string }[] };
export type SearchDoc = { slug: string; title: string; entries: { id: string; title: string; text: string }[] };

type Props = {
  audience: Audience;
  doc: { slug: string; title: string; updated: string; intro: string; sections: Section[] };
  nav: NavGroup[];
  search: SearchDoc[];
  /** Which audiences also have this page, for the tab links. */
  availableIn: Audience[];
};

const INK = "#06262B";

// ── Content blocks ───────────────────────────────────────────────────────────
function BlockView({ block, audience }: { block: Block; audience: Audience }) {
  if ("p" in block)
    return (
      <p className="my-4">
        <Inline text={block.p} audience={audience} />
      </p>
    );
  if ("note" in block)
    return (
      <div className="my-5 rounded-md border-l-[3px] border-[#0563F9] bg-[#EEF4FF] px-4 py-3 text-[15.5px]">
        <Inline text={block.note} audience={audience} />
      </div>
    );
  if ("ul" in block || "ol" in block) {
    const items = "ul" in block ? block.ul : block.ol;
    const Tag = "ul" in block ? "ul" : "ol";
    return (
      <Tag className={`my-4 space-y-2 pl-6 ${"ul" in block ? "list-disc" : "list-decimal"} marker:text-[#6E7E7F]`}>
        {items.map((it) => (
          <li key={it} className="pl-1">
            <Inline text={it} audience={audience} />
          </li>
        ))}
      </Tag>
    );
  }
  if ("table" in block)
    return (
      <div className="my-5 overflow-x-auto rounded-md border border-[#E3E8E8]">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead className="bg-[#F5F7F7]">
            <tr>
              {block.table.head.map((h) => (
                <th key={h} className="border-b border-[#E3E8E8] px-4 py-2.5 font-semibold text-[#06262B]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((r) => (
              <tr key={r[0]} className="border-b border-[#E3E8E8] last:border-0 align-top">
                <td className="px-4 py-2.5 font-medium text-[#06262B] sm:w-[34%]">
                  <Inline text={r[0]} audience={audience} />
                </td>
                <td className="px-4 py-2.5">
                  <Inline text={r[1]} audience={audience} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if ("cookieSettings" in block)
    return (
      <p className="my-4">
        <CookieSettingsButton className="inline-flex h-10 items-center rounded-[4px] border-[1.5px] border-[#06262B] px-4 text-[15px] font-semibold text-[#06262B] transition-colors hover:bg-[#06262B] hover:text-white" />
      </p>
    );
  return null;
}

// ── "Copy page": the doc as Markdown ──────────────────────────────────────────
function toMarkdown(doc: Props["doc"]) {
  const md = (b: Block): string => {
    if ("p" in b) return b.p;
    if ("note" in b) return `> ${b.note}`;
    if ("ul" in b) return b.ul.map((i) => `- ${i}`).join("\n");
    if ("ol" in b) return b.ol.map((i, n) => `${n + 1}. ${i}`).join("\n");
    if ("table" in b)
      return [`| ${b.table.head.join(" | ")} |`, "| --- | --- |", ...b.table.rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
    return "";
  };
  const out = [`# ${doc.title}`, `Last updated: ${doc.updated}`, doc.intro];
  doc.sections.forEach((s, i) => {
    out.push(`## ${i + 1}. ${s.title}`, ...(s.blocks ?? []).map(md));
    s.subsections?.forEach((ss, j) => out.push(`### ${i + 1}.${j + 1} ${ss.title}`, ...ss.blocks.map(md)));
  });
  return out.filter(Boolean).join("\n\n");
}

function CopyPage({ doc }: { doc: Props["doc"] }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const copy = async (what: "page" | "link") => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(what === "page" ? toMarkdown(doc) : window.location.href.split("#")[0]);
      setDone(what === "page" ? "Copied" : "Link copied");
    } catch {
      setDone("Copy failed");
    }
    setTimeout(() => setDone(null), 1800);
  };
  return (
    <div className="relative inline-flex shrink-0 rounded-[4px] border border-[#D5DDDD] text-[15px] text-[#06262B]">
      <button type="button" onClick={() => copy("page")} className="inline-flex h-10 items-center gap-2 px-3.5 hover:bg-[#F5F7F7]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
        <span aria-live="polite">{done ?? "Copy page"}</span>
      </button>
      <button
        type="button"
        aria-label="More copy options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 w-10 items-center justify-center border-l border-[#D5DDDD] hover:bg-[#F5F7F7]"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-20 w-60 rounded-md border border-[#E3E8E8] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(6,38,43,.3)]">
          <button role="menuitem" type="button" onClick={() => copy("page")} className="block w-full rounded px-3 py-2 text-left hover:bg-[#F5F7F7]">
            <span className="block font-medium">Copy page</span>
            <span className="block text-[13px] text-[#6E7E7F]">As Markdown, e.g. for an AI assistant</span>
          </button>
          <button role="menuitem" type="button" onClick={() => copy("link")} className="block w-full rounded px-3 py-2 text-left hover:bg-[#F5F7F7]">
            <span className="block font-medium">Copy link</span>
            <span className="block text-[13px] text-[#6E7E7F]">This page&apos;s address</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Search (Ctrl K) ───────────────────────────────────────────────────────────
function SearchDialog({ audience, search, onClose }: { audience: Audience; search: SearchDoc[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return search.map((d) => ({ href: `/docs/${audience}/${d.slug}`, title: d.title, where: "Page", snippet: "" }));
    const out: { href: string; title: string; where: string; snippet: string; score: number }[] = [];
    for (const d of search) {
      if (d.title.toLowerCase().includes(term)) out.push({ href: `/docs/${audience}/${d.slug}`, title: d.title, where: "Page", snippet: "", score: 3 });
      for (const e of d.entries) {
        const inTitle = e.title.toLowerCase().includes(term);
        const at = e.text.toLowerCase().indexOf(term);
        if (!inTitle && at < 0) continue;
        const snippet = at < 0 ? "" : (at > 40 ? "…" : "") + e.text.slice(Math.max(0, at - 40), at + term.length + 70) + "…";
        out.push({ href: `/docs/${audience}/${d.slug}#${e.id}`, title: e.title, where: d.title, snippet, score: inTitle ? 2 : 1 });
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 30);
  }, [q, search, audience]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#06262B]/40 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search docs"
        className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-[0_30px_80px_-20px_rgba(6,38,43,.5)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#E3E8E8] px-4">
          <svg viewBox="0 0 24 24" className="size-5 text-[#6E7E7F]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && results[active]) go(results[active].href);
            }}
            placeholder="Search terms, policies and fixes…"
            className="h-14 flex-1 bg-transparent text-[16px] text-[#06262B] outline-none placeholder:text-[#8A999A]"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
          />
          <kbd className="rounded border border-[#D5DDDD] px-1.5 py-0.5 text-[12px] text-[#6E7E7F]">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[#6E7E7F]">No results for “{q}”</li>}
          {results.map((r, i) => (
            <li key={r.href + i} id={`sr-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={`block w-full rounded-md px-3 py-2.5 text-left ${i === active ? "bg-[#EEF4FF]" : ""}`}
              >
                <span className="block text-[12px] font-medium uppercase tracking-wide text-[#6E7E7F]">{r.where}</span>
                <span className="block font-semibold text-[#06262B]">{r.title}</span>
                {r.snippet && <span className="mt-0.5 block text-[13.5px] leading-snug text-[#44585A]">{r.snippet}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Scroll spy for "On this page" ─────────────────────────────────────────────
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const onScroll = () => {
      let current = els[0]?.id ?? null;
      for (const el of els) if (el.getBoundingClientRect().top <= 140) current = el.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);
  return active;
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function DocsShell({ audience, doc, nav, search, availableIn }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const portal = AUDIENCES.find((a) => a.id === audience)!.portal;

  const headingIds = useMemo(
    () => doc.sections.flatMap((s) => [s.id, ...(s.subsections ?? []).map((ss) => ss.id)]),
    [doc.sections],
  );
  const activeId = useActiveHeading(headingIds);
  const activeSection = doc.sections.find((s) => s.id === activeId || s.subsections?.some((ss) => ss.id === activeId))?.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebar = (
    <nav aria-label="Docs" className="flex flex-col gap-7">
      {nav.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 text-[13px] font-semibold uppercase tracking-[.06em] text-[#6E7E7F]">{g.group}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const current = it.slug === doc.slug;
              return (
                <li key={it.slug}>
                  <Link
                    href={`/docs/${audience}/${it.slug}`}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-2 text-[16px] transition-colors ${
                      current ? "bg-[#EDF1F1] font-semibold text-[#06262B]" : "text-[#44585A] hover:bg-[#F5F7F7] hover:text-[#06262B]"
                    }`}
                  >
                    {it.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className={`${campusFonts} min-h-screen bg-white text-[#44585A] [font-family:var(--font-tsl-sans)] antialiased`}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E9EEEE] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-4 px-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" style={{ color: INK }} aria-label="TalentSnaps home">
            <Image src="/brand/lockup.png" alt="TalentSnaps: skill meets opportunities" width={1400} height={308} sizes="200px" priority className="h-[40px] w-auto" />
            <span className="ml-1 hidden rounded border border-[#D5DDDD] px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-[#6E7E7F] sm:inline">Docs</span>
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mx-auto hidden h-11 w-full max-w-[520px] items-center gap-3 rounded-[4px] border border-[#D5DDDD] px-4 text-left text-[#8A999A] transition-colors hover:border-[#06262B] md:flex"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="flex-1">Search…</span>
            <kbd className="text-[13px]">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="flex size-10 items-center justify-center rounded-[4px] text-[#06262B] md:hidden">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <a href="mailto:admin@talentsnaps.com" className="hidden px-3 text-[16px] text-[#06262B] hover:text-[#0563F9] sm:inline">
              Support
            </a>
            <Link
              href={portal}
              className="group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-[4px] border-[1.5px] border-[#06262B] bg-[#06262B] px-4 py-2.5 text-[15px] font-semibold leading-none text-white"
            >
              <span aria-hidden="true" className="absolute inset-0 -z-10 translate-y-[101%] bg-[#0563F9] transition-transform duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0" />
              Open portal
              <svg viewBox="0 0 16 16" className="size-3.5 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden="true">
                <path d="M6 3.5 11 8l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
        {/* Audience toggle */}
        <div className="mx-auto flex max-w-[1500px] gap-7 overflow-x-auto px-4 sm:px-8" role="tablist" aria-label="Audience">
          {AUDIENCES.map((a) => {
            const current = a.id === audience;
            const href = `/docs/${a.id}/${availableIn.includes(a.id) ? doc.slug : ""}`;
            return (
              <Link
                key={a.id}
                href={href}
                role="tab"
                aria-selected={current}
                className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-[16px] transition-colors ${
                  current ? "border-[#06262B] font-semibold text-[#06262B]" : "border-transparent text-[#44585A] hover:text-[#06262B]"
                }`}
              >
                {a.label}
              </Link>
            );
          })}
          <Link href="/changelog" className="whitespace-nowrap border-b-2 border-transparent pb-3 pt-1 text-[16px] text-[#44585A] hover:text-[#06262B]">
            Changelog
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-10 px-4 sm:px-8 xl:gap-14">
        {/* Sidebar */}
        <aside className="sticky top-[122px] hidden h-[calc(100vh-122px)] w-64 shrink-0 overflow-y-auto py-10 lg:block">{sidebar}</aside>

        {/* Content */}
        <main className="min-w-0 flex-1 py-8 lg:py-12">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#D5DDDD] px-3.5 text-[15px] font-semibold text-[#06262B] lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            Menu
          </button>
          {menuOpen && <div className="mb-8 rounded-md border border-[#E3E8E8] p-3 lg:hidden">{sidebar}</div>}

          <article className="max-w-[820px] text-[17px] leading-[1.75]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-[clamp(32px,4vw,46px)] font-semibold leading-tight tracking-[-0.02em]" style={{ color: INK }}>
                {doc.title}
              </h1>
              <CopyPage doc={doc} />
            </div>
            <p className="mt-6 text-[#44585A]">Last updated: {doc.updated}</p>
            <p className="my-5">
              <Inline text={doc.intro} audience={audience} />
            </p>

            {doc.sections.map((s, i) => (
              <section key={s.id}>
                <h2 id={s.id} className="mb-2 mt-14 scroll-mt-32 text-[clamp(24px,2.6vw,30px)] font-semibold leading-snug tracking-[-0.01em]" style={{ color: INK }}>
                  <a href={`#${s.id}`} className="hover:text-[#0563F9]">
                    {i + 1}. {s.title}
                  </a>
                </h2>
                {s.blocks?.map((b, k) => <BlockView key={k} block={b} audience={audience} />)}
                {s.subsections?.map((ss, j) => (
                  <div key={ss.id}>
                    <h3 id={ss.id} className="mb-1 mt-9 scroll-mt-32 text-[clamp(19px,2vw,23px)] font-semibold leading-snug" style={{ color: INK }}>
                      <a href={`#${ss.id}`} className="hover:text-[#0563F9]">
                        {i + 1}.{j + 1} {ss.title}
                      </a>
                    </h3>
                    {ss.blocks.map((b, k) => (
                      <BlockView key={k} block={b} audience={audience} />
                    ))}
                  </div>
                ))}
              </section>
            ))}

            <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#E9EEEE] pt-6 text-[15px]">
              <span>Questions about this page?</span>
              <a href="mailto:admin@talentsnaps.com" className="font-semibold text-[#0563F9] hover:underline">
                admin@talentsnaps.com
              </a>
            </div>
          </article>
        </main>

        {/* On this page */}
        <aside className="sticky top-[122px] hidden h-[calc(100vh-122px)] w-72 shrink-0 overflow-y-auto py-12 xl:block">
          <p className="mb-3 flex items-center gap-2 text-[16px] font-medium" style={{ color: INK }}>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h12M4 18h8" />
            </svg>
            On this page
          </p>
          <ul className="flex flex-col gap-0.5 border-l border-[#E3E8E8] text-[15.5px]">
            {doc.sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                    activeSection === s.id ? "border-[#0563F9] text-[#06262B]" : "border-transparent text-[#44585A] hover:text-[#06262B]"
                  }`}
                >
                  {i + 1}. {s.title}
                </a>
                {s.subsections && s.subsections.length > 0 && (
                  <ul>
                    {s.subsections.map((ss, j) => (
                      <li key={ss.id}>
                        <a
                          href={`#${ss.id}`}
                          className={`-ml-px block border-l-2 py-1.5 pl-8 leading-snug transition-colors ${
                            activeId === ss.id ? "border-[#0563F9] text-[#0563F9]" : "border-transparent text-[#6E7E7F] hover:text-[#06262B]"
                          }`}
                        >
                          {i + 1}.{j + 1} {ss.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {searchOpen && <SearchDialog audience={audience} search={search} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
