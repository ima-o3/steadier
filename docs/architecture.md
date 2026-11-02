# Architecture

The Expo Router app has four tab routes: Today, Goals, Insights and Settings. A brief, skippable welcome is embedded below the first heatmap. Shared native components provide safe areas, light/dark colours, scalable text, labelled inputs and controls of at least 48 points height. No animation is required for interaction. VoiceOver, largest text sizes and one-handed use still require physical-device QA.

`src/engines` has no React Native or network imports. `dailyPlanner` allocates actions in true free windows; `capacityModel` handles blocked interval union and buffers; `goalFeasibility` compares uncertain workload with sustainable capacity and deadline bottlenecks; `patternDetector` derives transparent wellbeing and energy observations. Engine versions are stored with derived data.

`src/utils/time` uses Temporal's polyfill and IANA zones for civil dates and DST. Native Google sign-in obtains authorization; the client fetches only Calendar GET endpoints. Full bounded refreshes expand recurrence instances for 91 days, paginate, normalize and deduplicate events, then atomically replace cached Google availability. A failure retains the previous cache and records a visible warning. There is no background sync.

`AppState` opens the encrypted repository before showing routes. All mutations serialize through a promise queue; persistence completes before the UI publishes the next state. Foreign keys and exclusive transactions ensure a failed save leaves previous data intact. SQLite SQLCipher support is checked at startup; a 256-bit random database key lives in SecureStore with device-only, when-unlocked accessibility. Native Google SDK credentials are owned by its Keychain storage, never SQLite. Tokens are used in memory and not logged.

The repository currently snapshots small personal datasets in a transaction. Relational entities and derived records have their own tables; some composite application state is mirrored in local settings JSON for reconstruction. This is an MVP tradeoff, not an optimized large-dataset persistence system. Before public scale, replace snapshot writes with entity-specific repositories and incremental queries, add schema migration fixtures and concurrency/performance testing. No sync infrastructure exists; stable IDs and migration versions leave room for optional future encrypted sync.

No clinical, productivity-to-wellbeing or emergency-response algorithm exists. Future Android work can reuse pure TypeScript engines, but Google native SDK configuration and Android encryption/device testing remain platform tasks.
