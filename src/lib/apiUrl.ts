// Falls back to node-api's own default dev port (see node-api/src/config/env.js
// — PORT defaults to 5000) so a fresh clone works with `npm run dev` and no
// manual .env.local edit. NEXT_PUBLIC_API_URL always wins when set — this
// fallback only ever applies in its absence, so any deployment that already
// sets the env var sees no behavior change at all.
//
// Its own module (re-exported by api.ts) so stores/authStore.ts can reach the
// API without importing api.ts, which imports the store.

// The API's real address (the Cloud Run URL), used for everything that has to
// talk to it directly rather than through this site: the chat WebSocket and
// opening signed document links.
export const getApiDirectUrl = () => {
  if (process.env.NEXT_PUBLIC_API_DIRECT_URL) return process.env.NEXT_PUBLIC_API_DIRECT_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:5000/api/v1`;
  return "http://localhost:5000/api/v1";
};

// Opt-in (NEXT_PUBLIC_USE_API_PROXY=true at build time): in the browser, API
// calls go to this site's own /api/v1, which src/middleware.ts forwards to the
// real API. The browser then only ever talks to www.talentsnaps.com, so the
// login cookie is first-party and survives browsers that block cookies from
// another site (Edge strict tracking prevention, Safari, Firefox). Off by
// default, so nothing changes until a deployment turns it on.
export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_USE_API_PROXY === "true" && typeof window !== "undefined") return "/api/v1";
  return getApiDirectUrl();
};
