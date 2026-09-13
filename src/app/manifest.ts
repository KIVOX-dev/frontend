import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TalentSnaps — Complete Education Management Platform",
    short_name: "TalentSnaps",
    description: "One intelligent platform connecting HR, students, faculty, and administrators across your institution.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0056d2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
