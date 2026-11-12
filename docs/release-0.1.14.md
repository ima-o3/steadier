# Steadier 0.1.14 (15) — welcome and goal usability

## Behavior
- Empty first-run accounts see a full-screen lilac welcome and a short optional tutorial. Get Started, Back, Next, step indicators and Skip are available. Completion persists and opens New goal; Settings can replay without resetting records. Existing accounts with records bypass the first-run experience.
- Goal name is prominent; description is multiline; optional planning fields start collapsed. Deadlines use a native picker with cancel/confirm/clear, locale display, and the existing YYYY-MM-DD storage format.
- Goal cards use no swipe gesture. Goal options appear in the top-right of the detail/edit header, with edit/delete and a second destructive confirmation. Other swipe interactions are unchanged.
- Shorter labels distinguish schedule time from energy. Importance and ordering remain distinct because dailyPlanner sorts by importance first, then priority, then deadline. Frequency remains whole days/week; 0.5 now produces an explicit explanation instead of a vague positive-number error. Minutes/session supports shorter effort. No algorithm or units changed.

## Verification
TypeScript passed. Vitest: 83 tests passed. Jest: 42 tests passed (9 suites). New coverage includes welcome/tutorial forward/back/skip, failed completion, replay, first-goal opening/saving, native date storage/clearing, explicit fractional rejection, absent swipe-delete and deletion confirmation. Persistence coverage verifies tutorial flags and existing goals survive reopening.

The native date picker 9.2.1 is the only added dependency, selected by Expo SDK 58. Expo and React Native versions are unchanged. Local production iOS export result is recorded in the PR. No macOS or iOS simulator is available on this Windows host; keyboard, VoiceOver, large text, native picker and visual appearance still require device acceptance. The welcome uses the existing icon and code-drawn orbital decoration; no new external artwork or tracking.

## Version and review
The brief referenced v0.1.11; that version already shipped for recovery. Its notes are preserved and cross-referenced. This update uses 0.1.14 / build 15 to avoid the existing 0.1.13 / build 14 release. No cloud build, TestFlight upload or merge is included.

PR base is codex/build14-baseline (the existing local build-14 history), because origin/main predates the already-tested TestFlight releases. This avoids bundling those earlier releases into this review. No changes are pushed to main.

Combined release includes the build-14 Screen Time integration and its ITMS-91179 packaging correction: ExtensionKit product type, EXAppExtensionAttributes metadata, and embedding in Steadier.app/Extensions. The previous binary was rejected by Apple after upload. Native compilation and Apple validation must verify the corrected package. User approved the combined build on November 12.
