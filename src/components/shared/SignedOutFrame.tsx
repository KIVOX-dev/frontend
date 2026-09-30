import type { ReactNode } from "react";
import { PortalLoading } from "@/components/shared/PortalLoading";

// Which UI a portal page shows — sign-in, or the signed-in app — depends on
// the saved session, which exists only in the browser. The pages used to wait
// for the browser before rendering anything, so the HTML the server sent (what
// Google indexes, what a slow load paints first) was an empty page.
//
// Now the server renders the signed-out view: the real sign-in form, with its
// heading and text. That's correct for first-time visitors and for crawlers.
// For a returning, signed-in visitor it would be a flash of the wrong screen,
// so a tiny inline script — plain HTML, runs before first paint, no React
// needed — checks the saved session and, if there is one, swaps the form for
// the loading screen until the app takes over.
//
// `guard` is true only for the pre-hydration render; after that the page has
// the real session and renders the same form, unguarded, in the same place in
// the tree so anything already typed is kept.
const SESSION_KEY = "upscaler-ai-auth"; // authStore.ts's PERSIST_KEY

const GUARD = `
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem("${SESSION_KEY}") || "null");
    if (!saved || !saved.state || !saved.state.isAuthenticated) return;
    var form = document.getElementById("ts-signed-out");
    var loading = document.getElementById("ts-returning");
    if (form) form.style.display = "none";
    if (loading) loading.style.display = "block";
  } catch (e) {}
})();`;

export function SignedOutFrame({ guard, children }: { guard: boolean; children: ReactNode }) {
  return (
    <>
      {/* display: contents keeps the wrapper out of the layout the form was built for. */}
      <div id="ts-signed-out" style={{ display: "contents" }} suppressHydrationWarning>
        {children}
      </div>
      {guard && (
        <>
          <div id="ts-returning" style={{ display: "none" }} suppressHydrationWarning>
            <PortalLoading />
          </div>
          <script dangerouslySetInnerHTML={{ __html: GUARD }} />
        </>
      )}
    </>
  );
}
