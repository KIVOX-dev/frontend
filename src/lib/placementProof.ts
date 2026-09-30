import { api, getApiUrl } from "@/lib/api";
import { toast } from "@/lib/toast";

// Backend serves stored documents (offer letters, admission proofs, score
// cards) through a short-lived signed URL (see backend PROJECT_AUDIT_REPORT.md
// P1-7) instead of a plain public static path. Opening one is a two-step
// flow: fetch a signed URL through the authenticated API, then navigate a
// tab to it — a plain `<a href>` can't point straight at the file.
//
// The blank tab is opened synchronously, before the `await`, and only its
// `.location` is set once the signed URL comes back — opening the tab itself
// *after* an await is what most browsers' popup blockers treat as
// non-user-initiated and block.
//
// Not opened with "noopener": per spec, window.open(..., "noopener") returns
// null even though it opens the tab, so the tab could never be pointed at
// the document and stayed on about:blank. The opener link is cut by hand
// instead, which gives the same protection.
async function openSignedDocument(proofUrlEndpoint: string): Promise<void> {
  const tab = window.open("", "_blank");
  if (tab) {
    tab.opener = null;
    tab.document.title = "Opening document…";
  }

  try {
    const res = await api.get<{ url: string }>(proofUrlEndpoint);
    const origin = getApiUrl().replace(/\/api\/v1\/?$/, "");
    const target = `${origin}${res.data.url}`;

    // The record can outlive its file (uploads from before durable storage
    // went live were lost on redeploy). A quick HEAD lets us say so plainly
    // instead of landing on a tab of raw JSON. Any other outcome — including
    // the check itself failing — just goes ahead and opens the link.
    const missing = await fetch(target, { method: "HEAD" }).then((r) => r.status === 404, () => false);
    if (missing) {
      tab?.close();
      toast.error("This document is no longer available", "The file was lost — ask for it to be uploaded again.");
      return;
    }

    if (tab) {
      tab.location.href = target;
    } else {
      // Popup blocked before we even had the URL — fall back to a direct
      // navigation in the current tab rather than silently doing nothing.
      window.location.href = target;
    }
  } catch (err) {
    tab?.close();
    toast.error(err, "Couldn't open this document");
  }
}

/** Offer letter on a placement record. */
export const openPlacementProofDocument = (recordId: string) => openSignedDocument(`/placement-records/${recordId}/proof-url`);

/** Admission proof or score card on a higher-study / competitive-exam outcome. */
export const openOutcomeProofDocument = (outcomeId: string) => openSignedDocument(`/outcomes/${outcomeId}/proof-url`);
