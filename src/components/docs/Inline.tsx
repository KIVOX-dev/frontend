import Link from "next/link";
import type { ReactNode } from "react";
import type { Audience } from "@/content/docs/types";

const TOKEN = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

// "privacy-policy" or "privacy-policy#retention" → a doc in the same audience.
function resolveHref(href: string, audience: Audience) {
  if (/^([a-z]+:|\/|#)/i.test(href)) return href;
  return `/docs/${audience}/${href}`;
}

/** Renders a content string's **bold** and [label](href) marks; everything else is plain text. */
export function Inline({ text, audience }: { text: string; audience: Audience }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(TOKEN))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = m.index;
    if (m[1] !== undefined) {
      out.push(
        <strong key={key} className="font-semibold text-[#06262B]">
          {m[1]}
        </strong>,
      );
    } else {
      const href = resolveHref(m[3], audience);
      const external = /^https?:/i.test(href);
      const cls = "font-medium text-[#0563F9] underline decoration-[#0563F9]/30 underline-offset-[3px] hover:decoration-[#0563F9]";
      out.push(
        external || href.startsWith("mailto:") ? (
          <a key={key} href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {m[2]}
          </a>
        ) : (
          <Link key={key} href={href} className={cls}>
            {m[2]}
          </Link>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
