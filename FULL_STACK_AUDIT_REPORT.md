# Full-Stack Application Audit — Upscaler Platform

**Date:** 2026-08-10
**Scope:** `Upscaler-frontend` (Next.js 15 / React 19, commit `10b2276`) + `D:\backend` (`node-api` Express 5/MongoDB, commit `63b6760`; `ai-service` FastAPI)
**Method:** Two parallel deep-read agent passes (backend: full route/middleware trace + RBAC/multi-tenant/DB/OWASP review; frontend: full API-call extraction + a11y/perf/new-code review), each citing file:line evidence, cross-checked against each other and against actual test/build/lint execution — not inferred from filenames or documentation.
**Workflow:** Findings verified, safe fixes applied and re-tested immediately, broader/ambiguous items left as recommendations. Nothing destructive was run; no production data was touched — all RBAC/multi-tenant/security testing ran against node-api's existing `mongodb-memory-server`-backed Jest suite, never the real Atlas cluster referenced in `.env.node`.

**Prior art, not re-litigated here:** `PROJECT_AUDIT_REPORT.md` (2026-08-06, scored 66/100) and `D:\backend\SECURITY_AUDIT.md` (2026-08-01, dependency CVEs). A large share of that report's P0/P1 punch list was already fixed in the backend working tree before this audit started (uncommitted, see §0 below) — this audit verified those fixes are real rather than re-deriving them.

---

## 0. Important operational note (read this first)

While this audit was running, **the frontend repo auto-committed and auto-pushed two commits to `origin/main`** (`6a801d5`, `10b2276`) — neither was triggered by an explicit `git commit`/`git push` from this session. No hook is configured in `.claude/settings.json` or `settings.local.json` that would explain it; it's most likely an external auto-commit/auto-sync process running in your editor or environment, independent of this audit. The commits themselves are benign (they capture the pre-existing uncommitted `CollegeAdminDashboard.tsx` change plus this session's `AddStudentPanel.tsx`/`package.json` fixes), but **auto-pushing straight to `main` with no review step is worth knowing about and probably disabling** if unintended — it bypasses the PR-based CI gate your `.github/workflows/ci.yml` is designed around.

Separately: `D:\backend` has a substantial body of **pre-existing uncommitted work** (dashboard-authorization fix, chat security hardening, placement-proof signed URLs, profile validation, batch-student FK fix, AI rate limiting — ~35 modified/new files). This was already in the working tree before this session touched anything; this audit's backend agent independently verified each one is a real, correct fix for the corresponding prior-report finding (§9). It has not been committed. Recommend reviewing and committing it — right now a `git reset --hard` or similar on that machine would silently destroy real, working security fixes.

---

## 1. Executive Summary

The platform's fundamentals are solid: a clean 3-service split (Next.js frontend, Express/MongoDB API, FastAPI AI proxy), a centralized frontend API client with correct auth-header/cache/token-refresh handling, a well-designed CI/CD pipeline (canary deploy, smoke tests, Trivy scanning), and — on the backend — a genuinely comprehensive 21-suite/89-test Jest integration suite that already exercises RBAC, multi-tenant isolation, chat security, and file-upload security.

