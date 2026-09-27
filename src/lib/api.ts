import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { getApiUrl } from "@/lib/apiUrl";

export { getApiUrl };

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

import { useAuthStore, LEGACY_REFRESH_TOKEN_KEY } from "@/stores/authStore";
import { isOfflineSession } from "@/lib/sampleAuth";

/* The access token lives only in this tab's Zustand store (memory, never
   localStorage — see authStore.ts). Each tab's store is its own instance, so
   logging into a different account in another tab can't swap the bearer
   token out from under this one. */
const readToken = () => (typeof window === "undefined" ? null : useAuthStore.getState().token);

const isAuthUrl = (url: string) =>
  ["/auth/login", "/auth/register", "/auth/refresh", "/auth/google", "/auth/logout", "/auth/change-initial-password"].some((p) => url.includes(p));

/* A refresh token saved to localStorage before the httpOnly cookie existed.
   Sent once so the server can move it into the cookie, then deleted. */
const takeLegacyRefreshToken = () => {
  try {
    const token = localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    if (token) localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
};

// The `sub` claim of a JWT, without verifying it (the server does that).
const tokenSubject = (token: string) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return String(JSON.parse(atob(part)).sub ?? "");
  } catch {
    return "";
  }
};

/* Access tokens are short-lived, and a reloaded or new tab starts with none.
   The refresh token is in an httpOnly cookie the browser sends to
   /auth/refresh by itself, so this just asks for a new access token.
   Concurrent callers share one request. */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const legacy = takeLegacyRefreshToken();
      const res = await axios.post(`${getApiUrl()}/auth/refresh`, legacy ? { refresh_token: legacy } : {}, { withCredentials: true });
      const access_token: string = res.data.access_token;
      // The refresh cookie is shared by every tab. If another tab has since
      // signed in as someone else, this tab would now be acting as them;
      // reload so it shows who is actually signed in.
      const current = useAuthStore.getState().user;
      if (current?.id != null && tokenSubject(access_token) !== String(current.id)) {
        window.location.reload();
        throw new Error("Signed-in account changed in another tab");
      }
      useAuthStore.setState({ token: access_token });
      return access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Request interceptor — attaches the bearer token for this tab's own session,
