import { Archivo, Figtree, JetBrains_Mono, Outfit } from "next/font/google";

// Archivo's width axis drives the condensed uppercase display type
// (font-stretch 62–100% in campus.css), so it must load as a variable font.
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-tsl-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-tsl-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-tsl-mono" });
const brand = Outfit({ subsets: ["latin"], variable: "--font-tsl-brand" });

export const campusFonts = [display, sans, mono, brand].map((f) => f.variable).join(" ");
