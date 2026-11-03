# Steadier 0.1.4 (iOS build 5) — superseded before release

The native build was cancelled while queued after the user supplied a new lavender dashboard reference. Goal-management and compact check-in changes carry forward to 0.1.5.

The opening screen now follows the supplied cream dashboard reference: pastel segmented ring, central personal wellbeing summary, dark check-in button, pink message card, compact mood and energy bars, and dark bottom navigation. The lotus app icon remains. The central value is the existing average of recorded mood and energy, not a clinical health score. Missing observations show a dash. Recent-day browsing is available under Recent check-ins.

Check in today scrolls directly to the rating controls. The check-in section no longer repeats seven-day averages, stored values, and the indicator explanation. It uses one short scale/autosave hint, with optional details collapsed.

Goals opens with Add goal and the goal list. Edit goal opens a prefilled sheet; a new goal starts with fresh defaults. Name and description appear first, while planning details are optional. Saves close the form only after persistence succeeds; failures preserve the draft. The capacity report is collapsed below the goal controls.

Remove goal asks for confirmation and removes its milestones, actions, and unfinished planned suggestions. Dependent actions lose references to removed actions. Completed plan entries and revision history retain their text, with removed action references detached. Check-ins remain untouched.

Local validation: TypeScript passed, 63 core tests and 10 component tests passed. Tests cover goal add/edit/remove, failed-save recovery, deletion through the persistence layer, missing observations, zero sleep hours, and historical wellbeing summaries. Native build: https://github.com/ima-o3/steadier/actions/runs/41677033942.

Install through Sideloadly over the existing app using the same Apple ID; do not uninstall the old app because its data is stored locally.
