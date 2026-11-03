# Version 0.1.2

- Today has a reset action that clears unfinished suggestions (including pinned ones) and their exclusions. Completed work, goals and fixed appointments remain. The previous plan is retained in revision history.
- Mood and energy are saved when a score is tapped. The calendar updates from saved state immediately, and Today's score and save status are visible. Sleep, screen time and notes retain a separate save button.
- Day planning now offers Take it easy, A balanced day and A fuller day, with a description of each workload and one generate/regenerate button. Selecting an option alone does not rewrite the schedule.
- The theme uses Linen #F7F5F2, Sky #D2DDE7, Berry #D5A0A8, Sunrise #EE9F80 and Watermelon #E37E7F. Dark mode uses warm backgrounds with the same accent family. Dark text keeps pastel controls readable.

Validation: strict TypeScript, 62 core tests and 7 component tests pass locally and on the macOS runner. The new interaction tests cover immediate check-in/calendar updates, reset preservation, and day-choice behavior. The native simulator opened the updated Today screen; its screenshot was visually inspected, and the database-header check confirmed encrypted storage.

[Build 41627261921](https://github.com/ima-o3/steadier/actions/runs/41627261921) succeeded from commit `6e08a96a2b32865391e91ba0272008dec57d9e02`. The unsigned IPA is available locally at `build/sideload-0.1.2/Steadier-0.1.2.ipa`. Its downloaded SHA-256 matches `069465367940d2023e03086a5e43b9fb2b7e9d57e45ee1cc0a1304a768317e06`. Version 0.1.2 uses build number 3 and the same bundle identifier as the previous build. Sideloadly signing and physical-device acceptance remain pending.
