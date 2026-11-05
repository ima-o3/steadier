# Steadier 0.1.12 draft

Latest WhatsApp feedback (Idris’ personal lists, November 5, 22:00–22:10): remove awkward numbers around the ring; size ring segments according to factor values; Daily functioning has no effect; easier dependency viewing; hide completed actions after each day; show three actions with View all actions for the remainder.

Implemented: an autosaving Daily functioning rating, variable ring arcs with icon labels and detailed factor chips, visible dependency names and completion status in goal action rows, a three-action preview and expandable full list, and completion dates for actions completed from goals or plans. Older completed actions remain in the full list. Existing completed actions without a recorded date appear only in the full list.

Ring arcs reflect normalized scores, with a small minimum arc to keep zero/missing factors discoverable. The total score still averages recorded factors equally. No clinical interpretation is added. Export/restore retains completion dates.

Prepared locally only; no cloud build or TestFlight upload is requested at this stage. More features are expected before release.

Habit tracker implemented: dedicated dashboard opened from Today and Settings, existing history preserved, rolling weekly targets, 28-day grid, lifetime counts and add/edit/delete controls. Habit completion synchronizes with today's scheduled habit. TypeScript, 80 core tests, 36 component tests and local iOS export passed. Release 0.1.12 build 13; cloud build authorized, upload remains on hold.
