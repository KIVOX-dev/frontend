# Project Audit Report — Upscaler Platform

**Date:** 2026-08-06
**Scope:** `Upscaler-frontend` (Next.js 15 / React 19) + `backend` (`node-api` Express/MongoDB, `ai-service` FastAPI)
**Workflow:** Report-first. **No code has been changed as part of this audit.** Every finding below is pending your review; nothing is deleted, refactored, or upgraded until you greenlight it.
**Method:** Four parallel research passes (frontend structure/dead-code, frontend API/state/performance/a11y, backend architecture/security/database, dependency/build/CI/code-quality), each verifying claims against actual source (import-path greps, `git log`, `npm audit`, `tsc --noEmit`, `eslint`) rather than inferring from filenames.

Prior art: `D:\backend\SECURITY_AUDIT.md` (2026-08-01) already remediated a dependency-CVE pass and deleted a dead `python-service`. This report does not re-litigate that ground — see §9.0 for what's still open from it.

---

## 1. Scorecard

| Dimension | Score |
|---|---|
| **Overall** | **66 / 100** |
| Architecture | 68 / 100 |
| Security | 61 / 100 |
| Performance | 65 / 100 |
| Maintainability | 70 / 100 |
| Code Quality | 92 / 100 |
| Accessibility | 45 / 100 |
| API Efficiency | 72 / 100 |
| Frontend | 68 / 100 |
| Backend | 66 / 100 |
| Database | 70 / 100 |
| DevOps Readiness | 58 / 100 |
| Production Readiness | 60 / 100 |

**Reading the score:** the codebase's fundamentals are unusually clean for its size — 0 TypeScript errors, 2 ESLint warnings total, 0 dependency vulnerabilities, 0 TODO markers, disciplined error handling and logging. What pulls the average down is concentrated, not diffuse: one real authorization bug, systemic keyboard/screen-reader inaccessibility across all three portal shells, a coherent cluster of legacy dead code, and a complete absence of CI on the frontend. This is a codebase that's easy to bring to production-ready — the problems are countable, not pervasive.

---

## 2. Statistics

| Metric | Value |
|---|---|
| Total files scanned | ~430 (112 frontend `src/`, 32 `public/`, 225 `node-api/src/`, 42 `ai-service/app/`, plus root configs) |
| Total lines of application code | ~28,600 (18,156 frontend TS/TSX + 9,732 node-api JS + 758 ai-service Python) |
| Duplicate files found | 5 (4 diverged CSS pairs + 1 byte-identical PNG pair) |
| Duplicate components | 6 (near-identical login forms) |
| Duplicate/redundant API calls | 2 confirmed instances |
| Dead files identified for removal | 30 (pending approval — see §4) |
| Dead code removed | 0 — report phase |
| Unused assets identified | 20 (`public/` legacy monolith remnants) |
| Public folder files flagged for removal | 20 of 32 |
| Security issues identified | 1 critical, 6 high/medium (see §8) |
| Performance issues identified | 5 (see §7) |
| Bugs identified | 4 (1 already caused a prior production crash) |
| Build errors | 0 |
| TypeScript errors | 0 |
| ESLint warnings | 2 |
| Unused dependencies identified | 7 (frontend) |
| Dependencies with available updates | ~20 (none urgent — 0 vulnerabilities in either repo) |

Every "removed/fixed" count above is 0 because you chose the report-first workflow — this table is the punch list, not a changelog.

---

## 3. Priority Action List

### P0 — Fix before next deploy

| # | Finding | Location |
|---|---|---|
| 1 | **Broken object-level authorization.** `GET /api/v1/dashboard/student/:studentId` has no role/ownership check and never receives `req.user` — any authenticated user, any role, any institution, can view any other student's test scores, interview completion, and placement-record counts just by knowing their ID. | `node-api/src/routes/dashboard.routes.js:10`, `dashboard.controller.js:5-10`, `dashboard.service.js:17-19` |
| 2 | **Unverified credential rotation carried over from the prior audit.** `SECURITY_AUDIT.md` (2026-08-01) flagged a hardcoded MongoDB Atlas password recoverable from git history as still needing rotation — confirm this actually happened. | git history (deleted `python-service/seed_mongo.py`) |

