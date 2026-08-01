import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000/api/v1`;
  return "http://localhost:8000/api/v1";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const readToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("upscaler_ai_token") || localStorage.getItem("sk_token")
    : null;

const REFRESH_TOKEN_KEY = "upscaler_ai_refresh_token";

const readRefreshToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

// Request interceptor — attaches the 'upscaler_ai_token' bearer token
api.interceptors.request.use(
  (config) => {
    const token = readToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import { useAuthStore } from "@/stores/authStore";
import { isOfflineSession } from "@/lib/sampleAuth";

/* Access tokens expire after 30 minutes (see ACCESS_TOKEN_EXPIRE_MINUTES on the
   backend); without this, any session older than that hit a 401 on its next
   request no matter how routine — "create user" included — and got logged out
   with little explanation. Login/register responses carry a refresh_token
   alongside the access token, so on a 401 we exchange it for a new access
   token and retry the original request once before giving up. */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = readRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");
      const res = await axios.post(`${getApiUrl()}/auth/refresh`, { refresh_token: refreshToken });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("upscaler_ai_token", access_token);
      if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      useAuthStore.setState({ token: access_token });
      return access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Response interceptor — refreshes an expired access token once before
// clearing the auth store on 401 (login/refresh calls are exempt).
api.interceptors.response.use(
  (response) => {
    // Unwrap node-api envelope if present
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      const originalData = response.data;
      response.data = originalData.data;

      const url = response.config?.url ?? "";
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/google")) {
        const refreshToken = response.data?.refresh_token || originalData.refresh_token;
        if (refreshToken && typeof window !== "undefined") {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    } else {
      const url = response.config?.url ?? "";
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/google")) {
        const refreshToken = response.data?.refresh_token;
        if (refreshToken && typeof window !== "undefined") {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    }
    return response;
  },
  async (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // The offline session's token is never valid upstream; refreshing or
      // tearing the session down on its 401s would bounce the preview
      // straight back to the login page.
      if (isOfflineSession()) {
        return Promise.reject(error);
      }

      if (!error.config._retriedAfterRefresh && readRefreshToken()) {
        try {
          const newToken = await refreshAccessToken();
          error.config._retriedAfterRefresh = true;
          error.config.headers = { ...error.config.headers, Authorization: `Bearer ${newToken}` };
          return api.request(error.config);
        } catch {
          // Refresh token is itself invalid/expired — fall through to logout.
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

/* Writes invalidate the whole cache. We can't know which reads a given write
   affects, and a stale list after a create/delete is far worse than a refetch. */
function invalidateAfter<T>(promise: Promise<T>): Promise<T> {
  return promise.then(
    (result) => {
      clearApiCache();
      return result;
    },
    (error) => {
      clearApiCache();
      throw error;
    }
  );
}

api.post = function invalidatingPost(this: unknown, ...args: Parameters<typeof rawPost>) {
  return invalidateAfter(rawPost(...args));
} as typeof api.post;

api.put = function invalidatingPut(this: unknown, ...args: Parameters<typeof rawPut>) {
  return invalidateAfter(rawPut(...args));
} as typeof api.put;

api.patch = function invalidatingPatch(this: unknown, ...args: Parameters<typeof rawPatch>) {
  return invalidateAfter(rawPatch(...args));
} as typeof api.patch;

api.delete = function invalidatingDelete(this: unknown, ...args: Parameters<typeof rawDelete>) {
  return invalidateAfter(rawDelete(...args));
} as typeof api.delete;
