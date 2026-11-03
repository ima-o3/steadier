# Steadier 0.1.5 (iOS build 6)

Replaces the unreleased cream dashboard with the user's latest lavender reference: Steadier header, Today heading, compact month mood strip, six pastel ring segments, a personal steadiness value, quick actions, an insight card, and actual planned tasks with completion controls. Keeps the supplied lotus app icon.

Plan my day opens the existing planner. Check in scrolls to today's rating controls. Make it easier and See suggestions select the recovery option and open the planner for review; they do not silently rewrite a saved plan. The Calendar tab exposes appointments and the existing detailed wellbeing calendar. Settings remains available from the header and navigation.

The central number uses the existing mean of recorded mood and energy and exposes its definition through the information button. The ring is decorative, not a set of measured health systems. Missing data stays missing. The month strip uses actual mood entries; tapping opens Calendar. Insight text only reports a sustained pattern when the existing detector has enough observations, otherwise it uses today's low-energy entry or neutral copy. Task rows use actual plans rather than the mockup's example tasks.

Includes the previous iteration's visible Add/Edit/Remove goal controls, optional planning-detail fields, persistence-safe deletion, failed-save recovery, and compact check-in wording.

Validation: TypeScript passed; 63 core and 11 component tests passed. Native screenshots and the IPA still require the replacement GitHub build to complete. Monitoring is intentionally not continuous, following the user's request to conserve Codex credits.

Run 41679151135 failed before executing any steps: GitHub reported that no hosted runner acquired the job after multiple attempts, with macOS ARM capacity warnings. The workflow now uses the separate standard `macos-26-intel` pool. The simulator uses its host architecture; the device build still targets iPhoneOS and verifies arm64 before packaging. Native validation remains pending.
