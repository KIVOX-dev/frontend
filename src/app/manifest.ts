import type { MetadataRoute } from "next";

// Web app manifest: what Android/Chrome use when TalentSnaps is installed to
// the home screen. Icons are built from the official logo by
// scripts/build-brand-assets.cjs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TalentSnaps",
    short_name: "TalentSnaps",
    description: "Campus placements from first year to first offer: drives, rounds, assessments and offer letters in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    // The logo's blue, so the status bar and splash screen match the icon.
    theme_color: "#0664f9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full-bleed versions Android crops to the launcher's icon shape.
      // Without these, Android shrinks the round logo onto a white plate.
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
