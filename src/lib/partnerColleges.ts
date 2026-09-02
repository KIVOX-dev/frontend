export type PartnerCollege = {
  name: string;
  code: string;
  location?: string;
  logo: string;
};

// Mirrors the seed roster in backend/node-api/scripts/seedColleges.js — the
// authoritative list of institutions on the platform. One seeded college
// (Shankar College of Engineering and Technology) has no discoverable
// official web presence to source a real logo from, so it's intentionally
// left out rather than faked. The seed's "Shankara College of Arts and
// Science" (code SKASC) is a name mismatch for the real institution —
// Sankara College of Science and Commerce (sankara.ac.in) — confirmed by
// the actual college logo the user provided.
export const partnerColleges: PartnerCollege[] = [
  { name: "Nirmala College for Women", code: "NCW", location: "Coimbatore", logo: "/logos/colleges/ncw.png" },
  { name: "PSGR Krishnammal College for Women", code: "PSGRKCW", location: "Coimbatore", logo: "/logos/colleges/psgrkcw.png" },
  { name: "A.G. Arts and Science College", code: "AGASC", location: "Tiruppur", logo: "/logos/colleges/agasc.png" },
  { name: "Suguna College of Arts and Science", code: "SCAS", location: "Coimbatore", logo: "/logos/colleges/scas.png" },
  { name: "Suguna College of Engineering", code: "SCE", location: "Coimbatore", logo: "/logos/colleges/sce.png" },
  { name: "CMS College of Commerce", code: "CMSCC", location: "Coimbatore", logo: "/logos/colleges/cmscc.png" },
  { name: "VLB Janakiammal College of Arts and Science", code: "VLBJCAS", location: "Coimbatore", logo: "/logos/colleges/vlbjcas.svg" },
  { name: "Nallamuthu Gounder Mahalingam College", code: "NGMC", location: "Pollachi", logo: "/logos/colleges/ngmc.png" },
  { name: "Bishop Ambrose College", code: "BAC", location: "Coimbatore", logo: "/logos/colleges/bac.png" },
  { name: "Sankara College of Science and Commerce", code: "SKASC", location: "Coimbatore", logo: "/logos/colleges/skasc.png" },
];
