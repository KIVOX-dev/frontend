// One spelling per job role, wherever it's shown: "se", "SE " and "Se" all
// read "SE". A short all-lower-case name is treated as an acronym (se, sde,
// qa, hr → SE, SDE, QA, HR); a longer lower-case name is title-cased with any
// two-letter word kept as an acronym ("se intern" → "SE Intern"); a name that
// already has deliberate capitals ("DevOps Engineer") is left as typed.
const SMALL_WORDS = new Set(["of", "to", "in", "at", "an", "or", "as", "by", "on", "for", "and", "the"]);

export function displayRoleName(role: string | null | undefined): string {
  const clean = (role ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  if (clean !== clean.toLowerCase()) return clean;
  if (!clean.includes(" ") && clean.length <= 3) return clean.toUpperCase();
  return clean
    .split(" ")
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      return w.length === 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
