# Privacy and safety

Steadier is a personal, nonclinical self-management tool. It does not diagnose depression, forecast episodes, change medication, equate task performance with wellbeing or offer automatic emergency intervention. Optional support information links to the NHS and encourages professional support. No punitive streaks, catch-up debt or guilt-based notifications are implemented.

Wellbeing is the mean of recorded mood and energy only; if only one exists, that value is used, with an explanation. Missing observations remain missing, including optional sleep/screen data. Task and habit completion never feed the wellbeing indicator. Energy pattern comparisons are exploratory, not causal; no claim that outdoor time or phone usage caused a mental health change is generated. Broader association detection is deferred.

Data stays in SQLCipher SQLite on the device. A random encryption key is stored in device-only Keychain-backed SecureStore. Losing the key/device can make data unrecoverable: there is no cloud backup, restore/import flow or recovery service. Native database backup/restore and device-lock behaviour require actual-device validation. Never assume an encrypted database backup contains its recoverable key.

Google Calendar is optional. Its SDK contacts Google for authentication; read-only API calls fetch selected calendars. Titles and availability are cached locally; descriptions, locations and attendee details are not retained. Tokens/refresh tokens are not stored in SQLite or exported/logged. Only the native Google SDK manages Google credentials. Calendar availability is always labelled with sync time and can be incomplete/stale. Disconnect revokes access online; clearing local data is a separate action.

Export is explicit and creates an unencrypted JSON file in temporary app cache for the native share sheet. The file is removed when sharing completes or fails, but exported copies and destinations are outside app control. Logical row deletion is not a forensic erase of flash or backups. No biometric app lock, secure export encryption or hardened release security assessment is implemented yet.

HealthKit and Screen Time feature modules are disabled. No passive tracking or notification permission is requested. HealthKit sleep would need explicit read-only consent and source conflict handling. Screen Time needs Apple's entitlement approval and native extensions; unrestricted detailed usage of other apps is not promised.
