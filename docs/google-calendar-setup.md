# Read-only Google Calendar setup

Manual prerequisite: a Google Cloud account/project and permission to configure OAuth. Do not send client secrets to the app.

1. Create or select a Cloud project and enable **Google Calendar API**.
2. Configure the Google Auth Platform OAuth consent screen. Choose the audience appropriate to your account. For a personal external testing app, add your own Google account as a test user. Calendar scopes may require verification before public distribution; test-mode authorizations may expire and need reconnection.
3. Create an OAuth client of type **iOS**, using the exact installed bundle identifier. For this personal Sideloadly installation it is `com.ima03.steadier.CUY2KJ4PL6`; the unsigned source/build identity stays `com.ima03.steadier`. Do not change the existing installation identity to fix OAuth. No web client secret, redirect proxy or backend is required by this iOS native flow.
4. Put the iOS client ID into `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env.local`. Set `GOOGLE_IOS_URL_SCHEME` to its reversed client-ID scheme (`com.googleusercontent.apps.<your-client-id-prefix>`). These are public identifiers, not secrets. Keep credentials and downloaded private files out of Git. For Sideloadly, retain the unsigned build identity and let the existing signing settings produce the registered installed identity.
5. For this GitHub workflow, set repository Actions variables `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `GOOGLE_IOS_URL_SCHEME`; the workflow already supplies the unsigned bundle identity. If using EAS instead, set the values in the relevant EAS environment. A gitignored local environment file is not present on the cloud builder. Restart Metro after local changes and rebuild the native app after URL scheme changes. The app config rejects mismatched client IDs and schemes.
6. Build/install the development client. In Settings, connect, select calendars and refresh. Consent must include only calendar event read and calendar list read privileges, in addition to basic identity scopes added by the Google SDK. Inspect actual consent on the device.

Requested Calendar scopes:

```
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.calendarlist.readonly
```

Google's native SDK manages tokens in Keychain. The client gets short-lived access tokens in memory, uses HTTPS GET only, retries a 401 once after clearing the cached token, and surfaces failures without replacing the successful cache. Settings displays the last successful sync, selected calendar count, manual refresh, cache clearing and revoke/disconnect controls. If remote revocation fails offline, clear local cache and retry disconnect when online, or revoke from your Google account permissions page. Clearing all app data alone does not revoke Google's grant.

Sync requests `singleEvents=true` for server-expanded recurrence instances over the next 91 days and follows all page tokens for each selected calendar. It excludes cancelled and self-declined events, respects transparent status, deduplicates by iCalUID plus instance start, and retains only title/start/end/busy/provenance. Duplicate copies conservatively combine busy status. All-day dates are interpreted in the selected planning timezone and default to informational. Changing timezone/routine or calendar selection clears the old Google availability until refresh. No event write/delete API exists.

Troubleshooting: cancellation leaves the app usable offline; an OAuth mismatch usually means bundle ID/client/scheme differ or a native rebuild is missing. Missing calendars can mean declined consent, wrong account or no selected calendars. A 401 requires refresh/reconnection; a 403 can indicate disabled API, test-user restrictions, missing consent or quota. Rate limits and network errors preserve cached data and show failure; retry manually. Native Google UI, refresh-token lifecycle and actual cloud-project permissions remain unverified without credentials/device access.

Sources consulted: [Expo Google authentication](https://docs.expo.dev/guides/google-authentication/), [native library Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo), [native Google token APIs](https://react-native-google-signin.github.io/docs/original), [Google events.list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).
