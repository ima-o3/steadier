# Steadier

A native iOS-first, offline-first personal wellbeing and adaptive planning app. Expo SDK 58, React Native 0.88, strict TypeScript, Expo Router, SQLCipher-backed SQLite, native Google Sign-In, and deterministic local engines. No AI service or backend is required.

## Run

**Installing on iPhone from Windows without paid Apple membership:** use the [Windows sideload guide](docs/windows-sideload-guide.md). A manual GitHub Actions workflow builds an unsigned IPA for local signing and weekly refresh. The EAS instructions below remain an alternative for paid Apple memberships.

Install Node 24 LTS with its package manager and pnpm 11.25.0. On this development machine Node was bundled without npm; the bundled pnpm CLI was used. A normal Node installation avoids that limitation.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm typecheck
pnpm test
pnpm verify:ios
```

Use a **native development build**, not Expo Go. SQLCipher is mandatory: startup deliberately stops if the native encryption module is unavailable. A browser cannot run this app's persistence layer.

```powershell
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest init
pnpm dlx eas-cli@latest device:create
pnpm ios:development
pnpm start
```

Before building, choose your bundle ID and follow [the iPhone installation guide](docs/ios-build-guide.md). EAS init creates your project ID; add it to the config as instructed there. Apple/Expo accounts and device registration are manual prerequisites. A Windows host uses EAS cloud compilation; no local Xcode is assumed.

## Use the app

The monthly heatmap appears first. Start with your own data or choose a clearly labelled deterministic demo. Demo mode uses local example observations, a robotics goal, a smaller action, a habit, and an afternoon commitment. Clear demo data in Settings before collecting personal observations.

1. In Goals, create a goal with remaining effort range, deadline and importance. Use **Add work** to create milestones and actions with smaller versions.
2. In Settings, configure working hours, protected rest, buffers, weekly discretionary hours and capacity assumptions. Add manual commitments or connect Google and select calendars, then refresh.
3. In Today, optionally record energy/mood. Choose a planning mode or explicitly accept the suggested mode, then generate. Existing appointments and protected rest constrain suggestions. Plans generated late in the day only use remaining time.
4. Complete, pin, edit, move, replace, reduce or remove suggestions. A pinned item that conflicts with changed availability produces an explanation rather than silently overwriting the commitment. Rest has no penalty.
5. Check Goals for transparent feasibility estimates. Insights keeps mood/energy/sleep observations, habits and task progress separate. Export/delete controls are in Settings.

Blank check-in fields preserve any existing value for that date. To erase a recorded day use the heatmap deletion control; all observations can also be deleted in Settings. Remaining goal effort is a manual estimate: completing a smaller action does not pretend the full goal estimate was accomplished.

## Verification and limits

See [validation](docs/validation.md) for actual checks and [roadmap](docs/development-roadmap.md) for the remaining work. The source and iOS JavaScript bundle are prepared; an IPA has **not** been signed, installed or tested on an iPhone. Native SQLCipher and Google OAuth require device validation. No notification delivery, HealthKit import or Screen Time collection is implemented.

## Documentation

- [Architecture](docs/architecture.md) and [data model](docs/data-model.md)
- [Daily planning](docs/planning-algorithm.md) and [goal feasibility](docs/goal-feasibility.md)
- [Google Calendar setup](docs/google-calendar-setup.md)
- [iPhone development / preview / TestFlight guide](docs/ios-build-guide.md)
- [Privacy and safety](docs/privacy-and-safety.md)
- [Implementation status and roadmap](docs/development-roadmap.md)
