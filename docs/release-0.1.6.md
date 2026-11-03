# Steadier 0.1.6 (iOS build 7)

Goals now has Active, Completed and Archive sections with counts. Status changes move goals between sections; paused goals remain in Active with a paused label. Completed and archived goals can be restored to Active.

The goal delete control is a horizontal slide-to-reveal track. Sliding right reveals Delete; pressing Delete opens confirmation. Sliding alone never deletes. Tapping the arrow provides an accessible alternative to the gesture, and Keep goal hides the revealed control.

Milestones and actions are separated into labelled pastel blue and pastel red panels. Each has add, edit, delete and complete/reopen controls. Add work opens its sheet immediately, with Action and Milestone choices. Both forms show a goal selector and preselect the goal from which they were opened. Existing work can be reassigned. Action milestone choices are filtered to the chosen goal, with an explicit No milestone option.

Deleting a milestone detaches its actions without deleting them. Moving a milestone to another goal also detaches actions belonging to its old goal; the form explains this. Deleting an action clears dependent references and unfinished plan suggestions while retaining completed plan text and revision history. Work saves await persistence, keep drafts on failure, and preserve completion state on edits.

Validation covers section transitions and restore, visible add-work forms, creation and reassignment for both work types, edits, confirmation before deletion, failed-save drafts, and deletion through relational persistence. Native simulator and physical-device validation are pending the new build; touch gesture behaviour still needs checking on the phone.

Local checks passed: strict TypeScript, 64 core tests and 17 component tests (81 total).
