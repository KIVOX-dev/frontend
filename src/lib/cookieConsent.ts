"use client";

import { useSyncExternalStore } from "react";

// Cookie / storage consent, kept in this browser's localStorage.
//
// Bump CONSENT_VERSION whenever the Cookie Policy adds a new category or
// changes what an existing one covers: stored choices from an older version
// are ignored, so everyone is asked again.
export const CONSENT_VERSION = 1;
const KEY = "ts_cookie_consent";
const CHANGE = "ts-consent-change";
const OPEN = "ts-open-cookie-settings";

export type ConsentChoice = {
  /** Vercel Web Analytics: anonymous page views. */
  analytics: boolean;
  /** YouTube player in course lessons, which sets Google's own cookies. */
  media: boolean;
};

type Stored = ConsentChoice & { v: number; at: string };

let cache: { raw: string | null; value: Stored | null } = { raw: null, value: null };

function read(): Stored | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  // useSyncExternalStore needs a stable snapshot between changes.
  if (raw === cache.raw) return cache.value;
  let value: Stored | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    value = parsed && parsed.v === CONSENT_VERSION ? parsed : null;
  } catch {
    value = null;
  }
  cache = { raw, value };
  return value;
}

export function saveConsent(choice: ConsentChoice) {
  const stored: Stored = { ...choice, v: CONSENT_VERSION, at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Storage blocked (private mode): the choice holds for this page view only.
    cache = { raw: JSON.stringify(stored), value: stored };
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(CHANGE, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The visitor's current choice, or null if they haven't made one yet.
 * `ready` is false during server render and hydration, when the choice
 * can't be known — render nothing consent-dependent until it's true.
 */
export function useConsent(): { ready: boolean; choice: Stored | null } {
  const choice = useSyncExternalStore(subscribe, read, () => null);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { ready, choice };
}

/** Reopens the preferences panel, e.g. from a "Cookie settings" footer link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenCookieSettings(cb: () => void) {
  window.addEventListener(OPEN, cb);
  return () => window.removeEventListener(OPEN, cb);
}
