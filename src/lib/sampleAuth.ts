/* Sentinel value `isOfflineSession`/`isStale` checks the stored token against
   (see api.ts, superadmin/page.tsx). Nothing in the current codebase actually
   sets a session to this value anymore — the login flow that used to do so
   was removed — so this detection is currently inert. Left in place since
   removing it is a dead-code cleanup, not a security fix; harmless either way
   since it's not a real credential. */

export const OFFLINE_TOKEN = "sample-super-admin-token";

export const isOfflineSession = () =>
  typeof window !== "undefined" &&
  localStorage.getItem("upscaler_ai_token") === OFFLINE_TOKEN;
