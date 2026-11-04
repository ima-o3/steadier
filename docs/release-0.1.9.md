# Steadier 0.1.9 — iOS build 10

- Edit discretionary hours directly from the capacity report. Validation and cancellation preserve saved preferences; changing hours does not overwrite other settings.
- Add, edit and delete small routines from Today or Settings. Editing retains routine identity and checkmarks. Deletion requires confirmation and removes associated checkmarks and unfinished generated suggestions; completed plan entries and revision history remain.
- Swipe left on goal or routine cards to reveal Delete, then tap and confirm. Vertical scrolling does not claim the swipe gesture. An accessible reveal button is also available. The separate edit-goal slider is removed.
- Configure the native Google iOS sign-in URL scheme from the public OAuth client ID, with build-time validation for mismatches. The Calendar API, personal test user, and two read-only Calendar scope declarations have been configured. GitHub Actions has the public client ID and reversed URL scheme variables. No billing account is linked to the Google project.

## Identity and validation

Version 0.1.9 / build 10. The source and cloud build retain `com.ima03.steadier`; the personal Sideloadly installation uses `com.ima03.steadier.CUY2KJ4PL6`, which is the registered Google iOS OAuth bundle. Keep the same Sideloadly account and bundle settings when installing over the existing app. Do not delete the installed app.

No database migration, encryption-key change or dependency upgrade. SQLCipher and SecureStore remain enabled. Regression tests cover relational routine deletion, preserved completed history, editing/cancel/error behavior, capacity changes and gesture intent. Native compilation, simulator startup and physical-device Google consent/sync remain separate release checks. Local checks do not prove device sign-in.

Expected artifact: `Steadier-v0.1.9-build10-unsigned-iphone`. After installation, connect Google from Settings, select calendars, refresh and check imported events. Google authorization is granted by the user on the phone; scope declarations alone do not grant access.
