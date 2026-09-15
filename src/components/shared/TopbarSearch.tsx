"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * The topbar search box (".sw" markup, previously a plain uncontrolled
 * <input> with no logic at all — see CollegeAdminShell.tsx before this).
 * Enter navigates to a real, bookmarkable URL
 * (?screen=search-results&q=...) rather than just flipping client state —
 * the page component reads these params on mount/change to drive
 * useUiStore's activeScreen (see institutional/page.tsx).
 */
export function TopbarSearch({ placeholder }: { placeholder: string }) {
  const [value, setValue] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    router.push(`${pathname}?screen=search-results&q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="sw">
      <button type="button" className="si" onClick={submit} aria-label="Search" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
    </div>
  );
}
