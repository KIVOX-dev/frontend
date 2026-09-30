// The portal pages (/learner, /institutional, /hr) decide what to show — login
// or dashboard — from the saved session, which only exists in the browser, so
// they can't render that on the server. They used to render `null` until the
// page hydrated, which left a blank white screen for anything that hasn't run
// the JavaScript yet: a slow first load, a Cloud Run cold start, a crawler's
// rendered snapshot. This is what they show instead — the same branded screen
// Next.js uses for route loading (app/loading.tsx), so it's in the server's
// HTML from the first byte.
export { default as PortalLoading } from "@/app/loading";
