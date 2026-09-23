"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUDIENCES, AUDIENCE_ORDER } from "./audiences";

// Real navigation, not client state — matches how coursera.org's own top
// bar works: each tab is a distinct page (coursera.org, /business, /campus),
// not one page swapping content in place.
export default function AudienceBar() {
  const pathname = usePathname();

  return (
    <div className="bg-[#0d0f12]" role="tablist" aria-label="Choose your audience">
      <div className="ui-container">
        <div className="flex items-center gap-1">
          {AUDIENCE_ORDER.map((key) => {
            const audience = AUDIENCES[key];
            const tabHref = audience.tabPath ?? audience.path;
            const isActive = pathname === tabHref;
            return (
              <Link
                key={key}
                href={tabHref}
                role="tab"
                aria-selected={isActive}
                className={`relative px-4 py-3 text-[13px] font-semibold tracking-wide transition-colors duration-150 ${
                  isActive ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {audience.tabLabel}
                {isActive && <span className="absolute inset-x-4 bottom-0 h-[2px] bg-white" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
