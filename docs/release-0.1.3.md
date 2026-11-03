# Steadier 0.1.3 (iOS build 4)

Uses the user's supplied lotus PNG unchanged as the app icon. The interface takes loose inspiration from the supplied dashboard reference: lavender surfaces, white rounded cards, dark purple typography, and distinct native navigation shapes. There is no animal imagery.

Today opens with a seven-day check-in strip. Selecting a day shows its recorded mood, energy, and sleep; missing values remain explicitly unrecorded, and zero hours of sleep remains zero. The strip uses the user's configured timezone and indicates days with mood or energy observations. Existing check-in controls continue to edit today only, labelled “How are you today?”.

The previous release's immediate score saving, wellbeing calendar, day-plan reset, and explained planning choices remain in place. Light and dark appearances both use the new theme.

Validation: TypeScript and all 70 tests passed locally (62 core, 8 component tests). The new component test verifies historical-day selection, missing values, and zero sleep hours. GitHub run 41630546808 passed native simulator startup and device compilation. The startup screenshot was visually inspected; the database was created with a non-plaintext SQLite header. The IPA is version 0.1.3, build 4, with its AppIcon configured. Its checksum matches the build metadata: `0849872878ae9979895e0f61392d7b82709af4d3486106c75bed43ad81bfb0f3`. Phone installation remains a user step.

Install the resulting versioned IPA through Sideloadly over the existing app using the same Apple ID. Do not uninstall the existing app: its observations are stored locally.
