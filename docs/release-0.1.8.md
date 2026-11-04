# Steadier 0.1.8 — iOS build 9

## Visible changes

- Goals previously expanded every milestone, action, and management button on the overview. They now show compact cards with a deadline, feasibility assessment, and real completion progress. Tap a card for its detail view and use Back to goals to return.
- The detail view separates pastel-blue milestones from pastel-red actions. Completion uses accessible checkboxes; edit and confirmed deletion remain available. Add work and goal/milestone reassignment are preserved.
- Edit goal contains status, archive, deletion, deadline, priority, importance, and remaining-effort fields. Work frequency and minimum progress live under optional planning details. Older paused goals remain accessible and retain their status unless explicitly changed.
- Today now has a fixed-height monthly wellbeing grid based on both mood and energy, a smaller segmented summary, concise insight, and existing quick actions. The duplicate full heatmap was removed from Today; the detailed calendar remains accessible from the top grid. Missing observations remain missing. The score is a personal average, not a clinical assessment.

## Working functionality

- Make this realistic opens a draft simulator with current and proposed weekly demand, capacity, ratio, deadline constraints, missing estimates, and documented assumptions. Deadline, effort range, priority, capacity allowance, and preview exclusions recalculate the report. Reset and Cancel do not write data. Apply Changes saves edited fields only; exclusions are explicitly preview-only and do not archive or pause goals.
- Weekly workload and deadline/scheduling constraints have separate explanations. Priorities affect selection order, not workload estimates.
- Make it easier now shortens flexible scheduled items to their smallest configured versions, or removes a flexible item when no shorter version exists. Freed time stays empty. Pinned/manual edits, started work, completed items, fixed commitments, and long-term goals are preserved, with a revision recorded.
- The planner considers reported low energy with a 20% reduction to its chosen-mode budget, without forcing recovery. It explains priority/deadline selection and long-term overload. Selected calendars refresh before generation; timeout/error falls back to cached availability with an explicit message. Manual commitments remain intact. Generation uses the latest stored plan and goals after refresh.

## Deterministic simulator demonstration

The regression fixture uses 2 November 2026, 15 discretionary hours/week, a 40–60% sustainable allowance, and a goal requiring 20–30 remaining hours. No personal data is changed by this fixture.

| Measurement                   | Deadline 8 November  | Proposed deadline 20 December |
| ----------------------------- | -------------------- | ----------------------------- |
| Sustainable capacity          | 6–9 h/week           | 6–9 h/week                    |
| Required weekly effort        | 20–30 h/week         | 2.9–4.3 h/week                |
| Upper demand / lower capacity | 5.00                 | 0.71                          |
| Overall result                | Currently infeasible | Feasible                      |

The same total work has seven weeks instead of one. The engine also checks cumulative deadline capacity and action windows; this is an estimate, not a promise. Missing estimates produce an incomplete/unknown comparison.

## Data and identity

No database schema migration, reset, encryption-key change, or dependency upgrade is introduced. SQLCipher and SecureStore remain enabled. The v0.1.7-schema regression preserves paused goals, milestone/action relationships, check-ins, plans, and the stored key across reopen/save. The local SQLite adapter does not prove physical-device encryption or a device upgrade.

Version sources are package.json and app.json: **0.1.8 / 9**. Expo prebuild derives native version metadata from this configuration. The default bundle identifier now matches the already-used release identity **com.ima03.steadier**, replacing the unused template fallback; the workflow identity is unchanged.

## Validation

- TypeScript type checking.
- 71 core tests, including feasibility scenarios, planner simplification, calendar/time windows, relational persistence, and v0.1.7-schema compatibility.
- 20 component tests, including goal detail navigation, checkbox completion, legacy paused goals, simulator cancel/reset/apply and invalid-date handling, calendar refresh/offline fallback, and immediate mood/energy updates.
- 7 Python IPA packaging/build-log tests.
- Production iOS JavaScript export.

No successful physical-iPhone test, native compilation, or new IPA installation is claimed by these local checks. Native startup screenshots and compiled IPA verification require the cloud workflow. Large Dynamic Type and VoiceOver should also receive a device check. Capacity projections beyond 13 weeks remain uncertain. Google Calendar requires the configured OAuth client and has not been tested on the user's physical device in this release.

## Build and update

Run **iPhone IPA for Windows sideloading**, `.github/workflows/ios-sideload.yml`, on main with `runner=macos-26-intel`, `simulator_only=false`, `skip_simulator=false`. The independent simulator and device jobs retain compiler caching and full diagnostic logs. No dependency was added that would deliberately invalidate the native cache.

The expected artifact is **Steadier-v0.1.8-build9-unsigned-iphone**. The workflow reads the packaged IPA's Info.plist and rejects incorrect version, build, or bundle identity before upload. This is a required check, not a claim that a new IPA already exists.

Download and extract that exact artifact. In Sideloadly select its Steadier-unsigned.ipa, the existing iPhone, and the same Apple ID and bundle settings used for the current installation. Install over the existing app; **do not delete Steadier**. After installation, close/reopen it and verify version 0.1.8 plus the compact Goals overview. Weekly signing refresh can reuse this IPA and does not need another cloud build.
