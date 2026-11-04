# Steadier 0.1.7 (iOS build 8)

This is a release-version correction following 0.1.6 (build 7). It does **not** introduce additional application functionality. The iOS app version is now 0.1.7, the build number is 8, and the JavaScript package version is aligned at 0.1.7.

The manual GitHub Actions iPhone workflow now labels the unsigned artifact with its version and build number and checks the packaged IPA's Info.plist values against the source Expo configuration before publishing the artifact. The bundle identifier remains `com.ima03.steadier` for the GitHub device build. The verification step does not guarantee that the app will sign or launch on a physical iPhone.

**Important:** Previously downloaded 0.1.6 IPA files remain 0.1.6 (build 7). Trigger a new iPhone workflow on `main` and download its new artifact to obtain the 0.1.7 (build 8) IPA. The workflow does not start automatically on a version change.
