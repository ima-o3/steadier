# Version 0.1.2

- Today has a reset action that clears unfinished suggestions (including pinned ones) and their exclusions. Completed work, goals and fixed appointments remain. The previous plan is retained in revision history.
- Mood and energy are saved when a score is tapped. The calendar updates from saved state immediately, and Today's score and save status are visible. Sleep, screen time and notes retain a separate save button.
- Day planning now offers Take it easy, A balanced day and A fuller day, with a description of each workload and one generate/regenerate button. Selecting an option alone does not rewrite the schedule.
- The theme uses Linen #F7F5F2, Sky #D2DDE7, Berry #D5A0A8, Sunrise #EE9F80 and Watermelon #E37E7F. Dark mode uses warm backgrounds with the same accent family. Dark text keeps pastel controls readable.

Validation: strict TypeScript, 62 core tests and 7 component tests pass locally. The new interaction tests cover immediate check-in/calendar updates, reset preservation, and day-choice behavior. Native build and physical-device acceptance are recorded separately.
