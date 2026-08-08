import { api, getApiUrl } from "@/lib/api";
import { toast } from "@/lib/toast";

// Backend now serves placement-proof documents through a short-lived signed
// URL (see backend PROJECT_AUDIT_REPORT.md P1-7) instead of the plain public
// static path this used to link to directly. Opening one is now a two-step
// flow: fetch a signed URL through the authenticated API, then navigate a
// tab to it — a plain `<a href>` can no longer point straight at the file.
//
// The blank tab is opened synchronously, before the `await`, and only its
// `.location` is set once the signed URL comes back — opening the tab itself
// *after* an await is what most browsers' popup blockers treat as
// non-user-initiated and block.
export async function openPlacementProofDocument(recordId: string): Promise<void> {
  const tab = window.open("", "_blank", "noopener,noreferrer");

  try {
    const res = await api.get<{ url: string }>(`/placement-records/${recordId}/proof-url`);
    const origin = getApiUrl().replace(/\/api\/v1\/?$/, "");
    if (tab) {
      tab.location.href = `${origin}${res.data.url}`;
    } else {
      // Popup blocked before we even had the URL — fall back to a direct
      // navigation in the current tab rather than silently doing nothing.
      window.location.href = `${origin}${res.data.url}`;
    }
  } catch (err) {
    tab?.close();
    toast.error(err, "Couldn't open this document");
  }
}
