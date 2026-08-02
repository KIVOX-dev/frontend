/**
 * Single place that knows how to turn "whatever went wrong" into a string a
 * user can read. Before this existed, roughly a dozen components each
 * hand-rolled their own version of "check .detail, is it an array of {msg}
 * objects or a plain string, else check .message, else fall back" — see git
 * history on CollegeAdminLogin.tsx/RegisterForm.tsx/FacultyUpload.tsx/etc.
 * for what that looked like. Extend the cases *here* when a new error shape
 * shows up; don't re-parse it at the call site.
 *
 * Handles, in order: AbortController cancellation, offline, network
 * failures, timeouts, node-api's {message, detail, details, code} error
 * envelope (see node-api/src/middlewares/errorHandler.js) including
 * FastAPI-shaped `detail` (a validation array of {msg} objects, from the
 * python-service days — still what some older error paths produce), rate
 * limiting (429, surfaces Retry-After when present), oversized uploads, and
 * a last-resort fallback for anything unrecognized.
 */

type AxiosLikeError = {
  name?: string;
  code?: string;
  message?: string;
  config?: { url?: string };
  response?: {
    status?: number;
    headers?: Record<string, string> | { get?: (name: string) => string | null };
    data?: unknown;
  };
};

function isAxiosLike(error: unknown): error is AxiosLikeError {
  return typeof error === "object" && error !== null;
}

function getRetryAfter(headers: unknown): string | null {
  if (!headers || typeof headers !== "object") return null;
  const getter = (headers as { get?: unknown }).get;
  if (typeof getter === "function") {
    return (getter as (name: string) => string | null).call(headers, "retry-after");
  }
  const record = headers as Record<string, string>;
  return record["retry-after"] ?? record["Retry-After"] ?? null;
}

/** FastAPI/pydantic-shaped validation errors: an array of {msg, loc, ...}. */
function isValidationArray(value: unknown): value is Array<{ msg?: string }> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

export function extractErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (!isAxiosLike(error)) {
    return typeof error === "string" && error ? error : fallback;
  }

  // User- or code-initiated cancellation (AbortController, or axios's own
  // request-superseded cancellation) — not really a "failure" to report the
  // same way; callers that care can check `err.name === "CanceledError"`
  // themselves before calling this, but if one doesn't, this is still a
  // sensible, honest message rather than a confusing generic one.
  if (error.name === "CanceledError" || error.code === "ERR_CANCELED" || error.name === "AbortError") {
    return "Request was cancelled.";
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Check your connection and try again.";
  }

  if (error.code === "ECONNABORTED" || error.message?.toLowerCase().includes("timeout")) {
    return "The request timed out. Please try again.";
  }

  if (!error.response) {
    // Axios sets `.request` but no `.response` for a network-level failure
    // (DNS, connection refused, CORS rejection, server unreachable).
    return "Network error — could not reach the server. Please check your connection and try again.";
  }

  const { status, data, headers } = error.response;

  if (status === 429) {
    const retryAfter = getRetryAfter(headers);
    return retryAfter
      ? `Too many requests. Please try again in ${retryAfter} seconds.`
      : "Too many requests. Please wait a moment and try again.";
  }

  if (data && typeof data === "object") {
    const body = data as { message?: unknown; detail?: unknown; details?: unknown; code?: unknown };

    if (body.code === "FILE_TOO_LARGE" || status === 413) {
      return typeof body.message === "string" ? body.message : "File is too large.";
    }

    // `details` (plural — node-api's field-level validation array, see
    // middlewares/validate.js) checked *before* `message`/`detail`: for a
    // VALIDATION_ERROR, node-api's `message`/`detail` are both just the
    // generic "Validation failed" — `details` is where the actually useful
    // per-field text lives. Every other error type leaves `details` unset,
    // so this falls through to `message` unchanged for those.
    if (Array.isArray(body.details) && body.details.length) {
      return body.details.map(String).join(", ");
    }

    if (isValidationArray(body.detail)) {
      const joined = body.detail.map((item) => item.msg).filter(Boolean).join(", ");
      if (joined) return joined;
    } else if (typeof body.detail === "string" && body.detail && body.detail !== body.message) {
      // Skip when `detail` is just a duplicate of `message` (node-api's own
      // errorHandler.js always sets both to the same string) — falls
      // through to the `message` check below instead, one canonical read
      // rather than two branches that happen to agree.
      return body.detail;
    }

    if (typeof body.message === "string" && body.message) return body.message;
  }

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status && status >= 500) return "Something went wrong on our end. Please try again shortly.";

  return error.message || fallback;
}

/** True for a user/code-initiated cancellation — callers that want to
 * silently ignore a cancelled request (rather than show any message at all,
 * e.g. a stale search request superseded by a newer one) check this instead
 * of calling extractErrorMessage. */
export function isCancelledError(error: unknown): boolean {
  if (!isAxiosLike(error)) return false;
  return error.name === "CanceledError" || error.code === "ERR_CANCELED" || error.name === "AbortError";
}