This audit found **one real, exploitable cross-tenant data-disclosure bug** (SEC-001: `GET /placements`/`GET /jobs` returned every institution's drives to any authenticated user) — now fixed and covered by two new regression tests. It also found and fixed three dependency CVEs that had appeared since the 2026-08-06 report, hardened JWT verification, and closed a missing-index gap. Everything else from the prior audit's P0/P1 list was verified as genuinely already fixed in the (uncommitted) working tree.

The weakest area is the **frontend's total absence of a test suite** (its CI `test` job is a documented placeholder) and a small cluster of frontend reliability gaps: six data loaders in the new institutional dashboard fail silently (indistinguishable from "0 results"), the MNC test module has two latent (not-yet-triggered) correctness edge cases, and the password-reset flow is fully built and tested on the backend but has **no corresponding frontend page at all** — three login screens link to `/forgot-password`, which 404s.

## 2. Architecture Overview

```
Next.js 15 / React 19 frontend  (d:/Upscaler-frontend)
        │  axios client (src/lib/api.ts) — bearer JWT, 15s GET cache, auto-refresh
        ▼
Express 5 API — node-api  (D:/backend/node-api)  ── MongoDB (Atlas)
        │  HMAC-signed shared-secret JWT (60s TTL)
        ▼
FastAPI — ai-service  (D:/backend/ai-service)  ── Groq LLM (optional), Mongo (log-only)
```

- Frontend never calls ai-service directly; node-api is the sole caller, gated by `AI_SERVICE_SHARED_SECRET`.
- Auth: JWT (HS256), 15m access / 7d refresh, `token_version` claim for stateless revocation on password change, bcrypt(12) hashing, Google OAuth via `verifyIdToken`.
- Multi-tenancy: `institution_id` on users/departments/placements/tests/etc.; `super_admin` is the only role exempt from institution scoping.
- Deploy target: Cloud Run via Workload Identity Federation, gated behind Docker build + Trivy scan + container smoke test; currently un-exercised (no GCP secrets configured yet — jobs no-op safely rather than failing).

## 3. Technology Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15.5, React 19.2, TypeScript, Tailwind 4, Zustand, axios, ApexCharts |
| Backend API | Node 24, Express 5.2, MongoDB driver 6.10 (native, no ODM), Joi validation, Jest 30 + Supertest + mongodb-memory-server |
| AI service | Python 3.12/3.14, FastAPI, Pydantic 2, Motor, PyJWT, pytest |
| Infra | Docker, Cloud Run, GitHub Actions, Trivy |

## 4. Frontend Audit

**Confirmed remediated since 2026-08-06** (verified by direct file inspection, not assumed): the 30-file dead-code cluster (`legacyHtml.tsx`, `temp.css`, 8 unused `ui/` primitives, 20 dead `public/` files) is fully gone; 7 unused npm dependencies removed; security headers (CSP/HSTS/X-Frame-Options/Permissions-Policy) added to `next.config.mjs`; keyboard/focus accessibility fixed via a new `useModalA11y.ts` hook applied to all 7 modals plus real `<button>` elements replacing `<div onClick>` across three portal shells; the duplicate concurrent `GET /users/` call in `SuperAdminDashboard.tsx` is gone.

**Still open** (see §26 for full findings): silent fetch-failure states in the new `CollegeAdminDashboard.tsx` (FE-001), two latent correctness edges in `MNCTestModule.tsx`'s question-deduplication logic (FE-003/FE-004), unbounded `?limit=1000` list fetches with no virtualization and only one `React.memo` in the entire codebase (FE-007), 6 unconsolidated duplicate login-form components (FE-008), and the missing `/forgot-password` page (FE-009, elevated — see §26).

**API client** (`src/lib/api.ts`, 84 call sites across 27 files): single axios instance, bearer token auto-attached, `{success,data}` envelope auto-unwrapped, single in-flight token-refresh-and-retry on 401, 15s GET cache keyed by `url|params|token` (correctly scoped per-account — verified no cross-account cache leakage), write-triggered cache invalidation via a `RESOURCE_GROUPS` map. WebSocket auth token passed as a subprotocol (not query string) specifically to keep it out of server access logs — a deliberate, correct choice.

## 5. Backend Audit

Full route inventory in §6. Architecture is layered cleanly (routes → middleware → controllers → services → repositories), with a shared `createCrudController`/`BaseService`/`BaseRepository` stack that centralizes pagination, filtering, and — critically — a `_buildFilter` guard in `BaseRepository` that silently drops any non-primitive filter value, which is the actual mechanism preventing MongoDB operator injection (`?status[$ne]=x`-style attacks) across every entity built on it.

The one place this shared stack was bypassed incorrectly was `PlacementService`, which never overrode `list()` with institution scoping the way six sibling services (`department`, `faculty`, `collegeAdmin`, `student`, `test`, `resumeBuilder`) already do — SEC-001, now fixed to match that established pattern.

## 6. Complete API Inventory (node-api, condensed by resource)

| Resource | Key routes | Auth | Institution scope |
|---|---|---|---|
| Auth | `/register,/login,/google,/refresh` (public); `/me,/change-password` (self) | rate-limited | n/a |
| Users | `GET /`,`/pending`,`/:id` | admin roles | ✅ in `user.service.js#list` |
| Institutions | `/public` (public); CRUD | super_admin (mutations) | n/a (global entity) |
| Departments/Faculty/CollegeAdmins | list/CRUD | admin roles | ✅ per-service `list(queryParams, actor)` override |
| Companies | list/get (any auth'd role); CRUD (super_admin) | mixed | ❌ intentionally global (marketplace) |
| HR | list/get (`super_admin,institution_admin,hr`) | role-gated | ❌ **not scoped** — SEC-005, no `institution_id` column exists |
| Students | `/identify` (public+rate-limited); list/CRUD; sub-resources | mixed | ✅ tenant-scoped + PII-minimized for non-staff |
| **Placements/Jobs** | `/`,`/:id`,`/me`,`/drives`,`/applications/me` | mixed | ✅ **now scoped** (SEC-001 fix — was unscoped) |
| Placement records | list/create/proof-verify | mixed | ✅ scoped; proof docs via signed HMAC URLs, no static auth-free serving |
| Tests/Assessments/Results | list/results/generate-questions | role + AI rate-limited | ✅ two-layer: institution filter + row-level ownership |
| Resume builder | self-service + staff listing | student self / staff | ✅ |
| Notifications/Chat/Leaderboard | authenticated | self-scoped | ✅ (chat: same-institution enforced, payload-size + rate limited) |
| Uploads | `/profile` (public static, image-only, magic-byte checked); `/placement-proof` (signed URL only) | authenticated | ✅ |
| Activity logs | list | super_admin only | n/a |

**ai-service:** `POST /v1/{assessment,interview,resume}/*` — all gated by shared-secret HS256 JWT (`iss=node-api`, `aud=ai-service`, 60s TTL), verified to fail closed and refuse to boot with the default secret in production. `GET /health[/ready]` — unauthenticated, non-sensitive.

## 7. Frontend → Backend API Mapping

84 frontend call sites checked against the route inventory above. **No method/path/contract mismatches found** — every frontend call maps to a real backend route with matching HTTP method, and the response-shape assumptions (`{success,data}` unwrap, array-vs-paginated shapes) match what each controller actually returns. The `/jobs` ↔ `/placements` alias (two URLs, one resource) is explicitly tested (`hr-jobs.test.js`) and the frontend HR portal correctly treats them as equivalent.

One cross-agent finding is worth flagging as **resolved-and-confirmed**: the frontend audit flagged `CollegeAdminDashboard.tsx:479`'s call to `GET /dashboard/student/:id` as concerning because the prior report said that endpoint had no ownership check (FE-002). The backend audit, working independently, confirmed that exact endpoint was already fixed (SEC-002: `canActOnStudent` ownership check + 6 dedicated tests in `dashboardAuthz.test.js`). Both halves of the picture agree: the call is safe today.

## 8. API Contract Mismatches

None found. Response envelope (`{success, data}` on JSON success, structured `ApiError` on failure), pagination shape (`{page, limit, total}` meta), and error status codes are consistent across all resources checked.

## 9. Authentication Audit

JWT via `jsonwebtoken`, required env secrets with no fallback (boot-time failure if unset). Refresh-token rotation via a `token_version` claim bumped on password change/reset — old refresh tokens are provably rejected after a password change, not just client-side discarded. bcrypt cost factor 12. Google OAuth verified via `OAuth2Client.verifyIdToken` with audience pinned, `email_verified` required. Password-reset tokens: 32 random bytes, only the SHA-256 hash stored, 15-minute TTL, generic responses that don't leak account existence.

**Fixed this session (SEC-007):** `jwt.verify()` calls didn't explicitly pin `algorithms: ['HS256']`, relying on the library's implicit default. Not currently exploitable (jsonwebtoken 9.x defaults safely for string secrets), but explicit pinning is now in place as defense-in-depth, matching what ai-service's `security.py` already did correctly.

**Still open (SEC-006, LOW):** new-student accounts created without an explicit password get the literal default `'student123'` (`utils/studentOnboarding.js`), and `must_change_password` is deliberately left false because no frontend flow consumes it. This is a documented product tradeoff, not an oversight, and needs a product decision (build a forced-password-change flow) rather than a silent backend change. This session's frontend fix (§26, FE-005) at least makes the default visible and editable in the single-student-add form instead of invisibly baked in.

## 10. Authorization / RBAC Audit

| Resource | Student | Faculty | HR | Institution Admin | Super Admin |
|---|---:|---:|---:|---:|---:|
| Own profile/dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Other student's dashboard | ✗ | same-institution only | ✗ | same-institution only | ✓ |
| Placements — browse | ✓ (own-inst. + open) | ✓ | ✓ (all — marketplace) | ✓ (own-inst. + open) | ✓ (all) |
| Placements — post | ✗ | ✗ | ✓ | ✓ | ✓ |
| Departments/Faculty admin | ✗ | ✗ | ✗ | ✓ (own institution) | ✓ |
| Institutions CRUD | ✗ | ✗ | ✗ | ✗ | ✓ |
| HR directory | ✗ | ✗ | ✓ (unscoped — SEC-005) | ✓ (unscoped — SEC-005) | ✓ |
| Activity logs | ✗ | ✗ | ✗ | ✗ | ✓ |

Role checks were verified present in code (middleware or service-layer), not assumed from route names. `GET /:id`-style single-record routes were checked separately from list routes per the audit brief, since that's exactly where SEC-001 was hiding (the `:id` route was protected; the list route wasn't).

## 11. Multi-Tenant Security Audit

**SEC-001 (HIGH, FIXED):** `GET /placements` (and its `/jobs` alias) called the generic `BaseService.list()` with no actor, returning every institution's placement drives — company name, salary bands, eligibility criteria, deadlines — to any authenticated student/faculty/admin regardless of institution. The single-record `GET /placements/:id` was correctly scoped; only the list endpoint was missed. No test existed asserting scope on this endpoint before this session.

Fix: `PlacementService.list(queryParams, actor)` now filters to `institution_id ∈ {actor's institution, unset}` for every non-super-admin role — the "unset" branch deliberately preserves visibility of HR/recruiter-posted open jobs (which never carry an institution_id by design), so the fix closes the disclosure without breaking the existing cross-institution job-marketplace feature the HR portal (`hr/page.tsx`'s `fetchAllJobs`) depends on. Route wired to the existing `listWithActor` controller path (the same pattern already used by 6 other entities). Verified with two new integration tests (`hr-jobs.test.js`): a same-institution-only assertion and a super-admin-sees-everything assertion. Full 89-test suite passes.

**SEC-005 (LOW, open):** HR profiles have no `institution_id` at all in their data model — `GET /hr` returns every recruiter account platform-wide to any `institution_admin`. Distinct from companies (`GET /companies`, also unscoped, but explicitly documented as an intentional global marketplace). Exposure is limited to `user_id`/`company_id`/`designation` (no PII beyond an id). Needs a product decision: document as intentional, or add scoping through the `placement_applications` join.

## 12. OWASP Security Audit

- **Injection:** `BaseRepository._buildFilter` rejects any non-primitive filter value before it reaches MongoDB — verified this is the actual mechanism blocking operator injection (`?status[$ne]=x`), not just convention.
- **XSS:** node-api is a pure JSON API, no server-side HTML/markdown rendering. Uploads explicitly exclude SVG from the image allow-list specifically to prevent stored XSS via the static `/uploads/profile` mount.
- **SSRF:** only outbound call is ai-service → Groq, using an env-configured base URL never derived from request input.
- **Path traversal:** upload filenames are always `crypto.randomUUID()`-generated, never client-supplied; `placementProofFiles.routes.js` additionally applies `path.basename()` as defense-in-depth.
- **CORS:** explicit origin allow-list + `credentials: true` on node-api; ai-service closed by default (empty origins — only node-api calls it server-to-server).
- **Security headers:** `helmet()` on node-api defaults; frontend ships CSP/HSTS/X-Frame-Options/Permissions-Policy (verified present in `next.config.mjs`).
- **Rate limiting:** general + auth-specific + AI-proxy (two-tier: per-user and per-institution) + public-kiosk-lookup limiters, all verified wired to their routes. No unprotected AI-proxying route found.
- **Error handling:** global handler never leaks stack traces to clients in any environment; Mongo driver errors are translated to generic messages before reaching the response.
- **Dependency CVEs (found and fixed this session):** `dompurify` 3.4.12→3.4.13 (detached-subtree XSS, via `html2pdf.js`), `nanoid` 3.3.16→3.3.17 (infinite loop on size=0, via `postcss`) in frontend; `js-yaml` 3.15.0→3.15.1 (quadratic CPU DoS, dev-only via `jest`) in node-api. All via `overrides` in `package.json`, matching the existing pattern used for `postcss`/`sharp`. `npm audit`: 0 vulnerabilities in both repos after the fix. `pip-audit` on ai-service: 0 known vulnerabilities (1 pre-documented, justified ignore for a Minerva-timing ECDSA advisory the service never exercises — it only ever signs HS256).

## 13. Database Audit

MongoDB via the native driver, no ODM. Indexes reviewed against actual query patterns in `scripts/setupIndexes.js` — one gap found and fixed this session (SEC-004): `placement_records` was only indexed on `student_id`, but `PlacementRecordService.list()`/`.listForStudent()` filter by `institution_id` for every non-super-admin caller — every institution-scoped fetch was an unindexed collection scan. Index definition added; **must be applied via `npm run db:setup-indexes` against the real database** — this session only updated the script, it did not run it against the production Atlas cluster (out of scope for a code audit, and that script is meant to be run deliberately as part of deploy, not silently by an audit).

## 14. File Upload Audit

Two upload paths, both reviewed: `/uploads/profile` (image-only, magic-byte content verification — not just extension/MIME trust — `crypto.randomUUID()` filenames, served from a narrow static mount, SVG deliberately excluded to prevent stored XSS) and `/uploads/placement-proof` (PDF+image, same verification, **not** statically served — only reachable via short-TTL HMAC-signed URLs, gated behind the same ownership check as other per-record endpoints, covered by 8 dedicated tests in `placementProofSecurity.test.js` including cross-institution and tampered-filename cases). No gaps found.

## 15. WebSocket Audit

Chat over `ws`: token passed as a WS subprotocol (not URL query string) to keep it out of access logs. `MAX_WS_PAYLOAD_BYTES` (16KB) and `MAX_MESSAGE_CONTENT_LENGTH` (4000 chars) caps, per-socket rate limiting, and same-institution assertion before message delivery — all verified present and covered by `chatSecurity.test.js`. No cross-tenant broadcast path found.

## 16. Performance Audit

- **FE-007 (MEDIUM, open):** `CollegeAdminDashboard.tsx` (2,025 lines, 34 `useState`, 40 `.map()` sites) fetches `?limit=1000` on students, placement-records, and placement-applications with no virtualization on the resulting tables; only one `React.memo` exists in the entire frontend codebase.
- **SEC-004 (fixed, pending deploy):** see §13 — missing index would have caused full collection scans on every institution-scoped placement-records fetch.
- No N+1 query patterns found in the routes reviewed; `placementApplicationRepository.countByPlacementIds` uses a single aggregation rather than per-row queries, which is the correct pattern.

## 17. Environment / Secrets Audit

No real `.env`/`.env.local`/`.env.node` files are tracked in git in either repo — verified via `git ls-files`, only `.env.example`/`.env.node.example`/`.env.compose.example` templates are committed, and `.gitignore` in both repos explicitly excludes the real files. Regex sweep of `src/` for API-key/secret/Mongo-URI/hardcoded-password patterns returned exactly one hit, already covered as FE-005 (a literal default password, not a leaked credential). No hardcoded secrets found in either backend service.

## 18. Dependency Audit

| | Before this session | After |
|---|---|---|
| Frontend `npm audit` | 2 (1 moderate `dompurify`, 1 high `nanoid`) | **0** |
| node-api `npm audit` | 1 high (`js-yaml`, dev-only) | **0** |
| ai-service `pip-audit` | 0 known (1 documented ignore) | **0** known (unchanged) |

All three fixes were within-major patch-version bumps of transitive dependencies via `overrides`, matching the existing convention in both `package.json` files. No direct dependency was upgraded; no breaking changes.

## 19. CI/CD Audit

Both pipelines are well-designed: independent lint/test/audit jobs (fail fast, isolated logs), `npm audit --audit-level=high` gating, Docker build → Trivy scan (fails on CRITICAL/HIGH) → **real container smoke test** (boots the actual image, hits `/health`) before any deploy step runs, and a deploy job using Workload Identity Federation (no long-lived keys) with a no-traffic-canary → smoke-test → promote rollout pattern. Deploy jobs currently no-op safely (GCP secrets unset) rather than failing.

**Gap:** the frontend CI `test` job is an explicit placeholder (`echo "::warning::No frontend test suite is configured yet"`) — there is no frontend unit/integration/e2e test framework wired up at all. This is the single biggest testing gap in the whole platform (see §21/§23).

## 20. Smoke Test Results

| Check | Result |
|---|---|
| node-api: full test suite boots, connects to (in-memory) Mongo, runs | ✅ PASS (89/89) |
| ai-service: full test suite boots, runs | ✅ PASS (34/34) |
| Frontend: production build completes | ✅ PASS |
| Frontend: typecheck (`tsc --noEmit`) | ✅ PASS, 0 errors |
| Frontend: lint | ✅ PASS, 2 pre-existing warnings (unrelated `useEffect` deps), 0 errors |
| node-api: lint | ✅ PASS, 0 errors |
| ai-service: lint (ruff) | ✅ PASS, 0 errors |
| Live services against real DB (dev servers up, hitting Atlas) | **NOT PERFORMED** — deliberately: the real `.env.node` `MONGODB_URI` points at a live Atlas cluster, and per audit safety rules this session used the existing `mongodb-memory-server`-backed test suite for all functional/security verification instead of writing test data into a real, possibly-shared database |

## 21. Unit Test Results

node-api: 89 tests across 21 suites (auth, RBAC, dashboard authorization, chat security, placement-proof security, institutions/multi-tenant, pagination, uploads, profile validation, batch students, AI rate limiting, and — new this session — placement institution-scoping). All passing after every fix in this audit, including the SEC-001 fix. ai-service: 34 tests across 5 files (assessment/interview/resume generation, health, and a dedicated `test_security.py` covering missing/garbage/wrong-secret/expired/valid tokens and the production-default-secret rejection). All passing. Frontend: **NOT AVAILABLE** — no test framework configured.

## 22. Integration Test Results

Covered by the same node-api suite above — these are true integration tests (real Express app + real, ephemeral Mongo instance via `mongodb-memory-server`, not mocked). This is what let this audit exercise real RBAC/multi-tenant/auth scenarios without touching production data.

## 23. E2E Test Results

**NOT AVAILABLE.** No Playwright/Cypress/similar harness exists in either repo, and no browser was driven as part of this audit (no dev server was started against a real backend, per the safety reasoning in §20).

## 24. Security Test Results

RBAC and multi-tenant isolation: verified via the existing + newly-added Jest integration tests (`rbac.test.js`, `dashboardAuthz.test.js`, `institutions.test.js`, `collegeAdmins.test.js`, `hr-jobs.test.js`'s new SEC-001 tests) — all passing. JWT/auth edge cases (missing/garbage/expired/wrong-secret tokens): covered on the ai-service side by `test_security.py` (7/7 passing); node-api's equivalent coverage lives in `auth.test.js`. Dependency vulnerability scan: clean (see §18).

## 25. Regression Test Results

Full suite re-run after every fix in this session (SEC-001, SEC-004, SEC-007, dependency overrides, FE-005): node-api 89/89 passing, ai-service 34/34 passing, frontend build/lint/typecheck all clean. No regressions introduced.

## 26. Failed Tests

None — no test failures occurred at any point in this audit. (Frontend has no tests to fail; see §21/§23 for what's not available rather than failing.)

## 27. Fixed Issues

| ID | Severity | Issue | Fix | Verified |
|---|---|---|---|---|
| SEC-001 | HIGH | `GET /placements`/`/jobs` disclosed every institution's drives to any authenticated user | Institution-scoped `list(queryParams, actor)` override + `listWithActor` wiring | 2 new tests + full suite, 89/89 pass |
| — | HIGH/MODERATE | `dompurify` detached-subtree XSS, `nanoid` infinite-loop DoS (frontend) | `overrides` pin to patched versions | `npm audit`: 0 vulns |
| — | HIGH | `js-yaml` quadratic-CPU DoS (node-api, dev-only) | `overrides` pin to patched version | `npm audit`: 0 vulns |
| SEC-004 | MEDIUM | Missing `placement_records.institution_id` index → unindexed scans on every scoped fetch | Added to `scripts/setupIndexes.js` | Script reviewed; **must be run against the real DB by the team** |
| SEC-007 | LOW/INFO | JWT verification didn't explicitly pin `algorithms` | Explicit `{ algorithms: ['HS256'] }` on both verify calls | Full suite, 89/89 pass |
| FE-005 | MEDIUM (security-hygiene) | Single-student-add form silently set password to `"student123"` with zero visibility or way to change it | Added a real, editable "Temporary Password" field, defaulting to the same value but now visible/editable | Build + lint + typecheck clean |

## 28. Remaining Risks

| ID | Severity | Issue | Why not auto-fixed |
|---|---|---|---|
| FE-001 | HIGH | 6 data loaders in `CollegeAdminDashboard.tsx` fail silently — a failed fetch renders identically to "0 results" | Needs a real error-state design decision (toast vs inline banner vs retry), not a one-line fix |
| FE-009 | MEDIUM (elevated) | `/forgot-password` is linked from 3 login pages but the page doesn't exist anywhere in `src/app` — despite the backend having a fully built, tested forgot/reset-password flow | Building a new page + form + error states is a feature, not a safe isolated fix |
| SEC-005 | LOW | HR/company directories have no institution scoping by data-model design | Ambiguous product intent — needs a decision, not a guess |
| SEC-006 | LOW | Server-side default student password (`student123`) has no forced-change flow to pair with it | Same — needs `must_change_password` UX built first |
| FE-003 | MEDIUM | MNC question dedup only checks within one file, not across files in a multi-file company track | No live duplicate today (verified against current data); latent risk only if question banks are edited |
| FE-004 | MEDIUM | MNC question-pool slicing has no bounds check — could silently under-serve or produce a blank screen if demand ever exceeds a file's unique-question count | Same — latent, not currently triggered |
| FE-006 | LOW | Dead `localStorage['upscaler_ai_user']` write, never read back anywhere | Cosmetic cleanup |
| FE-007 | MEDIUM | Unbounded `?limit=1000` list fetches, no virtualization, minimal memoization | Real but broad perf work, not a point fix |
| FE-008 | LOW | 6 duplicate login-form components, unconsolidated | Refactor, carries regression risk without a dedicated pass |
| — | MEDIUM/HIGH (testing) | No frontend test framework at all (CI job is a placeholder) | Framework selection (Vitest/Jest+RTL, Playwright) is a team decision |

## 29. Technical Debt

Six near-identical login-form components (FE-008), the frontend's total lack of tests, and the large uncommitted backend remediation batch (§0) sitting in the working tree are the three biggest debt items. None are urgent individually, but the uncommitted backend work in particular is a real risk (uncommitted = one `git clean`/machine failure from being lost).

## 30. Production Readiness

**READY WITH CONDITIONS.** The core security posture is strong once the uncommitted backend fixes (§0) are committed and this session's SEC-001 fix ships — no other CRITICAL or un-mitigated HIGH findings remain. Before a real production launch: (1) commit the pending backend work, (2) run `npm run db:setup-indexes` against the real database, (3) decide on FE-009 (build the forgot-password page — a live, unreachable account-recovery flow is a real support burden), (4) stand up even a minimal frontend test suite before the next release, (5) confirm the auto-commit/push behavior noted in §0 is intended.

## 31. Final Score

| Dimension | Weight | Score |
|---|---:|---:|
| Architecture | 10% | 78/100 |
| Frontend | 10% | 72/100 |
| Backend | 15% | 80/100 |
| API correctness | 15% | 82/100 |
| Security | 20% | 72/100 |
| Auth/RBAC | 10% | 83/100 |
| Testing | 10% | 60/100 |
| Performance | 5% | 65/100 |
| DevOps/Deployment | 5% | 78/100 |
| **Overall** | | **75 / 100** |

Up from the prior report's 66/100 — driven by the verified prior-report fixes already in the working tree, this session's SEC-001 fix (the one genuinely serious new finding), and closing three dependency CVEs. Held back primarily by the frontend testing gap (§19/§21/§23) and the still-open FE-001/FE-009 reliability gaps.

## 32. Recommended Remediation Roadmap

1. **Now:** commit the pending backend remediation batch (§0) and this session's fixes; run `npm run db:setup-indexes` against production.
2. **This sprint:** build the `/forgot-password` + `/reset-password` frontend pages (backend is ready and tested); add error states to `CollegeAdminDashboard.tsx`'s six silent-failing loaders (FE-001).
3. **Next sprint:** stand up a minimal frontend test framework (start with the highest-risk components — auth forms, `MNCTestModule`); add bounds-checking to the MNC dedup/pool logic (FE-003/FE-004); decide and document the HR/company visibility model (SEC-005).
4. **Backlog:** consolidate the 6 duplicate login forms (FE-008); virtualize the large dashboard tables and add memoization (FE-007); build the forced-password-change flow to pair with SEC-006.