### P1 — High priority

| # | Finding | Location |
|---|---|---|
| 3 | `crudControllerFactory`'s `list` verb doesn't pass `req.user`, unlike `getById`/`update`/`remove`. Already caused one production crash (documented in the code); 7 of 11 controllers using the factory hand-patch around it instead of the factory being fixed. | `node-api/src/controllers/crudControllerFactory.js:10-13` |
| 4 | `profile.routes.js` `POST`/`PUT` accept an arbitrary `values` object with no server-side Joi validation — comment concedes the schema is "a client-rendering contract only." | `node-api/src/routes/profile.routes.js:18-19` |
| 5 | No dedicated rate limit on 6 endpoints that proxy to the paid, metered Groq API — only the generic global limiter applies. A code comment in the service already flags this exact risk. | `ai.routes.js:10`, `resumeBuilder.routes.js:23-30`, `interview.routes.js:13`, `test.routes.js:19-24` |
| 6 | `batch_students.student_id` stores `users._id` instead of `students._id`, breaking the join convention every sibling collection follows. Latent (nothing reads it back yet) but will break the first feature that does. | `node-api/src/services/batch.service.js:36` |
| 7 | Placement-proof documents (salary/employer/personal detail PDFs) are served via a static file mount with zero auth — protected only by unguessable UUID filenames. | `node-api/src/app.js:57` |
| 8 | WebSocket chat accepts any `receiver_id` from client input with no relationship/institution check, and sets no `maxPayload` or content length cap. | `node-api/src/websocket/chatServer.js:123-134` |
| 9 | Primary navigation, mobile menu toggle, and logout in **all three** portal shells are unfocusable `<div onClick>` — keyboard-only users cannot operate the logged-in app at all. | `components/layout/{Learner,Hr,CollegeAdmin}Shell.tsx` |
| 10 | Entry point into a timed assessment is mouse-only (`<div onClick>`), inconsistent with the quiz-answer buttons later in the same file which correctly use `<button>`. | `components/learner/MNCTestModule.tsx:391-398` |
| 11 | Frontend repository has **no CI/CD at all** — no `.github` directory, versus a comprehensive lint/test/audit/Trivy-scan/smoke-test pipeline in the backend. Nothing currently enforces the lint/type/build cleanliness this repo has today on future PRs. | repo root |
| 12 | Auth identity (token, user object) is duplicated across 3+ localStorage keys plus the Zustand persist blob; `updateUser()` only updates the Zustand copy, so a profile edit leaves the raw `upscaler_ai_user` key stale. | `stores/authStore.ts:38-53` |

### P2 — Medium priority

