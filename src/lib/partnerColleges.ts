export type PartnerCollege = {
  name: string;
  code: string;
  location?: string;
  logo: string;
};

// Mirrors the seed roster in backend/node-api/scripts/seedColleges.js — the
// authoritative list of institutions on the platform. Two seeded colleges
// (Shankar College of Engineering and Technology, Shankara College of Arts
// and Science) have no discoverable official web presence to source a real
// logo from, so they're intentionally left out rather than faked.
export const partnerColleges: PartnerCollege[] = [
  { name: "Nirmala College for Women", code: "NCW", location: "Coimbatore", logo: "/logos/colleges/ncw.png" },
  { name: "PSGR Krishnammal College for Women", code: "PSGRKCW", location: "Coimbatore", logo: "/logos/colleges/psgrkcw.png" },
  { name: "A.G. Arts and Science College", code: "AGASC", location: "Tiruppur", logo: "/logos/colleges/agasc.png" },
  { name: "Suguna College of Arts and Science", code: "SCAS", location: "Coimbatore", logo: "/logos/colleges/scas.png" },
  { name: "Suguna College of Engineering", code: "SCE", location: "Coimbatore", logo: "/logos/colleges/sce.png" },
  { name: "CMS College of Commerce", code: "CMSCC", location: "Coimbatore", logo: "/logos/colleges/cmscc.png" },
  { name: "VLB Janakiammal College of Arts and Science", code: "VLBJCAS", location: "Coimbatore", logo: "/logos/colleges/vlbjcas.png" },
  { name: "Nallamuthu Gounder Mahalingam College", code: "NGMC", location: "Pollachi", logo: "/logos/colleges/ngmc.png" },
  { name: "Bishop Ambrose College", code: "BAC", location: "Coimbatore", logo: "/logos/colleges/bac.jpg" },
];
