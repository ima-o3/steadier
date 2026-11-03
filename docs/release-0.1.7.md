# Steadier 0.1.7 (iOS build 8) — Goal feasibility and Goals dashboard

This is a **source-code change**, not yet a compiled, signed or device-tested IPA.

## What changed

- The Goals screen now opens with a calm, lavender capacity overview, weekly demand-versus-capacity comparison, at-risk status, active/completed totals and compact goal cards. Milestone and action management is revealed on demand rather than overwhelming the main view. Each goal shows its progress separately from its feasibility rating, with individual weekly workload estimates when information is sufficient.
- Goal feasibility now checks whether unfinished actions **across different goals** compete for the same scarce uninterrupted calendar windows before their deadlines. A necessary-condition slot count flags clear collisions without pretending to be a complete scheduling optimizer.
- A weekly-rate overload that does not establish a concrete deadline/window bottleneck is now labelled **At risk** rather than **Currently infeasible**, avoiding overly certain conclusions for short deadlines.
- Persisted feasibility reports record the actual engine version (`feasibility-2`).
- The app version is now 0.1.7, iOS build number 8. Bundle identifier and signing approach are unchanged.
- The unsigned iPhone IPA and GitHub Actions artifact will now include the version and build number read from the compiled app metadata. The download helper supports these new artifact names.

## Verification and limitations

- All 13 feasibility test cases (10 existing + 3 new) passed in a standalone Node harness using the source TypeScript transpiled with the globally installed compiler. The harness substitutes UTC-based dates for the Europe/London November fixture; it **does not replace the full Vitest run** or validate DST behaviour.
- The 10 Python packaging and build-script tests passed. The Goals component tests were updated for the new collapsed detail panels, and a dashboard interaction regression test was added. These component tests need to run in the full project environment.
- The full pnpm/React Native test suite, TypeScript project typecheck and native iPhone build **could not be run in this environment** because dependencies are not installed and package registry access was unavailable. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, and build checks on the actual project or GitHub Actions before installing an update.
- This check only detects necessary slot-capacity constraints, not all scheduling conflicts. It uses the shortest action variants as minimum sessions; those variants may represent only partial progress. Goal-effort estimates and calendar information still require user review. Neither feasibility labels nor wellbeing indicators are clinical assessments.

## Upgrade

Apply the patch or replace the changed source files in the repository. Commit to the existing branch, run the CI checks and the manual unsigned iOS workflow. Before installing over an existing sideloaded app, export or back up data and retain the same effective bundle identifier and Apple signing identity.
