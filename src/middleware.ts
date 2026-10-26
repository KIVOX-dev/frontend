import { NextResponse, type NextRequest } from "next/server";

// Forwards /api/v1/* to the real API, so the browser only ever talks to this
// site. That makes the login (refresh) cookie first-party: the API is on a
// different site (run.app), and browsers that block third-party cookies were
// dropping it, which logged people out on every reload.
//
// Off unless API_PROXY_TARGET is set at runtime (the API's origin, e.g.
// https://node-api-….run.app), so local dev and existing deployments are
// untouched. Pair it with NEXT_PUBLIC_USE_API_PROXY=true at build time, which
// is what makes the browser call /api/v1 in the first place.
//
// The API sees this server as the caller, not the visitor, so it would rate-
// limit and log everyone under one IP. To avoid that, the visitor's real IP
// (Cloudflare's CF-Connecting-IP, which clients cannot forge) is passed along
// in x-ts-client-ip, vouched for by a shared secret the API checks
// (API_PROXY_SECRET here, FRONTEND_PROXY_SECRET there). Any x-ts-* header a
// client sends itself is discarded first.
export function middleware(request: NextRequest) {
  const target = process.env.API_PROXY_TARGET;
  if (!target) return NextResponse.next();

  const headers = new Headers(request.headers);
  for (const name of Array.from(headers.keys())) {
    if (name.toLowerCase().startsWith("x-ts-")) headers.delete(name);
  }

  const secret = process.env.API_PROXY_SECRET;
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  if (secret && clientIp) {
    headers.set("x-ts-proxy-secret", secret);
    headers.set("x-ts-client-ip", clientIp);
  }

  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(`${pathname}${search}`, target), { request: { headers } });
}

export const config = { matcher: "/api/v1/:path*" };
