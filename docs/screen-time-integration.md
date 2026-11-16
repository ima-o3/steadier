# Habit dashboard and Screen Time data flow

## Failure and fix (November 16, 2026)

The existing `/habits` route rendered only `Routines dashboard`. That component reads habit definitions and completion logs, but has no Screen Time report or screen-minute binding. The native report existed only on Today. The dashboard therefore could not display either source of screen-time information.

The existing route now retains `Routines dashboard` and mounts the existing `ScreenTime` component. Returning to the route remounts the report so its current-day filter and authorization are refreshed. Foreground refresh already exists in that component. A dashboard-only refresh button also remounts the same native report. It does not collect, cache or copy usage data.

## Existing sources and storage

- Habits: `State.habits` and `State.habitLogs` from `useStore`; persisted as `habit_definitions` and `habit_logs` by `src/database/repositories/store.ts`. Existing `habitProgress` calculates rolling seven-day progress and the 28-day history. Completion/edit/delete behavior is unchanged.
- Actual iPhone Screen Time: `ScreenTime.tsx` → optional `SteadierScreenTime` native module → `SteadierScreenTimeView` → `DeviceActivityReport` with context `Steadier.Today`, today's device-local date interval and iPhone filter → `ScreenTimeReport` extension. `TodayReport.makeConfiguration` sums the system-supplied activity-segment durations and formats hours/minutes. No activity segments produces “No report available yet”, not an invented zero.
- The native module exposes authorization status and authorization request methods only. It does not return a usage number. Actual usage stays in the report extension; it is not stored in React state, SQLCipher or the cloud.
- Saved manual observations: Today's existing check-in writes `Checkin.screenMinutes`. `AppState.update` persists through `saveState` before publishing the new store value. The repository stores the original in `daily_checkins` and a manual-source projection in `screen_usage_records`; `openStore` reads check-ins from `daily_checkins`. Insights, Heatmap and the steadiness calculation already read these check-ins.
- The dashboard reads that same current-date check-in directly from `useStore` and labels it “Saved screen time”, explicitly separate from the native iPhone report. Zero is displayed as zero; missing values remain missing, and yesterday's value is never substituted. Store updates rerender this readout without another input. No additional screen-time record or schema was introduced.

`src/integrations/screenTime/index.ts` is an unused legacy placeholder, not a data source for any screen. It was not repurposed into a second tracker.

## Platform limitations

Apple requires Family Controls authorization and a signed native app containing the report extension. Builds containing the extension already exist, but these dashboard changes need a new signed build to reach an iPhone. Unsupported platforms show the existing unavailable message. Denied/revoked access shows the existing permission UI; no manual entry is required by this dashboard.

Apple runs report extensions in a sandbox that prevents moving sensitive content outside the extension's address space. Consequently the dashboard embeds the report itself; it cannot read its numeric total in JavaScript, compare that total programmatically with Settings, or use it to replace the manual steadiness factor. Both screens use the same native report context/filter, but iOS updates may be delayed, so independently rendered reports are not guaranteed to update simultaneously. The report uses the device's local day; saved check-ins use the app's configured timezone and are labelled with their date.

Source: https://developer.apple.com/documentation/deviceactivity/deviceactivityreport (privacy sandbox and authorization requirements).

## Verification scope

Component tests cover existing habit progress/checkmarks, shared saved-screen updates including zero and deletion, no stale-day substitution, no duplicate entry, report remounts on refresh/focus/foreground, and permission revocation/reconnection. The native view is mocked in those tests: they verify wiring and lifecycle, not real iOS usage numbers. Existing routine tests cover edit/delete/cancel/save failures and existing persistence tests cover saved observations.

Windows cannot compile or exercise the iOS native report. A signed native build and physical iPhone checks remain required to verify live totals, delayed report updates, authorization, day rollover and navigation in the installed app. No cloud build or TestFlight upload has been started for this change.

Verified locally: `tsc --noEmit`; all 83 Vitest tests (14 files); all 46 Jest component tests (10 suites); `expo export --platform ios --output-dir dist` (1,277 modules); `git diff --check`. Component coverage uses a mocked native report, not actual device activity.
