# Daily planning v1

1. Convert the date's work interval and protected rest interval to UTC using the configured zone.
2. Union busy commitment intervals, adding the user-defined preparation/recovery buffer to each side. Free/transparent events do not block. All-day events block only when the user enables that override.
3. Preserve pinned/completed plan items. If one conflicts with current availability or another pinned item, explain the conflict and require an edit. Nothing silently overwrites appointments.
4. Subtract preserved items, clip free windows to the current instant when generating in the app, and reserve most free time. Suggested goal-work budgets are recovery 20%, steady 45%, momentum 65% of remaining available minutes.
5. Reserve at most one modest habit, then consider active-goal actions whose prerequisites are complete. Rank by personal importance, priority and deadline. Never alter those goal priorities.
6. Choose a full, smaller or minimum variant. Recovery begins with the minimum; steady reduces high-effort actions; momentum can use full actions. If a candidate will not fit a free window or budget, try smaller versions or leave it unscheduled.
7. Limit new goal actions to 1, 3 or 4 respectively. Leave configurable breaks after actions, with an additional break after high-effort work. No catch-up debt or skipped-day penalty exists.

Mode recommendations use reported energy only (missing energy defaults to steady). The user must choose/accept the recommendation. Mood, sleep and wellbeing remain visible context; they do not covertly lower capacity. Automatic sleep-based adjustments and historical capacity learning are deferred. Plans do not infer clinical state.

Manual moves and duration changes recheck commitments, buffers, rest and other plan items. Edits pin the changed item; users can unpin. Removed actions are excluded from that day's later generations. Replacement finds another unblocked action that fits around preserved suggestions. Regeneration is explicit. Fully completed actions are not resuggested. Completing a smaller version records that plan item, leaves the full action open, and keeps remaining effort available for manual revision. Habit plan completion also records its habit log in the same transaction.

The allocator is a deterministic greedy personal planner, not a global scheduling optimizer. It uses one daily working window/rest window, not separate weekday routines. Travel time is never inferred from locations. The v1 habit allocator includes only one selected-by-order routine per generated plan; other habits remain manually trackable. Custom recurrence scheduling, protected meal windows beyond the single rest interval and multi-resource optimization remain future work.