// fetching one first when a signed-in tab has none yet (after a reload).
api.interceptors.request.use(
  async (config) => {
    let token = readToken();
    if (!token && useAuthStore.getState().isAuthenticated && !isAuthUrl(config.url ?? "")) {
      // On failure the request goes out without a token and the 401 handler
      // below signs the tab out.
      token = await refreshAccessToken().catch(() => null);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — refreshes an expired access token once before
// clearing the auth store on 401 (login/refresh calls are exempt).
api.interceptors.response.use(
  (response) => {
    // Unwrap node-api envelope if present
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const url: string = error.config?.url ?? "";

    if (error.response?.status === 401 && !isAuthUrl(url)) {
      // The offline session's token is never valid upstream; refreshing or
      // tearing the session down on its 401s would bounce the preview
      // straight back to the login page.
      if (isOfflineSession()) {
        return Promise.reject(error);
      }

      if (!error.config._retriedAfterRefresh && useAuthStore.getState().isAuthenticated) {
        try {
          const newToken = await refreshAccessToken();
          error.config._retriedAfterRefresh = true;
          error.config.headers = { ...error.config.headers, Authorization: `Bearer ${newToken}` };
          return api.request(error.config);
        } catch {
          // Refresh cookie is missing, invalid or expired — fall through to logout.
        }
      }

      clearApiCache();
      useAuthStore.getState().logout();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

/* ══════════════════════════════════════════════════════════════
   GET de-duplication + short-lived cache

   Several screens request the same resource independently — both
   shells hit /auth/me, and /users is fetched by the chat panel,
   the college-admin dashboard and the superadmin dashboard. React
   StrictMode also runs mount effects twice in development, which
   doubles every fetch on mount.

   Wrapping the verb methods means every existing `api.get(...)`
   call site benefits without being rewritten:
     · identical in-flight GETs share one network request
     · successful GETs are reused for CACHE_TTL_MS
     · any write clears the cache, so reads stay correct

   Opt out of the cache for a single call with:
     api.get(url, { cache: false } as ApiRequestConfig)
   ══════════════════════════════════════════════════════════════ */

const CACHE_TTL_MS = 15_000;

export type ApiRequestConfig = AxiosRequestConfig & { cache?: boolean };

type CacheEntry = { at: number; response: AxiosResponse };

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AxiosResponse>>();

/** The key includes the token so one user never reads another's cached data. */
function cacheKey(url: string, config?: ApiRequestConfig): string {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${url}|${params}|${readToken() ?? ""}`;
}

/** Detach cached data so one consumer mutating a list can't corrupt another's. */
function detach<T>(value: T): T {
  try {
    return typeof structuredClone === "function" ? structuredClone(value) : value;
  } catch {
    // Non-cloneable payloads (rare) fall back to the shared reference.
    return value;
  }
}

/** Drop cached GETs. Pass a fragment to clear only matching URLs. */
export function clearApiCache(urlFragment?: string) {
  if (!urlFragment) {
    responseCache.clear();
    return;
  }
  Array.from(responseCache.keys())
    .filter((key) => key.includes(urlFragment))
    .forEach((key) => responseCache.delete(key));
}

const rawGet = api.get.bind(api);
const rawPost = api.post.bind(api);
const rawPut = api.put.bind(api);
const rawPatch = api.patch.bind(api);
const rawDelete = api.delete.bind(api);

api.get = function cachedGet<T = unknown>(
  url: string,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  if (config?.cache === false) {
    return rawGet<T>(url, config);
  }

  const key = cacheKey(url, config);

  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return Promise.resolve({
      ...hit.response,
      data: detach(hit.response.data),
    } as AxiosResponse<T>);
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending.then(
      (shared) => ({ ...shared, data: detach(shared.data) }) as AxiosResponse<T>
    );
  }

  const request = rawGet<T>(url, config)
    .then((response) => {
      responseCache.set(key, { at: Date.now(), response });
      return response;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request as Promise<AxiosResponse>);
  return request;
} as typeof api.get;

/* Writes used to clear the *entire* GET cache — correct, but a write to
   /placements also evicted completely unrelated cached reads (e.g.
   /departments, /institutions/public) that nothing about the write could
   have changed, forcing avoidable refetches across the whole app on every
   single mutation.

   Scoped instead: invalidate only the resource the written URL's first path
   segment names, plus anything in its RESOURCE_GROUPS relation (aliases —
   /jobs and /placements are the same backend resource under two URLs, see
   node-api's routes/index.js — and resources whose derived/joined data a
   write can plausibly change, e.g. posting a placement application can
   change applicant counts shown under /placements and /jobs). Groups are
   deliberately generous (over-invalidating a related resource is a wasted
   refetch; under-invalidating is a stale screen — the former is the safe
   side to err on). Anything not listed still falls back to invalidating
   just its own segment, never nothing. */
const RESOURCE_GROUPS: Record<string, string[]> = {
  jobs: ["jobs", "placements", "placement-applications", "leaderboard"],
  placements: ["jobs", "placements", "placement-applications", "leaderboard"],
  "placement-applications": ["jobs", "placements", "placement-applications", "leaderboard", "dashboard"],
  "placement-records": ["placement-records", "dashboard"],
  users: ["users", "students", "faculty", "hr", "college-admins", "dashboard"],
  students: ["students", "leaderboard", "dashboard", "users"],
  "students/profile": ["students", "students/profile", "leaderboard", "dashboard"],
  tests: ["tests", "test-assignments", "results", "dashboard", "leaderboard"],
  "test-assignments": ["test-assignments", "tests", "results", "dashboard", "leaderboard"],
  results: ["results", "test-assignments", "dashboard", "leaderboard"],
  interviews: ["interviews", "dashboard"],
  batches: ["batches", "students", "dashboard"],
  departments: ["departments", "students", "faculty"],
  institutions: ["institutions", "college-admins", "departments"],
  notifications: ["notifications"],
  profile: ["profile"],
  resume: ["resume"],
};

/** First path segment of a relative API url ("/students/123" -> "students",
 * "/students/profile" -> tries the two-segment form first since that's its
 * own group key above). */
function resourceGroupFor(url: string): string[] {
  const path = url.split("?")[0].replace(/^\/+/, "");
  const segments = path.split("/").filter(Boolean);
  const twoSegmentKey = segments.slice(0, 2).join("/");
  if (RESOURCE_GROUPS[twoSegmentKey]) return RESOURCE_GROUPS[twoSegmentKey];
  const key = segments[0] || "";
  return RESOURCE_GROUPS[key] || (key ? [key] : []);
}

function invalidateForUrl(url: string) {
  const group = resourceGroupFor(url);
  if (group.length === 0) {
    clearApiCache();
    return;
  }
  group.forEach((segment) => clearApiCache(`/${segment}`));
}

function invalidateAfter<T>(promise: Promise<T>, url: string): Promise<T> {
  return promise.then(
    (result) => {
      invalidateForUrl(url);
      return result;
    },
    (error) => {
      invalidateForUrl(url);
      throw error;
    }
  );
}

api.post = function invalidatingPost(this: unknown, ...args: Parameters<typeof rawPost>) {
  return invalidateAfter(rawPost(...args), String(args[0]));
} as typeof api.post;

api.put = function invalidatingPut(this: unknown, ...args: Parameters<typeof rawPut>) {
  return invalidateAfter(rawPut(...args), String(args[0]));
} as typeof api.put;

api.patch = function invalidatingPatch(this: unknown, ...args: Parameters<typeof rawPatch>) {
  return invalidateAfter(rawPatch(...args), String(args[0]));
} as typeof api.patch;

api.delete = function invalidatingDelete(this: unknown, ...args: Parameters<typeof rawDelete>) {
  return invalidateAfter(rawDelete(...args), String(args[0]));
} as typeof api.delete;
