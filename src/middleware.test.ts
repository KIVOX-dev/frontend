// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const req = (headers: Record<string, string> = {}, path = "/api/v1/auth/refresh?x=1") =>
  new NextRequest(`https://www.talentsnaps.com${path}`, { method: "POST", headers });

// NextResponse.rewrite() reports where it forwards to, and the request headers
// it adds, through x-middleware-* response headers.
const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");
const forwarded = (res: Response) => {
  const names = (res.headers.get("x-middleware-override-headers") || "").split(",").filter(Boolean);
  return new Map(names.map((n) => [n, res.headers.get(`x-middleware-request-${n}`) ?? ""]));
};

describe("API proxy middleware", () => {
  afterEach(() => {
    delete process.env.API_PROXY_TARGET;
    delete process.env.API_PROXY_SECRET;
  });

  it("does nothing unless API_PROXY_TARGET is set", () => {
    const res = middleware(req());
    expect(rewriteTarget(res)).toBeNull();
  });

  it("forwards the path and query to the API", () => {
    process.env.API_PROXY_TARGET = "https://node-api.example.run.app";
    expect(rewriteTarget(middleware(req()))).toBe("https://node-api.example.run.app/api/v1/auth/refresh?x=1");
  });

  it("passes the visitor's real IP with the secret, and discards any x-ts-* header the client sent", () => {
    process.env.API_PROXY_TARGET = "https://node-api.example.run.app";
    process.env.API_PROXY_SECRET = "s3cret";
    const h = forwarded(
      middleware(req({ "cf-connecting-ip": "203.0.113.9", "x-ts-client-ip": "6.6.6.6", "x-ts-proxy-secret": "forged" }))
    );
    expect(h.get("x-ts-client-ip")).toBe("203.0.113.9");
    expect(h.get("x-ts-proxy-secret")).toBe("s3cret");
  });

  it("never sends the secret without a real IP to vouch for, or when none is configured", () => {
    process.env.API_PROXY_TARGET = "https://node-api.example.run.app";
    expect(forwarded(middleware(req({ "cf-connecting-ip": "203.0.113.9" }))).has("x-ts-proxy-secret")).toBe(false);
    process.env.API_PROXY_SECRET = "s3cret";
    expect(forwarded(middleware(req())).has("x-ts-proxy-secret")).toBe(false);
  });
});
