# Steadier

**An iOS-first planning app for making realistic progress, not endlessly expanding a to-do list.**

Steadier combines goals, small actions, daily planning, routines and optional wellbeing check-ins. Its central question is: **given the time and energy someone actually has, what can they realistically do next?**

Built as an independent product and engineering project using React Native, Expo and TypeScript. The planning and feasibility engines run locally and deterministically—there is no AI API or application backend.

> **Project status:** v0.1.10 development prototype. Automated tests, native iOS compilation and an earlier simulator-startup check are documented. The latest release still needs end-to-end physical-iPhone QA; Google Calendar sign-in has not been validated on a physical device. **Not an App Store release.**

## The problem

Most task managers can store an ambitious plan without answering whether it fits around meetings, protected rest and other goals. That can turn planning into a growing backlog rather than an actionable decision.

Steadier explores three design principles:

1. **Feasibility before ambition.** Estimate workload as a range, compare it with sustainable capacity and explain when goals compete for the same time.
2. **Adaptation without punishment.** Offer a smaller version of a task on low-energy days, keep rest protected and avoid catch-up debt or punitive streaks.
3. **Explainable, privacy-conscious defaults.** Keep planning calculations deterministic and personal records on-device; surface assumptions rather than claiming to infer a clinical state.

## What the prototype does

| Area | Implemented behaviour |
| --- | --- |
| **Goals** | Goals, milestones, dependencies, action variants, effort ranges, deadlines and progress; feasibility labels including **At risk** |
| **What-if planning** | Compare the effect of changing scope, deadlines and assumed capacity before editing saved goals |
| **Today** | Suggest work inside actual available windows; Recovery, Steady and Momentum modes; smaller actions, breaks, pinned items and conflict explanations |
| **Routines & observations** | Track habits, optional mood/energy/sleep and *manually entered* screen time; explain factor-based personal steadiness estimates |
| **Calendar** | Manual commitments and an optional read-only Google Calendar integration, with cached availability and explicit refresh/error states |
| **Data controls** | SQLCipher-configured local SQLite, a device-stored encryption key, explicit JSON export and deletion |

The app includes deterministic demonstration data, so the planning behaviours can be explored without entering personal information.

## Engineering highlights

### 1. Uncertainty-aware goal feasibility

The feasibility engine converts remaining effort estimates into weekly demand, compares them with conservative sustainable-capacity ranges and checks deadline bottlenecks. It also considers whether short work sessions can fit actual free windows. Results distinguish **Feasible**, **At risk**, **Currently infeasible** and **Insufficient information**.

This is a transparent heuristic, **not** a guarantee that every deadline can be met. See [the model and its limitations](docs/goal-feasibility.md).

### 2. A deterministic, constraint-aware daily planner

The allocator unions calendar commitments with preparation/recovery buffers, subtracts protected rest, preserves pinned actions and fits full or reduced tasks into remaining windows. Scheduling uses civil dates and IANA time zones to handle daylight-saving changes.

It is a greedy personal planner rather than a globally optimal scheduler. See [algorithm and edge cases](docs/planning-algorithm.md).

### 3. Local-first data design

The app separates UI, pure TypeScript planning engines, integrations and persistence. Its SQLCipher-enabled SQLite repository uses serialized transactions, foreign keys and versioned migrations. A key is generated for device-only secure storage. Startup fails closed when the required native encryption capability is missing.

**Important distinction:** configuration and simulator checks are not a substitute for full physical-device security validation. See [architecture](docs/architecture.md) and [privacy notes](docs/privacy-and-safety.md).

### 4. Verification and iteration

The repository contains Vitest engine tests, Jest/React Native component tests, persistence tests and Python IPA-packaging tests. Cases include overlapping appointments, deadline competition, DST, smaller action variants, transactional rollback and missing check-in data.

The [validation record](docs/validation.md) distinguishes automated checks, simulator checks and device limitations. New changes are checked with the [CI workflow](.github/workflows/ci.yml); native iPhone builds use a separate, manually triggered [macOS workflow](.github/workflows/ios-sideload.yml).

## Project structure

```text
app/                       Expo Router screens
src/components/            Shared native UI
src/engines/               Pure TypeScript planning, capacity and insight logic
src/features/              Goal and planner interactions
src/database/              Migrations and local repositories
src/integrations/          Google Calendar and disabled native feature stubs
src/tests/                 Logic, persistence and component regression tests
docs/                      Algorithms, validation, privacy and release notes
.github/workflows/         Lightweight CI and opt-in native iOS build
```

## Explore it

For a short recruiter-friendly product tour, see the [90-second demo walkthrough](docs/portfolio-demo.md). The walkthrough uses example data and labels exactly what is implemented versus still in verification.

**Developer setup** (Node.js 24 and pnpm 11.25.0):

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm typecheck
pnpm test
pnpm verify:ios
```

Windows PowerShell: use `Copy-Item .env.example .env.local` instead of `cp`.

The app requires a **native iOS development build**, not Expo Go or a browser, because its SQLite encryption plugin must be compiled into the app. For installation paths and signing prerequisites, read the [iOS build guide](docs/ios-build-guide.md) or [Windows sideload guide](docs/windows-sideload-guide.md). Google credentials are optional for local/manual planning.

## Limitations and next steps

- Complete a fresh physical-device test pass for v0.1.10, especially sign-in, animations, accessibility, encrypted persistence and export.
- Add genuine, privacy-safe app screenshots and a short screen recording from the validated build.
- Replace snapshot-style state persistence with more targeted updates and add native migration/performance fixtures.
- No automatic Screen Time or HealthKit import, background calendar sync, cloud sync or clinically validated wellbeing assessment is implemented.

See the [implementation roadmap](docs/development-roadmap.md) and [privacy/safety boundaries](docs/privacy-and-safety.md).

---

**Focus:** explainable algorithms · constrained planning · mobile engineering · testing · human-centred product iteration

*Steadier is a personal self-management prototype, not medical advice or a clinical tool.*
