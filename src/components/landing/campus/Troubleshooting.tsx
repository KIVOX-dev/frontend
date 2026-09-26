"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CampusAudience } from "./audiences";
import { Icon, Split } from "./primitives";
import { GUIDES, SUPPORT_EMAIL, type Fix } from "./troubleshootingGuides";

const norm = (s: string) => s.toLowerCase().replace(/[“”"'’…]/g, "");
const matches = (fix: Fix, q: string) => !q || norm([fix.q, fix.a, ...(fix.steps ?? [])].join(" ")).includes(q);

// Per-portal troubleshooting guide, one section per module.
//
// Filtering hides rows with the `hidden` attribute rather than unmounting
// them: CampusShell only wires its scroll reveals once, on mount, so a node
// React mounted later would never get its .in class.
export function Troubleshooting({ audience }: { audience: CampusAudience }) {
  const guide = GUIDES[audience];
  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  const visible = useMemo(() => {
    const shown = new Set<string>();
    let count = 0;
    for (const g of guide.groups)
      for (const m of g.modules)
        m.fixes.forEach((f, i) => {
          if (matches(f, q) || (q && norm(m.title).includes(q))) {
            shown.add(`${g.id}/${m.id}/${i}`);
            count++;
          }
        });
    return { shown, count };
  }, [guide, q]);

  const total = guide.groups.reduce((n, g) => n + g.modules.reduce((k, m) => k + m.fixes.length, 0), 0);
  const moduleCount = guide.groups.reduce((n, g) => n + g.modules.length, 0);

  return (
    <>
      <div className="row">
        <div className="head ts-head">
          <span className="eb rv">
            <i></i>Troubleshooting · {guide.portal} portal
          </span>
          <Split as="h1" className="dt h2 anim">
            {guide.title}
          </Split>
          <p className="lede rv" style={{ "--i": "2" }}>
            {guide.lede}
          </p>
          <div className="ts-tools rv" style={{ "--i": "3" }}>
            <label className="ts-search">
              <span className="sr-only">Search troubleshooting</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search an error message or module"
                autoComplete="off"
              />
            </label>
            <Link className="btn btn-dark" href={guide.loginPath}>
              Open the {guide.portal.toLowerCase()} portal
              <Icon name="arrow" />
            </Link>
          </div>
          <p className="ts-count" aria-live="polite">
            {q
              ? `${visible.count} of ${total} fixes match “${query.trim()}”`
              : `${total} fixes across ${moduleCount} modules`}
          </p>
        </div>
      </div>

      <div className="rule"></div>

      <div className="row">
        <div className="ts-body">
          <nav className="ts-index" aria-label="Modules">
            {guide.groups.map((g) => (
              <div key={g.id}>
                <h5>{g.title}</h5>
                {g.modules.map((m) => {
                  const any = m.fixes.some((_, i) => visible.shown.has(`${g.id}/${m.id}/${i}`));
                  return (
                    <a key={m.id} href={`#${g.id}-${m.id}`} hidden={!any}>
                      {m.title}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="ts-main">
            {guide.groups.map((g) => {
              const groupAny = g.modules.some((m) => m.fixes.some((_, i) => visible.shown.has(`${g.id}/${m.id}/${i}`)));
              return (
                <section key={g.id} className="ts-group" hidden={!groupAny} aria-labelledby={`g-${g.id}`}>
                  <h2 id={`g-${g.id}`} className="ts-gt">
                    {g.title}
                  </h2>
                  {g.modules.map((m) => {
                    const any = m.fixes.some((_, i) => visible.shown.has(`${g.id}/${m.id}/${i}`));
                    return (
                      <article key={m.id} id={`${g.id}-${m.id}`} className="ts-mod" hidden={!any}>
                        <header>
                          <h3>{m.title}</h3>
                          <span className="ts-where">{m.where}</span>
                        </header>
                        <div className="faq">
                          {m.fixes.map((f, i) => {
                            const on = visible.shown.has(`${g.id}/${m.id}/${i}`);
                            return (
                              <details key={i} hidden={!on} open={q && on ? true : undefined}>
                                <summary>
                                  {f.q}
                                  <span className="pm">
                                    <Icon name="plus" style={{ width: "16px", height: "16px" }} />
                                  </span>
                                </summary>
                                <div className="ans">
                                  <p>{f.a}</p>
                                  {f.steps && (
                                    <ol>
                                      {f.steps.map((s) => (
                                        <li key={s}>{s}</li>
                                      ))}
                                    </ol>
                                  )}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </section>
              );
            })}

            {q && visible.count === 0 && (
              <p className="ts-empty">
                Nothing matches “{query.trim()}”. Try a shorter phrase from the message, or{" "}
                <button type="button" onClick={() => setQuery("")}>
                  clear the search
                </button>
                .
              </p>
            )}

            <div className="ts-help">
              <h3>Still stuck?</h3>
              <p>
                Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the portal, the screen you were on, the exact
                message and roughly when it happened. A screenshot helps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
