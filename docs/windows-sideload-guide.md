# Steadier on an iPhone from Windows, without paid Apple membership

This route compiles the app on a GitHub-hosted Mac, downloads an **unsigned physical-device IPA**, then uses Sideloadly on Windows to sign/install with your own free Apple ID. You do not need to own a Mac. Installation and actual device operation still need testing; the cloud output alone is not proof the app runs on your phone.

## 1. Get the IPA

The private repository is `ima-o3/steadier`. Open **Actions → iPhone IPA for Windows sideloading → Run workflow**. The workflow is manual-only, has a 45-minute timeout, and retains artifacts for 3 days. A new source version requires a build; a weekly signing refresh does not.

When the run succeeds, download the **Steadier-unsigned-iphone** artifact and extract the ZIP. Keep `Steadier-unsigned.ipa`, its SHA-256 checksum and `build-info.json` on your Windows PC. The IPA includes a Release JavaScript bundle and does not require Metro or Expo Go. Apple passwords, certificates and provisioning profiles are not passed to GitHub.

Private repositories use the GitHub account's included Actions allowance, and macOS runs consume that allowance. Keep paid overages disabled and stop if the included allowance is exhausted. This route does not promise unlimited free cloud compilation. Do not make this personal project public just to change billing.

## 2. Install from Windows

1. Download Sideloadly for Windows from its official site: [sideloadly.io](https://sideloadly.io/). Follow its current Windows prerequisites for Apple device drivers/iTunes/iCloud. Avoid unrelated download mirrors.
2. Connect your unlocked iPhone 15 Pro to the PC with a data-capable USB cable. On the phone, accept **Trust This Computer** and enter its passcode when prompted.
3. Open Sideloadly. Choose your iPhone and drag in `Steadier-unsigned.ipa`.
4. Enter your own Apple ID in Sideloadly and complete Apple's authentication there. Do not put the password, verification codes or recovery information in GitHub, project files or this chat. Sideloadly is a third-party signing tool; it handles the Apple sign-in locally through its supported flow.
5. Keep a stable app identifier for Steadier. The cloud build uses `com.ima03.steadier`; record the final identifier if the signing tool adjusts it. Preserve the same Apple ID and final identifier for updates and refreshes. Do not inject extra tweaks or enable unrelated app capabilities.
6. Enable Sideloadly's **automatic refresh** option and start installation.
7. If iOS asks, trust your developer profile under **Settings → General → VPN & Device Management**. Enable **Settings → Privacy & Security → Developer Mode** when required, restart and confirm.
8. Open **Steadier** from its own Home Screen icon. Test demo data, SQLCipher startup, save/relaunch and airplane-mode operation before relying on real observations.

## 3. Refresh before seven days expire

Free Apple ID signatures normally last seven days. Sideloadly's daemon can refresh near expiry when your phone is reachable over USB or configured Wi-Fi and the PC is running. For Wi-Fi, follow Sideloadly's instructions to enable device Wi-Fi sync; use USB for the first installation and as a fallback.

Keep the same IPA, Apple ID and final bundle identifier. If automatic refresh does not happen, connect the phone and re-sign/reinstall over the existing app. Do not uninstall as a first troubleshooting step: removal may destroy the local database, and changing signing identity may change Keychain access. Export data to a destination you trust before updates when possible. A weekly refresh is a signing operation, not a new cloud build.

## Calendar and encryption notes

SQLCipher and SecureStore remain enabled. This is the native app, not a preview with unencrypted persistence. Actual native encryption and free-account re-signing/Keychain continuity require device validation.

The first build works without Google credentials using manual/demo commitments. To enable native Google Calendar later, create an iOS OAuth client for the **final signed bundle identifier**, set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `GOOGLE_IOS_URL_SCHEME` as repository Actions variables, and rebuild. Never add a Google client secret or Apple credentials to the workflow. If a sideloader changes the bundle identifier, the Google OAuth configuration must match that final identity.

## Development commands in a fresh PowerShell window

The project includes a launcher that finds this machine's bundled Node/pnpm without requiring a temporary function:

```powershell
cd "C:\Users\Idris\Desktop\Personal Projects\Depression Management App"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pnpm.ps1 typecheck
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pnpm.ps1 test
```

## Sources

- [Sideloadly official Windows download and features](https://sideloadly.io/)
- [Sideloadly signing lifetime, updates, Developer Mode and refresh requirements](https://sideloadly.io/faq)
- [GitHub standard macOS runners and private-repository usage](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [Expo native project generation](https://docs.expo.dev/workflow/continuous-native-generation/)
