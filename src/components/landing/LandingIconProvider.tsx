"use client";

import { IconContext } from "@phosphor-icons/react";

// React Context can only be created/used from a Client Component — page.tsx
// stays a Server Component (it exports `metadata`), so this thin wrapper is
// what actually sets the default icon weight for the landing tree.
export function LandingIconProvider({ children }: { children: React.ReactNode }) {
  return <IconContext.Provider value={{ weight: "light" }}>{children}</IconContext.Provider>;
}
