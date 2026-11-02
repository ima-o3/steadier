# Local data model

Migration `src/database/migrations/001.ts` creates **23 tables** and sets `PRAGMA user_version=1`. Migration execution is transactional. A database version newer than this app is rejected. New migrations should be added in order, never by modifying an already released migration.

| Tables                                                      | Responsibility                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| users_local_settings, planning_preferences                  | Local app state, IANA zone, routine, capacity assumptions, optional tracking and appearance |
| goals, milestones, actions                                  | Stable IDs, parent foreign keys, status, estimates, deadlines and work                      |
| action_variants, action_dependencies                        | Reduced versions and prerequisite edges with foreign keys                                   |
| commitments                                                 | UTC event instants, busy/free, all-day civil dates and manual/Google/demo provenance        |
| calendar_accounts, calendar_selections, calendar_sync_state | Account metadata allocation (reserved), selected calendar IDs and sync freshness/error      |
| daily_checkins                                              | Original optional observations, unique local date                                           |
| sleep_records, screen_usage_records                         | Separate manually sourced measurements keyed by local date                                  |
| habit_definitions, habit_logs                               | Flexible frequency, minimum routine and local date completions                              |
| daily_plans, plan_items, plan_revisions                     | Date-based plans, action links, user edits, snapshots and planner version                   |
| wellbeing_indicators, pattern_insights                      | Derived, versioned observations kept separate from source entries                           |
| goal_feasibility_reports                                    | Versioned report and traceable assumptions                                                  |
| suggestion_feedback                                         | Helpful/dismissed observation feedback                                                      |

Mutable entities use stable UUIDs or deterministic source IDs, ISO UTC `updated_at`, and typed JSON payloads. Goal/action/milestone and plan relationships are additionally enforced by SQL foreign keys. Time-of-day instants use UTC ISO strings with milliseconds. Check-in and habit dates are civil `YYYY-MM-DD` values in the selected IANA zone. Deadlines are civil dates; calendar all-day ends are exclusive. Original calendar descriptions, locations and attendee lists are discarded. Native OAuth tokens are never database fields.

Goal effort ranges are minutes of remaining effort; app forms display hours. Frequency means desired work days/week and minimum progress is minutes per session. Workload percentages are not clinical measures. Completing an action does not silently revise uncertain goal effort; update it in Goals.

Deletion runs the same transaction and clears source and derived measurement tables. SQLite logical deletion is not a forensic secure erase guarantee; encryption protects the database at rest. Export is versioned JSON of application state, including plan revisions and source observations, without tokens or database keys. Import/restore is not implemented.
