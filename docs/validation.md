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

On the Windows sideload route, GitHub Actions also passed the checks on a macOS runner. Xcode successfully compiled an unsigned arm64 iPhone Release app, verified the generated SQLCipher compiler setting, and embedded the Hermes bundle. IPA packaging and installation status is recorded in the sideload build note below. The initial attempts exposed two build-script checks that were corrected: verification of compiler flags through generated xcconfig rather than console text, and lipo's argument order.

No screenshot-based native visual QA, iOS simulator session, EAS cloud build, Google account login, TestFlight submission or physical iPhone test has occurred.

## Successful unsigned sideload build

GitHub Actions [run 41535186026](https://github.com/ima-o3/steadier/actions/runs/41535186026) successfully compiled and packaged source commit `bc506a9cf6551f660a7e5197fb450e4bf466827d`. The downloaded artifact is `build/sideload/Steadier-unsigned.ipa` (12,027,854 bytes), version 0.1.0, bundle identifier `com.ima03.steadier`, minimum iOS 16.4. Its SHA-256 was verified after download: `2a328616f64c197da2877d202be9db6c295c9f1c0f961c1c8e9344229f450785`.

Sideloadly detects the connected iPhone. File selection, Apple authentication, signing and installation remain pending; no successful launch or native encryption verification on the phone is claimed.
