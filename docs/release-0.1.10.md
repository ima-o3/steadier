# Steadier 0.1.10 — iOS build 11

Implements the latest feedback from the user's personal WhatsApp list:

- Goal/routine swipe: keep the entire foreground, including the accessible menu, over the Delete background. Closed cards no longer expose the red strip. Interrupt animations before dragging and use swipe velocity when settling. Deletion still requires the revealed button and confirmation.
- Today's schedule: compact pastel timeline, left-aligned times, status labels and a completion checkbox for suggestions. Tap a task for the existing edit, move, replace, pin and remove controls. Fixed commitments are informational and cannot be completed as goal tasks. Today shows everything, Focus shows tasks, Recovery shows routines, and Plan opens the planner. Make easier and Regenerate reuse existing planner operations.
- Today's steadiness: equal average of available mood, energy, sleep quality, sleep duration, screen time and daily-functioning observations. Ring segments and numeric badges update with each factor. Missing factors remain missing; notes and completed tasks do not affect the score. The monthly wellbeing heatmap continues to use recorded mood/energy, preserving its historical meaning.
- Personal targets are editable and persisted. Initial defaults are 8h sleep and 300min screen time. Sleep contribution is `clamp(10 - 2 * abs(hours - target), 0, 10)`; screen contribution is `clamp(10 - max(0, minutes - target) / 60, 0, 10)`. Ratings use the recorded 0–10 values. These are transparent app heuristics, not medical thresholds or a validated clinical score. Tap the explanation or individual factor for details.

No dependency upgrade, database schema migration, encryption change or bundle-identity change. New optional preferences use the existing JSON preference record. Google OAuth configuration and billing remain unchanged.

Local verification covers missing/zero values, target changes, bounded scores, timeline filters, completion and fixed-event preservation, plus existing persistence and swipe regressions. Native simulator startup and physical-device animation/Google sign-in remain release checks; local tests do not establish physical-device behavior.

Expected artifact: `Steadier-v0.1.10-build11-unsigned-iphone`. Install over the existing app using the same Sideloadly account and bundle settings. Do not delete the installed app. Cloud build requires user approval.
