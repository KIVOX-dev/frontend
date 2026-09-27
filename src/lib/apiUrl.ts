// Falls back to node-api's own default dev port (see node-api/src/config/env.js
// — PORT defaults to 5000) so a fresh clone works with `npm run dev` and no
// manual .env.local edit. NEXT_PUBLIC_API_URL always wins when set — this
// fallback only ever applies in its absence, so any deployment that already
// sets the env var sees no behavior change at all.
//
// Its own module (re-exported by api.ts) so stores/authStore.ts can reach the
// API without importing api.ts, which imports the store.
export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:5000/api/v1`;
  return "http://localhost:5000/api/v1";
};
