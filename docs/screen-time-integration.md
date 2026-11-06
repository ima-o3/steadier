# November 6 feedback / Screen Time integration

Completed locally: remove Daily functioning check-in input and exclude the retired factor from the steadiness score (historical data retained); show trend-chart dates newest first.

Automatic Screen Time is pending, not implemented. Manual screen-minute observations remain explicitly manual.

Apple requires Family Controls distribution approval for the app and Device Activity Report extension before distribution. A native report extension displays device activity inside Apple's privacy sandbox after individual authorization. Do not copy report data into the React Native database or assume it can feed the steadiness score. Plan the native report as a separate read-only Screen Time view, keep denial/revocation states and manual fallback, and test on a physical iPhone.

Proposed extension identifier: com.ima03.steadier.CUY2KJ4PL6.ScreenTimeReport. Requires an Expo config plugin/native module and extension target, entitlement approval, and updated provisioning. Do not weaken encryption or change the installed app's identity. User submitted the Family Controls & Personal Device Usage request on November 6, 2026. Apple confirmed receipt under request SG4N8496DP and will contact the account holder after review. Receipt is not approval. Native module, extension target, provisioning and device verification remain outstanding.

Sources:
- https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement
- https://developer.apple.com/documentation/deviceactivity/deviceactivityreport

A new signed iOS build is required to distribute changed code; uploading build 13 again would not include these changes. No build or submission has been started for this feedback.

