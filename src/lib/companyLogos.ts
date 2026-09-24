export type CompanyLogo = { key: string; name: string; src: string };

export const COMPANY_LOGOS: CompanyLogo[] = [
  { key: "tcs", name: "TCS", src: "/images/companies/tcs.png" },
  { key: "infosys", name: "Infosys", src: "/images/companies/infosys.png" },
  { key: "wipro", name: "Wipro", src: "/images/companies/wipro.png" },
  { key: "cognizant", name: "Cognizant", src: "/images/companies/cognizant.png" },
  { key: "accenture", name: "Accenture", src: "/images/companies/accenture.png" },
  { key: "zoho", name: "Zoho", src: "/images/companies/zoho.png" },
];

// Matches loosely so track names like "TCS NQT" or "Cognizant GenC" and
// free-typed company names still resolve to the bundled logo.
export function companyLogoFor(name: string | null | undefined): string | null {
  const n = (name || "").trim().toLowerCase();
  if (!n) return null;
  const hit = COMPANY_LOGOS.find((c) => n === c.key || n.startsWith(`${c.key} `) || (c.key === "tcs" && n.includes("tata consultancy")));
  return hit ? hit.src : null;
}
