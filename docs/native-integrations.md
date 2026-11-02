# Deferred native investigations

## Read-only HealthKit sleep

Apple exposes sleep as category samples via [sleepAnalysis](https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/sleepanalysis) and [sleep category values](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis). A future native module needs the HealthKit capability, a clear usage description, explicit read-only authorization and date-bounded sample queries. No HealthKit capability or authorization request is enabled in this build.

Proposed reconciliation: retain source/sample identity and UTC intervals, distinguish in-bed from asleep and sleep-stage observations, union overlapping asleep intervals rather than adding duplicate sources, and display conflicting sources for user review. Keep manual estimates separate and never treat missing authorized records as zero sleep. Recorded device/watch data is still an observation, not a reliable deduction of sleep from phone inactivity. A native proof of concept and real Health app fixtures are required before this flag can be enabled.

## Screen Time

Apple's [Family Controls entitlement process](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement) requires distribution approval and appropriate requests for relevant app extensions. DeviceActivity reporting/monitoring needs native extension targets; it cannot be implemented by simply requesting unrestricted other-app telemetry from JavaScript. Apple's [app and website usage entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.family-controls.app-and-website-usage) has additional access requirements that must be checked against the deployment target and granted account capabilities before any implementation choice.

Keep v1 manual screen-time observations. A future prototype must establish exactly what privacy-preserving reports Apple permits for an individually authorized adult user, where those reports can be displayed, and whether any export to the main app is supported. Do not design around covert collection, infer unrestricted access, or request blocking/shielding controls merely to collect wellbeing data. Both feature modules remain disabled; no entitlement approval or native extension is claimed.
