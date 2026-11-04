# Personal Sideloadly → TestFlight migration

Apple Developer membership and team CUY2KJ4PL6 were verified in the developer portal. The existing registered identifier is `com.ima03.steadier.CUY2KJ4PL6`, matching the installed app and Google iOS OAuth registration.

The new EAS `testflight` profile builds a store-signed Release app with that exact identity, public Google configuration and the locally reviewed app version/build number. The unsigned GitHub workflow remains available with its existing base ID. No new Google client or billing configuration is needed.

Before installing, export current data from the phone to Files. Keep the existing app installed. Verify signing entitlements and keychain access groups against the current installation before replacing it: equal bundle and team IDs are necessary, but do not alone prove access to the previous SQLCipher key. Never reset the database to work around a missing key.

The user confirmed a phone-local backup and accepted App Store Connect terms. App record **6830824398** was created for Steadier. Pending steps: configure authorized Apple distribution credentials and App Store provisioning in EAS, then approve the cloud build. Do not paste Apple passwords, codes or private keys into chat or Git. No EAS paid upgrade or purchase is authorized.

Build command, after credentials and explicit build approval:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm.ps1 dlx eas-cli@latest build --platform ios --profile testflight
```

Submit the verified resulting build by its exact EAS build ID, not an ambiguous latest build. The App Store Connect app ID is configured in `submit.testflight.ios.ascAppId`. Uploading for TestFlight does not submit the app for public App Review. SQLCipher export-compliance answers must be reviewed accurately; exemption is not predeclared.

Sources: https://docs.expo.dev/submit/ios/ and https://docs.expo.dev/submit/testflight/.
