"use client";

import { Analytics } from "@vercel/analytics/next";
import { useConsent } from "@/lib/cookieConsent";

/** Vercel Web Analytics, loaded only once the visitor has allowed analytics. */
export function ConsentedAnalytics() {
  const { ready, choice } = useConsent();
  return ready && choice?.analytics ? <Analytics /> : null;
}
