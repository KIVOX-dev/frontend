"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { onOpenCookieSettings, saveConsent, useConsent, type ConsentChoice } from "@/lib/cookieConsent";

const BTN =
  "h-10 px-4 rounded-lg text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

const CATEGORIES: { key: keyof ConsentChoice | "necessary"; title: string; body: string }[] = [
  {
    key: "necessary",
    title: "Strictly necessary",
    body: "Keep you signed in, remember this choice and run the security check on login forms. Always on.",
  },
  {
    key: "analytics",
    title: "Analytics",
    body: "Anonymous page-view counts (Vercel Web Analytics) that help us see which pages work. No advertising.",
  },
  {
    key: "media",
    title: "Embedded media",
    body: "Plays course videos through YouTube, which sets Google's own cookies. Off means you're asked before a video loads.",
  },
];

/**
 * First-visit cookie notice. Shows on any page, including the portal login
 * screens, until the visitor makes a choice, then stays out of the way;
 * "Cookie settings" links reopen it via openCookieSettings().
 */
export function CookieConsent() {
  const { ready, choice } = useConsent();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<ConsentChoice>({ analytics: false, media: false });
  const titleId = useId();

  useEffect(
    () =>
      onOpenCookieSettings(() => {
        setDraft({ analytics: !!choice?.analytics, media: !!choice?.media });
        setCustom(true);
        setOpen(true);
      }),
    [choice],
  );

  const visible = ready && (open || !choice);
  if (!visible) return null;

  const decide = (c: ConsentChoice) => {
    saveConsent(c);
    setOpen(false);
    setCustom(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-3 z-[90] sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[440px] rounded-xl border border-line bg-paper text-ink shadow-[0_24px_60px_-20px_rgba(17,24,39,.35)] motion-safe:animate-[cc-in_.45s_cubic-bezier(.2,.8,.2,1)_both]"
    >
      <style>{"@keyframes cc-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes cc-wobble{from{opacity:0;transform:scale(.6) rotate(-35deg)}to{opacity:1;transform:none}}"}</style>
      <div className="p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <Image
            src="/images/cookie.jpg"
            alt=""
            width={52}
            height={52}
            className="shrink-0 -mt-1 -ml-1 rounded-full motion-safe:animate-[cc-wobble_.9s_cubic-bezier(.34,1.56,.64,1)_.25s_both]"
          />
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-bold leading-tight">
              {custom ? "Cookie settings" : "Cookies on TalentSnaps"}
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
              We use cookies and browser storage to keep you signed in and the site secure. With your permission we also count
              page views and play course videos from YouTube. Read the{" "}
              <Link href="/cookie-policy" className="font-semibold text-forest underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {custom && (
          <ul className="mt-4 divide-y divide-line-soft rounded-lg border border-line">
            {CATEGORIES.map((c) => {
              const locked = c.key === "necessary";
              const on = locked || draft[c.key as keyof ConsentChoice];
              return (
                <li key={c.key} className="flex items-start gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold">{c.title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{c.body}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={c.title}
                    disabled={locked}
                    onClick={() => setDraft((d) => ({ ...d, [c.key]: !d[c.key as keyof ConsentChoice] }))}
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-forest" : "bg-line-strong"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {custom ? (
            <>
              <button type="button" onClick={() => decide(draft)} className={`${BTN} bg-ink text-white hover:bg-ink-hover`}>
                Save choices
              </button>
              <button type="button" onClick={() => decide({ analytics: true, media: true })} className={`${BTN} border border-ink text-ink hover:bg-paper-sunken`}>
                Accept all
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => decide({ analytics: true, media: true })} className={`${BTN} bg-ink text-white hover:bg-ink-hover`}>
                Accept all
              </button>
              <button type="button" onClick={() => decide({ analytics: false, media: false })} className={`${BTN} border border-ink text-ink hover:bg-paper-sunken`}>
                Essential only
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ analytics: !!choice?.analytics, media: !!choice?.media });
                  setCustom(true);
                }}
                className={`${BTN} text-forest underline-offset-2 hover:underline`}
              >
                Customize
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