| # | Finding | Location |
|---|---|---|
| 13 | Duplicate concurrent `GET /users/` fires when `SuperAdminDashboard` loads the "all" tab — both calls pass `cache:false`, which bypasses the app's own request-dedup layer. | `components/superadmin/SuperAdminDashboard.tsx:195-289` |
| 14 | `gsap`/`ScrollTrigger` and `framer-motion` (14 components) are statically imported into the homepage's initial bundle — the highest-traffic route — while every other heavy library in the app (`apexcharts`, `xlsx`, `html2pdf.js`) is correctly lazy-loaded. | `components/landing/SmoothScroll.tsx` + `app/page.tsx` |
| 15 | Only one component in the entire codebase uses `React.memo`. Large tables in `CollegeAdminDashboard.tsx` (41 `.map()` sites) and `PlacementDashboard.tsx` (39 `.map()` sites) fully re-render on any unrelated state change. | `components/superadmin/SuperAdminDashboard.tsx:74-155` is the sole example |
| 16 | No virtualization anywhere despite `?limit=1000` fetches feeding the Students/Placements tables. | `CollegeAdminDashboard.tsx:465,491` |
| 17 | Hand-rolled modals lack `role="dialog"`, `aria-modal`, Escape-to-close, and focus trapping — despite an accessible `Modal.tsx` (Radix-based, gives all of this for free) already existing in the codebase and going almost unused. | `institutional/StudentTracking.tsx:144-227`, `CollegeAdminDashboard.tsx` modals |
| 18 | Broken link: `/forgot-password` is referenced in three login components; the route doesn't exist anywhere in `app/`. | `CollegeAdminLogin.tsx:171`, `FacultyLogin.tsx:98`, `SuperAdminLogin.tsx:86` |
| 19 | Coherent dead-code cluster from a pre-Next.js "monolith" frontend that was never fully decommissioned: `lib/legacyHtml.tsx` (0 importers, points at a `../../frontend/` directory that doesn't exist), 8 of 16 `components/ui/` primitives (`Dropdown`, `EmptyState`, `Loader`, `Modal`, `Navbar`, `Pagination`, `Sidebar`, `Skeleton` — all 0 importers), 20 orphaned files in `public/` reachable only through `legacyHtml.tsx`, and `temp.css` at repo root (83KB of committed Tailwind build output, tracked in git, referenced nowhere). | see §4 for full file list |
| 20 | Four CSS files exist in both `public/` and `src/styles/` with drifted content (same origin, edited independently since) — `src/styles/` is the live, imported, newer version in every case. | `legacy-portal.css`/`styles.css`, `legacy-settings.css`/`settings_v3.css`, `theme-refined.css` (both locations), `legacy-landing.css`/`landing.css` |
| 21 | 7 unused npm dependencies in the frontend (`react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `@tanstack/react-query`, `@radix-ui/react-accordion`, `@radix-ui/react-label`) — ~25MB of dead `node_modules` weight. Notably, `@tanstack/react-query` is fully installed and 100% unused, while the app hand-rolls its own request cache/dedup/invalidation layer in `lib/api.ts` instead. | `package.json` |
| 22 | Access and refresh tokens are stored in `localStorage`, readable by any script on the page — standard XSS-to-session-hijack exposure. Architectural (would need httpOnly cookies + backend changes), not an oversight; flagged for completeness. | `lib/api.ts:71-72`, `stores/authStore.ts:40-41` |
| 23 | The Next.js app ships no security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) — no `headers()` in `next.config.mjs`, and nothing in front of it (nginx/compose) adds them either. | `next.config.mjs` |
| 24 | Three coexisting API response envelope shapes (`ApiResponse.ok`, `ApiResponse.okDoubleWrapped`, and a fully hand-rolled shape in `auth.controller.js`) — each documented as deliberate frontend-migration debt, but still three contracts a new endpoint could copy the wrong one from. | `node-api/src/utils/ApiResponse.js`, `controllers/auth.controller.js:65` |
| 25 | 6 hand-rolled CRUD controllers (`batch`, `notification`, `placementApplication`, `result`, `testAssignment`, `user`) duplicate what `crudControllerFactory` already produces, despite no functional reason to opt out — ~150 lines of avoidable duplication. | `node-api/src/controllers/` |
| 26 | `interview_responses` is the only collection with an FK-like field (`attempt_id`) and zero indexes. | `node-api/scripts/setupIndexes.js` |
| 27 | Two dead Python scripts (`generate_mcq.py`, `test.py` — hardcoded Windows paths, calls to a local Ollama instance) plus an unreferenced 543-line `questions.json` ship into the production Docker image with zero runtime purpose. | `node-api/src/mcq_data/` |
| 28 | Default student password (`'student123'`) with `must_change_password` deliberately left `false` — a low-effort account-takeover path for any account that hasn't logged in yet. Documented as intentional; needs a product decision, not a silent fix. | `node-api/src/utils/studentOnboarding.js:28` |
| 29 | `CollegeAdminDashboard.tsx` is a 2,181-line god component with 57 `useState` calls, owning user management, assessments, placement drives, department admin, and Excel/PDF export all in one file. | `components/institutional/CollegeAdminDashboard.tsx` |
| 30 | 6 near-identical login-form components repeat the same user-object-mapping and error-message-normalization logic verbatim. | `components/auth/*.tsx`, `components/hr/HrLogin.tsx`, `components/learner/LearnerLogin.tsx` |

### P3 — Low priority / housekeeping

| # | Finding |
|---|---|
| 31 | Two full icon libraries shipped side by side (`lucide-react` + `@phosphor-icons/react`, ~60MB combined in `node_modules`), cleanly split by app-vs-marketing-site but worth consolidating. |
| 32 | Three animation-related libraries (`framer-motion`, `gsap`, `lenis`) — `gsap` is used in exactly one file and could likely move to `framer-motion`. |
| 33 | `D:\backend\package-lock.json` is an empty stub with no corresponding `package.json` — harmless, dead weight. |
| 34 | `ai-service`'s local `.venv` has stale packages (`python-jose`, `ecdsa`, `rsa`) not present in the lockfile — doesn't affect the shipped image, but risks dev/prod drift confusion. |
| 35 | Minor acronym-casing inconsistency (`HRShowcase.tsx` vs `HrLogin.tsx`/`HrShell.tsx`). |
| 36 | Stale comment in `batchStudent.model.js` describing an index as a future follow-up when it already exists in `setupIndexes.js`. |
| 37 | `hr.controller.js`/`company.controller.js` list endpoints aren't institution-scoped — verify this is intentional (HR may key off company, not institution). |
| 38 | `/register` and `/superadmin` routes exist but have zero in-app links pointing to them — verify this is intentional (direct-URL-only entry points). |
| 39 | Chat contact list (`PlatformChat.tsx:233-235`) is also mouse-only — same class of issue as #10/#9. |
| 40 | All portal shells switch "screens" via client-side Zustand state rather than real routes — no deep-linking, no back-button support, all screen chrome ships behind one route. A real architecture trade-off worth a deliberate decision, not a drive-by fix. |

---

## 4. Detailed Findings by Category

### 4.1 Duplicate Code
- **CSS duplication (§ P2-20):** `public/styles.css` / `src/styles/legacy-portal.css` (7,117 lines each, diverged), `public/settings_v3.css` / `src/styles/legacy-settings.css` (374 lines, ~750-line diff), `public/theme-refined.css` / `src/styles/theme-refined.css` (527 lines, 175-line diff — the `src` copy has newer bug-fix comments the `public` copy never received), `public/landing.css` / `src/styles/legacy-landing.css` (both unused today, but the `src` copy is the more recent edit).
- **Login forms (§ P2-30):** 6 components repeat identical `useState`(email/password/error/loading) + `handleLogin` + user-field-mapping (`id: user._id || user.id, college_id: user.college_id || user.collegeId, ...`) patterns. Recommend extracting a shared `<AuthLoginForm>` + `mapAuthUser()` helper rather than deleting any — each has genuine per-role differences (sign-up tab, DOB-password field naming).
- **Landing "showcase" components are NOT duplicates** — `AdminShowcase`/`FacultyShowcase`/`HRShowcase`/`StudentShowcase` already share `ShowcaseFrame`/`ShowcaseStatCard`/`ShowcaseBarChart`; flagged only to rule out as a false positive.
- **Favicon pipeline:** `src/app/icon.png` and `public/icon-512.png` are byte-identical outputs of an uncommitted image pipeline (`src/assets/logos/_processed/`, untracked in git). Recommend committing the generation script or relocating the ~15MB raw-source logo folder out of `src/` entirely.

### 4.2 Dead Code (confirmed via import-path grep, not filename inference)
**Safe to remove pending your review:**
- `src/lib/legacyHtml.tsx` — 0 importers; reads from a `../../frontend/` directory that doesn't exist in this repo.
- `src/components/ui/{Dropdown,EmptyState,Loader,Modal,Navbar,Pagination,Sidebar,Skeleton}.tsx` — 8 of 16 UI-kit primitives, 0 importers each.
- `temp.css` (repo root) — 82,961 bytes of raw Tailwind build output, tracked in git, referenced nowhere.
- 20 files in `public/` — see §4.3.

**Needs manual verification (designed-but-unused API surface, not obviously dead):**
- `isCancelledError` (`lib/errors.ts:130`) — documented for callers who want to special-case cancellation; no current caller does.
- `toast.resolve`/`toast.loading` (`lib/toast.ts:67-71`) — part of a designed loading→resolve toast flow; every current call site uses `toast.success/error/warning/info` directly instead.

### 4.3 Public Folder Audit
32 files total. **Legitimate, keep (8):** `icon-192.png`/`icon-512.png` (referenced in `manifest.ts`), `logos/{bar-logo,brand-logo,logo-mark,primary-logo}.png` (referenced in `Logo.tsx`), 4 MCQ JSON files actively fetched by `MNCTestModule.tsx`.

**Dead, recommend removal (20):** `core.js`, `data.js`, `extract.js`, `extract_and_inject.js`, `hr.js`, `inject.js`, `institutional-admin.js`, `institutional-core.js`, `institutional-faculty.js`, `institutional-student.js`, `learner.js`, `qbank.js`, `split_js.js`, `extracted_styles.css`, `landing.css`, `styles.css`, `settings_v3.css`, `theme-refined.css`, `beginner.jpeg`, `expert.jpeg`, `proficientjpeg.jpeg`, `berth_sample.json` — all remnants of the pre-Next.js monolith, reachable only through the also-dead `legacyHtml.tsx`. Four of `extract.js`/`extract_and_inject.js`/`inject.js`/`split_js.js` are actually Node build/migration scripts that would be served as static downloads if ever linked — they can never execute from `public/`.

### 4.4 Routing Audit
- No structural route duplicates or conflicts. App Router maps 1:1 to `/`, `/faculty`, `/hr`, `/institutional`, `/learner`, `/register`, `/superadmin`.
- Broken link: `/forgot-password` (see P2-18).
- `/register` and `/superadmin` have no in-app links pointing to them (see P3-38) — likely intentional direct-URL entry points, worth confirming.
- Architectural note (P3-40): all four portal shells render dozens of "screens" via a client-side Zustand `activeScreen` switch rather than real sub-routes — no deep-linking, no back-button navigation between screens, though `next/dynamic` is used for code-splitting within that model.

### 4.5 Component Audit
Components over 300 lines, ranked by complexity signal (`useState` count):

| File | Lines | `useState` |
|---|---|---|
| `institutional/CollegeAdminDashboard.tsx` | 2,181 | 57 |
| `learner/ResumeBuilder.tsx` | 1,680 | 23 |
| `superadmin/SuperAdminDashboard.tsx` | 1,044 | 21 |
| `app/hr/page.tsx` | 644 | 17 |
| `institutional/PlacementDashboard.tsx` | 844 | 3 |
| `learner/PracticeModule.tsx` | 466 | 14 |
| `shared/SettingsPanel.tsx` | 444 | 14 |
| `learner/MNCTestModule.tsx` | 425 | 11 |
| `learner/PlacementOpportunities.tsx` | 414 | 12 |
| `learner/AptitudeTests.tsx` | 407 | 10 |
| `learner/LearnerMockInterview.tsx` | 387 | 13 |

`app/hr/page.tsx` is also the one route file carrying real business logic directly (job-posting form state, leaderboard normalization) instead of delegating to `components/hr/`, unlike every other role. Prop drilling is not a significant issue elsewhere — `useAuthStore`/`useUiStore` handle cross-cutting state consistently.

### 4.6 State Management Audit
- Auth identity duplicated across the Zustand-persist blob plus 3 raw localStorage keys (`upscaler_ai_token`, `upscaler_ai_user`, `upscaler_ai_refresh_token`) — see P1-12.
- No react-query vs. Zustand duplication exists today (react-query is unused, see P2-21) — but the hand-rolled equivalent (axios-level cache `Map` + per-component `useState` copies) has the same class of "two caches that can disagree" risk react-query's single source of truth would eliminate.
- No unused Zustand slices found in `authStore` or `uiStore`. `uiStore` is a single global slice shared by every portal shell with no reset-on-route-change — worth confirming that screen-id namespaces (e.g. `"chat"`) don't collide across portals in the same tab.

### 4.7 Performance
- gsap/ScrollTrigger + framer-motion eagerly bundled into the homepage (P2-14) — everything else heavy in the app (`apexcharts`, `xlsx`, `html2pdf.js`) is correctly lazy-loaded via `dynamic()`/`await import()`.
- Only one `React.memo` in the codebase (P2-15).
- No virtualization despite `?limit=1000` fetches (P2-16) — verify real expected row counts before prioritizing.
- Image handling is clean: no raw `<img>` tags anywhere, all through `next/image` with meaningful `alt` text. The ~15MB of raw source logos in `src/assets/logos/` are untracked and not imported by any code, so they aren't shipped today — just clutter.

### 4.8 Accessibility
This is the audit's weakest area (45/100) and its findings cluster tightly:
- Primary nav, mobile-menu toggle, and logout in all 3 portal shells are unfocusable `<div onClick>` (P1-9).
- Test-track selection (P1-10) and chat contact list (P3-39) are mouse-only.
- Hand-rolled modals lack `role="dialog"`/`aria-modal`/Escape/focus-trap (P2-17) despite an accessible `Modal.tsx` primitive sitting unused in the same codebase.
- `aria-*` attributes appear in only 14 of ~99 `.tsx` files, concentrated in `components/ui/*` (which the large dashboards don't use) and the landing page.
- **What's already right:** `next/image`'s required `alt` prop means no missing alt text anywhere; `RegisterForm.tsx` has proper `<label>`/`htmlFor` pairing on all 5 inputs; `Modal.tsx`/`Dropdown.tsx` (the underused primitives) are themselves genuinely accessible Radix wrappers — the gap is adoption, not the primitives.

### 4.9 Security

**0. Carried forward from `SECURITY_AUDIT.md` (2026-08-01) — do not re-remediate, only verify:**
- All npm/pip dependency CVEs from that audit were fixed (`npm audit`/`pip-audit` both reconfirmed at 0 in this pass).
- The old `python-service` (replaced by the current `ai-service`) was already deleted.
- **Still open per that audit:** confirm the hardcoded MongoDB Atlas credential (in the now-deleted `python-service/seed_mongo.py`, recoverable from git history) has actually been rotated — this is P0-2 above.

**Backend (new findings this pass):**
- Broken object-level authorization on the student dashboard endpoint — P0-1, the single most serious finding in this audit.
- Placement-proof documents served with no auth, obscurity-only protection (P1-7).
- WebSocket chat accepts unvalidated `receiver_id`, no payload cap (P1-8).
- Default predictable student password with forced-change disabled (P2-28) — a documented product tradeoff, flagged for a deliberate decision.
- **Confirmed clean:** no NoSQL injection (whitelist+primitive guard in `BaseRepository._buildFilter`, regex inputs escaped), no command injection (zero `child_process`/`exec` usage), no prototype pollution, no hardcoded secrets, sound JWT design (required env vars, no fallback defaults, sane expiry, `token_version` revocation), upload handling verifies magic bytes and uses `crypto.randomUUID()` filenames (no path traversal), ai-service↔node-api bridge uses short-TTL signed JWTs with fail-closed boot behavior.

**Frontend (new findings this pass):**
- Access + refresh tokens in `localStorage` (P2-22) — architectural, cross-team fix.
- No security headers on the Next.js app's own responses (P2-23).
- `dangerouslySetInnerHTML` used in 2 places: `legacyHtml.tsx` (dead code, see §4.2) and a fully static, hardcoded print-CSS string in `ResumeBuilder.tsx:1651` (not a vulnerability, just non-idiomatic).
- `ResumeBuilder.tsx`'s HTML export reads `element.innerHTML` into a downloaded file — self-XSS only (a user's own script tags in their own resume would only execute if they open their own downloaded file), not a cross-user vector.
- **Confirmed clean:** no hardcoded secrets/API keys anywhere in `src/`, `.env.local` is empty/gitignored and `.env.example` holds only placeholders, no open-redirect patterns (all 3 `window.location` assignments are hardcoded literals).

### 4.10 Backend Architecture
- `crudControllerFactory` actor-passing bug (P1-3) and its 7 downstream hand-patches.
- 6 duplicate hand-rolled CRUD controllers (P2-25).
- Three coexisting response envelope shapes (P2-24).
- Missing validation on `profile.routes.js` (P1-4) — the one real gap in otherwise-complete Joi coverage across all 24 route files.
- No dedicated rate limiting on AI-proxying endpoints (P1-5).
- Stray dev artifacts shipped into the production image (P2-27).
- **Confirmed clean:** zero empty catch blocks, zero raw unhandled throws in request paths, 100% `asyncHandler` usage, zero `console.log` in production source (all logging goes through Winston), zero TODO/FIXME/HACK markers, no commented-out code.

### 4.11 Database Audit (MongoDB, native driver, no ODM)
- `interview_responses` has zero indexes (P2-26).
- `batch_students.student_id` stores the wrong entity's ID (P1-6).
- No soft-delete anywhere (hard `deleteOne` only) and no automatic institution/tenant scoping at the repository layer — every service is individually responsible for adding `institution_id` filters (spot-checked as correct in `batch.service.js`; not exhaustively verified across all ~20 services).
- Validation exists only at the Joi/controller layer — models are just `{tableName, columns, defaults}` with no schema enforcement, so a gap in any one Joi schema reaches Mongo unguarded.
- **Confirmed clean/strong:** `BaseRepository._buildFilter` whitelists both field names and value types — real, working protection against Mongo operator injection. IDs are uniform app-generated UUID strings. `placements`/`placement_applications`/`placement_records` and `batches`/`batch_students` are genuinely distinct concepts, not accidental duplicates.

### 4.12 Dependency Audit
- Frontend: 7 unused packages (P2-21), ~25MB dead weight. `npm audit`: 0 vulnerabilities.
- node-api: every declared dependency is used; `npm audit`: 0 vulnerabilities.
- ai-service: every declared dependency is used (`uvicorn`/`python-dotenv`/`pymongo` "0 direct imports" are false positives — process entrypoint, transitive settings-loader, and `motor`'s own transitive respectively). `pip-audit`: 0 vulnerabilities (one documented, justified ignore rule for a non-applicable ECDSA timing CVE).
- Overlapping libraries: two icon sets (P3-31), three animation libs (P3-32).
- Root-level empty `package-lock.json` stub in `backend/` with no corresponding `package.json` (P3-33).
- `ai-service`'s local dev `.venv` has stale untracked packages not in the lockfile (P3-34) — doesn't affect the shipped image.
- No version conflicts (single React resolution tree confirmed in the frontend lockfile).

### 4.13 Build & CI/CD Audit
- `next.config.mjs`: `output: standalone` correct, `images.remotePatterns` (not deprecated `domains`), TS/ESLint build-time enforcement deliberately re-enabled with an explanatory comment. Gap: no `headers()` for security headers (P2-23).
- All three Dockerfiles (frontend, node-api, ai-service) are well-built multi-stage/non-root images with `HEALTHCHECK`s and documented rationale in comments (e.g. node-api explicitly strips global npm/corepack binaries from the runtime image to eliminate a documented class of Trivy false positives).
- `docker-compose.yml` requires `JWT_SECRET`/`JWT_REFRESH_SECRET` via `${VAR:?...}` — refuses to start without them rather than silently defaulting.
- `cloudbuild.yaml`: dependency-ordered deploys, `ai-service` deployed with `--no-allow-unauthenticated`, no embedded secrets.
- **CI gap (P1-11):** `backend/.github/workflows/ci.yml` is comprehensive (parallel lint/test/audit jobs, Trivy scan pinned to a SHA, real container boot+health smoke tests, WIF-based deploy with safe traffic promotion). The frontend repo has **no `.github` directory at all** — this is the single clearest infrastructure gap in either repo.

### 4.14 Code Quality Audit
Essentially spotless:
- ESLint (frontend): 2 warnings, 0 errors — both `react-hooks/exhaustive-deps` (`app/faculty/page.tsx:36`, `CollegeAdminDashboard.tsx:527`), worth a quick look but likely intentional.
- `tsc --noEmit`: 0 errors.
- `console.log`/`debugger`: 0 in production source across all three services (a handful of legitimate hits in CLI/loadtest tooling scripts and one false-positive inside quiz-question JSON content).
- TODO/FIXME/XXX/HACK: 0 across all three services.
- Empty catch blocks: 0 genuine — the 3 regex-flagged candidates all contain explanatory comments documenting a deliberate swallow.

### 4.15 Final Folder Structure Notes
No legacy/backup/experimental folders found inside `src/` (no `*.old.tsx`, `*_backup`, `*copy*`). Naming conventions are consistent (PascalCase components, camelCase hooks/lib/stores) with one cosmetic exception (P3-35). The one structural recommendation: relocate `src/assets/logos/` (raw + `_processed` design pipeline, ~15MB, unused by any app code) out of `src/`, which should only contain what the app imports.

---

## 5. What's Already Right (don't second-guess these in the fix pass)

- Zero TypeScript errors, 2 ESLint warnings total, zero dependency vulnerabilities in either repo.
- Backend error handling, logging (Winston, zero stray `console.log`), and Joi validation coverage are disciplined and consistent.
- All three Dockerfiles and the CI pipeline that does exist (backend) reflect real production experience — non-root users, healthchecks, Trivy scanning, WIF over long-lived keys, safe traffic-promotion rollouts.
- `BaseRepository`'s Mongo filter whitelist is a genuine, working defense against NoSQL injection.
- Heavy client-only libraries (`html2pdf.js`, `xlsx`, `apexcharts`) are already correctly lazy-loaded — the gsap/framer-motion homepage bundling (P2-14) is the exception, not the norm.
- JWT design (required secrets, no fallbacks, `token_version` revocation) and upload handling (magic-byte verification, UUID filenames) are both sound.
- `next/image` usage is complete and correct — no missing alt text anywhere in the app.

---

## 6. Suggested Sequencing for the Fix Pass

1. **P0 items first, in isolation** — the dashboard IDOR fix is a small, contained change (add `authorize()` + pass `req.user` + scope the query); confirm the credential-rotation status independently since it may already be resolved.
2. **P1 items**, batched by repo (backend fixes as one pass, frontend accessibility as another, since the a11y fixes share one pattern across 3 files).
3. **Dead-code deletion (§4.2/§4.3)** as its own reviewable commit, once P0/P1 are settled — it's mechanically simple but touches 30 files, better isolated from behavioral changes.
4. **P2/P3** on your normal cadence — none of these are urgent, several (P3-40, the routing architecture) are product decisions rather than bugs.

No code has been changed. Awaiting your direction on which items to act on.
