# Steadier 0.1.11 (12): encrypted storage recovery

Adds Restore saved backup to the startup error screen. Select a format-version-1 Steadier JSON export from Files and confirm the displayed counts. The export stays on the device.

Recovery validates the export, writes a separate encrypted database with its own SecureStore key, checks integrity, closes and reopens it, then changes the active database selection. The previous database and legacy key are retained. Interrupted or failed recovery does not activate the candidate database.

Startup refuses to generate a replacement encryption key when a database already exists. No unencrypted fallback or destructive reset is provided.

The migration failure's exact cause remains unconfirmed. USB inspection verified version 0.1.10 (11), bundle com.ima03.steadier.CUY2KJ4PL6 and team CUY2KJ4PL6. The old unsigned IPA cannot establish the previous installation's keychain entitlements.

Device acceptance: update through TestFlight without deleting the app; choose Restore saved backup; select the saved JSON; check the counts and confirm; verify goals, actions, check-ins and preferences, then force-close and reopen. Keep the original export.

Follow-up: the onboarding/usability brief referring to v0.1.11 is implemented as v0.1.14 (15), because v0.1.11 had already shipped. See release-0.1.14.md; the recovery notes above remain historical.
