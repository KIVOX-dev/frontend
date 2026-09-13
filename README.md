# TalentSnaps

**Campus placement and assessment management, in one platform.**

TalentSnaps connects students, faculty, institution administrators, and hiring teams around a single source of truth for aptitude practice, placement drives, and career readiness — replacing the spreadsheets and disconnected tools most campuses still run on.

This repository is the **frontend**: a Next.js 15 / React 19 application serving the public marketing site and four role-specific portals (Learner, Institutional Admin, HR, Faculty), plus a Super Admin console. It talks to a separate Node.js API and a Python AI microservice, both in sibling repositories.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)

---

## Features

**For students (Learner Portal)**
- Mock Practice — timed, topic-wise aptitude drills (Quantitative, Logical Reasoning, Verbal Ability, Data Interpretation) with a question palette and instant scoring
- MNC Company Tests — full-length mock exams modeled on real hiring patterns (TCS NQT, Infosys InfyTQ, Wipro NLTH, and others)
- AI Profile Summarizer — a career-readiness score and skill breakdown computed from a student's actual test, interview, and resume activity
- Resume Builder — a structured, ATS-aware resume editor with PDF export
- Mock Interviewer, placement opportunities, leaderboard, and test history

**For institutions (Institutional Admin Portal)**
- Department, assessment, and student roster management
- Placement drive creation and applicant tracking
- Institution-wide analytics on test performance and placement outcomes
- Role-based approvals for faculty and HR accounts

**For recruiters and faculty**
- HR dashboards for posting drives and reviewing candidates
- Faculty tools for assigning tests and tracking student progress

**Platform**
- Multi-audience marketing site (learner / HR / institutional landing pages) with a shared design system
- Google OAuth and email/password authentication
- Real-time in-app messaging

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Data fetching | Axios |
| Animation | Framer Motion, GSAP, Lenis (smooth scroll) |
| Charts | ApexCharts |
| UI primitives | Radix UI |
| Testing | Vitest, React Testing Library |
| Analytics | Vercel Analytics |
| Deployment | Vercel (frontend), Docker / Google Cloud Run (backend services) |

## Architecture

This frontend is one piece of a three-service system:

```
Upscaler-frontend/   ← this repo — Next.js app (Vercel)
backend/node-api/    ← Express + MongoDB API (Cloud Run)
backend/ai-service/  ← FastAPI + Groq — resume analysis, AI features (Cloud Run)
```

The frontend never talks to a database directly — every data operation goes through `node-api`, which in turn calls `ai-service` for anything LLM-backed (resume feedback, etc.). See [`next.config.mjs`](next.config.mjs) for how the API origin is wired into both the build and the Content Security Policy.

## Getting Started

### Prerequisites

- Node.js 24+
- A running instance of `node-api` (locally on port 5000, or a deployed URL) — see that repository's README for setup

### Installation

```bash
git clone https://github.com/KIVOX-dev/frontend.git upscaler-frontend
cd upscaler-frontend
npm install
```

### Configuration

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below for what each key does.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hot reload is enabled by default.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No (dev) / Yes (prod) | Base URL of the backend API, e.g. `https://api.example.com/api/v1`. If unset locally, the app falls back to `http://<host>:5000/api/v1` — node-api's default dev port. Baked in at **build time**, so a hosted deployment (Vercel, Docker) must have this set before building, not just at runtime. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | OAuth 2.0 Client ID from Google Cloud Console. Must match the `GOOGLE_CLIENT_ID` configured on the backend. Without it, the "Continue with Google" buttons render nothing. |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a production build (run `build` first) |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |

## Project Structure

```
src/
├── app/                  # Next.js App Router — one folder per route
│   ├── learner/          # Student portal
│   ├── institutional/    # Institution admin portal
│   ├── hr/                # HR portal
│   ├── faculty/          # Faculty portal
│   ├── superadmin/        # Super admin console
│   ├── for-hr/, for-institutions/  # Audience-specific marketing pages
│   └── ...
├── components/
│   ├── landing/           # Marketing site sections
│   ├── learner/           # Practice tests, resume builder, profile summarizer, etc.
│   ├── institutional/     # Department/assessment/placement management
│   ├── hr/, faculty/, superadmin/
│   ├── auth/               # Login/register/password flows
│   ├── layout/              # Portal shells (sidebar, nav)
│   ├── shared/               # Cross-portal components (logo, etc.)
│   └── ui/                    # Design-system primitives (Button, Toaster, Tooltip, ...)
├── hooks/                # Shared React hooks
├── lib/                  # API client, auth helpers, utilities
├── stores/               # Zustand stores (auth, UI state)
└── styles/               # Global and legacy portal CSS
```

## Testing

Unit and component tests run on [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/):

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## Security

- Strict Content-Security-Policy, HSTS, and standard hardening headers are applied in production — see [`next.config.mjs`](next.config.mjs)
- Dependency vulnerabilities are tracked via `npm audit` in CI; a small set of pinned overrides in `package.json` patch transitive advisories ahead of upstream releases
- The `.github/workflows/ci.yml` pipeline runs lint, typecheck, a production build, a Trivy container scan, and a container smoke test on every push to `main`

## Deployment

**Frontend** deploys to [Vercel](https://vercel.com/) on every push to `main`. Production environment variables (see above) are configured in the Vercel project settings, not committed to this repo.

**Containerized deploys** use the included [`Dockerfile`](Dockerfile), which builds a minimal standalone Next.js image (`output: "standalone"`) suitable for Cloud Run or any other container host. `NEXT_PUBLIC_API_URL` must be supplied as a Docker build argument, since it's compiled into the client bundle.

---

<sub>© TalentSnaps. Proprietary and confidential — internal use only.</sub>
