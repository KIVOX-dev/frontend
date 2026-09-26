import { GUIDES, SUPPORT_EMAIL } from "@/components/landing/campus/troubleshootingGuides";
import type { CampusAudience } from "@/components/landing/campus/audiences";
import { cookies } from "./cookies";
import { dataProtection } from "./dataProtection";
import { privacy } from "./privacy";
import { terms } from "./terms";
import type { Audience, Block, Doc, Section, Subsection } from "./types";

export * from "./types";

const GUIDE_FOR: Record<Audience, CampusAudience> = {
  individuals: "learners",
  institutions: "institutions",
  recruiters: "hr",
};

export { CAMPUS_TO_DOCS } from "@/components/landing/campus/audiences";

// Built from the same guides as before (troubleshootingGuides.ts), so the
// fixes live in one place: one section per portal area, one sub-section per
// module, each fix a bold symptom followed by the answer and any steps.
const troubleshooting: Doc = {
  slug: "troubleshooting",
  title: "Troubleshooting",
  group: "Support",
  updated: "26 September 2026",
  audiences: ["individuals", "institutions", "recruiters"],
  intro: (a) => `${GUIDES[GUIDE_FOR[a]].lede} Press Ctrl K to search every fix.`,
  sections: (a) =>
    GUIDES[GUIDE_FOR[a]].groups.map(
      (g): Section => ({
        id: g.id,
        title: g.title,
        subsections: g.modules.map(
          (m): Subsection => ({
            id: `${g.id}-${m.id}`,
            title: m.title,
            blocks: [
              { p: `**Where:** ${m.where}` },
              ...m.fixes.flatMap((f): Block[] => [
                { p: `**${f.q}**  ${f.a}` },
                ...(f.steps ? [{ ol: f.steps }] : []),
              ]),
            ],
          }),
        ),
      }),
    ).concat({
      id: "still-stuck",
      title: "Still Stuck?",
      blocks: [
        {
          p: `Email [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}) with the portal, the screen you were on, the exact message and roughly when it happened. A screenshot helps.`,
        },
      ],
    }),
};

export const DOCS: Doc[] = [troubleshooting, terms, privacy, cookies, dataProtection];

export function findDoc(audience: Audience, slug: string) {
  return DOCS.find((d) => d.slug === slug && d.audiences.includes(audience)) ?? null;
}

const visible = (audience: Audience) => (x: { audiences?: Audience[] }) => !x.audiences || x.audiences.includes(audience);

/** The doc's sections for one audience, with other audiences' parts removed. */
export function resolveSections(doc: Doc, audience: Audience): Section[] {
  const all = typeof doc.sections === "function" ? doc.sections(audience) : doc.sections;
  return all
    .filter(visible(audience))
    .map((s) => ({ ...s, subsections: s.subsections?.filter(visible(audience)) }))
    .filter((s) => (s.blocks && s.blocks.length > 0) || (s.subsections && s.subsections.length > 0));
}

export function resolveIntro(doc: Doc, audience: Audience) {
  return typeof doc.intro === "function" ? doc.intro(audience) : doc.intro;
}

/** Plain text of a block, for search and "Copy page" (marks stripped to their text). */
export function blockText(b: Block): string {
  const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
  if ("p" in b) return strip(b.p);
  if ("note" in b) return strip(b.note);
  if ("ul" in b) return b.ul.map(strip).join("\n");
  if ("ol" in b) return b.ol.map(strip).join("\n");
  if ("table" in b) return b.table.rows.map((r) => r.map(strip).join(": ")).join("\n");
  return "";
}
