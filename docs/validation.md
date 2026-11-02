# Validation record

Environment: Windows PowerShell, Node 24.22.1; empty repository at start. The host had no npm executable, so the bundled pnpm 11.25.0 CLI installed dependencies. Dependency versions were aligned with the installed Expo SDK 58 native-module map; `pnpm-lock.yaml` records exact resolutions.

Automated checks cover:

- Planner: energy recommendation, reduced workload, non-overlap, buffers, protected rest, empty/full availability, remaining-day clipping, pin preservation/conflict rejection, dependencies, paused goals and recovery gaps.
- Feasibility: multiple small goals, one large goal, missing information, conservative capacity, shared deadline demand, actual window sizes, frequency and transparent unchanged priorities.
- Calendar: multiple calendars/deduplication, recurring instances, cancellation/decline, transparent/all-day overrides, overlapping commitments, pagination/failure, token expiry/retry, offline rejection and Europe/London DST.
- Wellbeing: missing values, mean of original observations, task independence, insufficient baseline and cautious energy pattern language.
- Persistence: actual SQLite migration/FKs via Node SQLite; transactional repository round-trip, reduced variants/pinned plans, rollback and derived-data deletion. The adapter simulates SQLCipher metadata, so these tests **do not establish native encryption**.
- Component: React Native Testing Library renders the heatmap, opens a recorded day and a neutral missing day, and verifies accessible labels and explanations.

`pnpm typecheck`, `pnpm test:core`, `pnpm test:components` and `pnpm verify:ios` are the repeatable commands. Hermes bundle export validates module resolution/compilation; it does not compile/sign an IPA or exercise UIKit, SQLite encryption or native OAuth. Windows sandbox restrictions required the component runner and Hermes compiler to run with access to their temporary/cache directories.

Final checks on 2 November 2026: **61 core tests passed across 9 files; 1 React Native component test passed; strict TypeScript passed; frozen offline install passed; no peer dependency issues; final iOS Hermes bundle export passed (3.2 MB).** Resolved public config confirms SQLCipher is enabled. Jest uses `--forceExit` because the Expo test runtime retains open handles; this is a test-runner limitation, not device-runtime verification.

No screenshot-based native visual QA, iOS simulator session, EAS cloud build, Google account login, TestFlight submission or physical iPhone test has occurred.
