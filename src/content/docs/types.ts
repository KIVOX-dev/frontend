// Content model for the docs centre (/docs/{audience}/{slug}).
//
// Text strings support two inline marks, rendered by components/docs/Inline:
//   **bold**  and  [label](href)
// Anything else is plain text, so content never needs escaping.

export type Audience = "individuals" | "institutions" | "recruiters";

export const AUDIENCES: { id: Audience; label: string; who: string; portal: string }[] = [
  { id: "individuals", label: "For Individuals", who: "students and learners", portal: "/learner" },
  { id: "institutions", label: "For Institutions", who: "colleges, placement cells and faculty", portal: "/institutional" },
  { id: "recruiters", label: "For Recruiters", who: "HR and campus hiring teams", portal: "/hr" },
];

export type Block =
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  /** Highlighted aside, e.g. a summary or an important caveat. */
  | { note: string }
  /** A two-column table: [term, description] rows. */
  | { table: { head: [string, string]; rows: [string, string][] } }
  /** Renders the "Cookie settings" button that reopens the consent panel. */
  | { cookieSettings: true };

export type Subsection = {
  id: string;
  title: string;
  blocks: Block[];
  /** Only shown for these audiences; omitted = everyone. */
  audiences?: Audience[];
};

export type Section = {
  id: string;
  title: string;
  blocks?: Block[];
  subsections?: Subsection[];
  audiences?: Audience[];
};

export type DocGroup = "Support" | "Legal";

export type Doc = {
  slug: string;
  title: string;
  group: DocGroup;
  /** Shown as "Last updated …". */
  updated: string;
  /** One-paragraph summary under the title. */
  intro: string | ((audience: Audience) => string);
  audiences: Audience[];
  sections: Section[] | ((audience: Audience) => Section[]);
};
