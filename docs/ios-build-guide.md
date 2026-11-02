# iPhone 15 Pro build and installation

For a free Apple ID and Windows PC, use the separate [unsigned cloud build and Windows sideload route](windows-sideload-guide.md). This page describes the EAS route, which requires paid Apple membership for device distribution.

## Manual prerequisites

- An Expo account with EAS Build access and an Apple Developer Program membership for physical-device cloud distribution.
- Your Apple team, a unique bundle identifier and access to the iPhone's Safari and Settings.
- For Google integration: the iOS OAuth client and reversed URL scheme described in [Google setup](google-calendar-setup.md). You can build and use manual commitments without Google credentials.

This Windows project does not compile with local Xcode. It contains no fabricated Apple credentials, provisioning profile, team ID, EAS project ID or successful device test. EAS builds may consume account credits; the user runs the account/signing steps.

## Register the app and device

1. Install dependencies with `pnpm install --frozen-lockfile` on Node 24.
2. Set `IOS_BUNDLE_IDENTIFIER` in `.env.local`, for example your own reverse-domain identifier. Use the exact same identifier in Apple Developer and Google Cloud. Set public Google variables if connecting Calendar.
3. Run `pnpm dlx eas-cli@latest login`, then `pnpm dlx eas-cli@latest init`. Create/link your Expo project. If the dynamic config prevents automatic changes, copy the returned project UUID into `app.config.ts` as `extra: { eas: { projectId: '<actual UUID>' } }`; set `owner` to your actual Expo account or organization if needed. Do not copy placeholder IDs into production.
4. In the Expo project environment dashboard, create the three public build variables from `.env.example` for each environment you use. The build profiles explicitly select development, preview and production environments.
5. Run `pnpm dlx eas-cli@latest device:create`. Open its registration link in Safari on the iPhone 15 Pro and complete device registration. EAS uses the UDID for an ad hoc provisioning profile. Register before building, or rebuild/resign after adding a device.

## Development build

```powershell
pnpm typecheck
pnpm test
pnpm verify:ios
pnpm dlx eas-cli@latest build --platform ios --profile development
```

Sign in to your Apple Developer team when EAS asks. Let EAS create/manage signing credentials only after checking the displayed account/team and identifier. Wait for the cloud build; open the resulting install link on the registered iPhone. Install the app as instructed by EAS.

For development builds, enable **Settings → Privacy & Security → Developer Mode** if prompted, restart the iPhone and confirm. Open Steadier. Start Metro with `pnpm start` on the PC and open its QR/deep link in the installed development client. Phone and PC normally need the same reachable network and Windows Firewall access for Metro. If LAN is unavailable, configure Expo's supported tunnel option. Metro is for development; it is not a backend storing health data.

SQLCipher is compiled by the expo-sqlite plugin. Expo Go cannot load it. If startup says SQLCipher is unavailable, rebuild the native app from this config; do not bypass the encryption check. If authentication fails after changing schemes, rebuild instead of merely reloading JavaScript.

## Standalone preview

```powershell
pnpm dlx eas-cli@latest build --platform ios --profile preview
```

The internal preview is an ad hoc app with an embedded bundle, so Metro is unnecessary. It still requires a registered device/provisioning profile. Test this build offline before relying on it for daily use.

## TestFlight and App Store Connect

1. In App Store Connect create an app for the registered bundle ID, using your own name/SKU. Set required agreements and account roles.
2. Build a production archive: `pnpm dlx eas-cli@latest build --platform ios --profile production`.
3. Run `pnpm dlx eas-cli@latest submit --platform ios --profile production --latest`; select the actual app and provide an authorized App Store Connect API key or supported account login through EAS prompts. Optionally configure the real `ascAppId` under the production submit profile. Never commit the API private key.
4. Complete Apple's current encryption/export-compliance questions accurately for the SQLCipher build. This repository deliberately does not predeclare exemption. Complete privacy disclosures, age rating, screenshots, support/privacy URLs, and any required sign-in/account deletion review requirements before public release.
5. After processing, invite yourself as an internal TestFlight tester and install using TestFlight. External testing may require beta review. Uploading a build does not publish it; public App Review submission is a separate App Store Connect action.

## Device acceptance checklist

Confirm SQLCipher startup; save/relaunch persistence; kill/reopen offline; dark/light mode; safe areas/Dynamic Island; VoiceOver heatmap dates, values and missing days; largest Dynamic Type; no action/appointment overlap; protected rest; timezone/DST; Google consent/refresh/revoke; sharing/cancelled export; deletion; and useful empty/error states. Enter energy 3, accept recovery, add an afternoon appointment and a high-workload goal, then confirm a tiny action fits a true free window and the workload warning is transparent. If the day has ended, adjust working hours or test the next day rather than expecting past suggestions.

Sources: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [internal distribution and registration](https://docs.expo.dev/build/internal-distribution/), [iOS submission](https://docs.expo.dev/submit/ios/), [SQLCipher native configuration](https://docs.expo.dev/versions/latest/sdk/sqlite/).
