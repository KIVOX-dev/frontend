import Loading from "@/app/loading";

// The portal pages (/learner, /institutional, /hr) decide what to show — login
// or dashboard — from the saved session, which only exists in the browser, so
// they can't render that on the server. They used to render `null` until the
// page hydrated, which left a blank white screen for anything that hasn't run
// the JavaScript yet: a slow first load, a Cloud Run cold start, a crawler's
// rendered snapshot. This is what they show instead — the same branded screen
// Next.js uses for route loading (app/loading.tsx), so it's in the server's
// HTML from the first byte.
//
// It also covers the case where the JavaScript never runs at all (a script
// file blocked, stale or cached as an error, an extension interfering): with
// nothing to swap this screen out, it would sit there forever looking like a
// hang. The inline script below is plain HTML the server sends, so it works
// with no React at all — after 12 seconds, if this screen is still showing,
// it says so and offers a reload. On a healthy load the page hydrates long
// before then and this whole component is removed, script and notice included.
const STUCK_NOTICE = `
<div id="ts-stuck" style="display:none;position:fixed;left:0;right:0;bottom:12%;z-index:301;text-align:center;padding:0 24px;font:14px/1.5 system-ui,sans-serif;color:#374151">
  <p style="margin:0 0 12px">This is taking longer than usual.</p>
  <button type="button" onclick="location.reload()" style="height:40px;padding:0 18px;border:0;border-radius:8px;background:#111827;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer">Reload page</button>
  <p style="margin:12px auto 0;max-width:420px;font-size:12px;color:#6b7280">Still stuck? Try a private window, or clear this site's data (lock icon in the address bar → Site settings → Clear data).</p>
</div>
<script>
  setTimeout(function () {
    var notice = document.getElementById("ts-stuck");
    if (notice && document.querySelector(".ts-loading")) notice.style.display = "block";
  }, 12000);
</script>`;

export function PortalLoading() {
  return (
    <>
      <Loading />
      <div dangerouslySetInnerHTML={{ __html: STUCK_NOTICE }} />
    </>
  );
}
