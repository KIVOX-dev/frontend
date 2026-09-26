"use client";

import { openCookieSettings } from "@/lib/cookieConsent";

/** Reopens the cookie notice's settings panel. Styled as a link by default. */
export function CookieSettingsButton({ className, label = "Cookie settings" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={className ?? "font-semibold text-forest underline underline-offset-2 hover:no-underline"}
    >
      {label}
    </button>
  );
}
