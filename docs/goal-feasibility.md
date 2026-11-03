# Goal feasibility v1

The assessment concerns **workload**, not number of goals. Active goals require remaining effort bounds and a deadline; missing estimates yield **Insufficient information**, with named missing fields.

For each of the next 13 weeks, compute actual free windows after appointments, buffers, non-working hours and protected rest. Cap free minutes by the user-defined discretionary weekly ceiling. Sustainable capacity is a conservative range, initially 40–60% of those minutes. Users can edit both percentages and the ceiling.

For each estimated goal, required minutes/week is remaining effort divided by weeks until the inclusive deadline, with a floor of desired work frequency × minimum session duration. Sum across active goals for a workload range. Report required range, first-week capacity range, upper-demand/lower-capacity ratio, maximum projected weekly overload and conservative scheduling margin.

Cumulative minimum effort for all goals due by each deadline within 91 days is compared with sustainable capacity through that date, detecting competing demands even when goals fit independently. Check smallest unblocked action variants against actual free windows before their deadline using a greedy bin allocation, plus whether enough days have a window for requested frequency. Additionally, across all goals sharing a deadline horizon, check necessary contiguous-slot capacity for each minimum session length, so two goals cannot both claim the same unique long window. Dependency-blocked goals are explained.

Classification:

- **Insufficient information:** no active goals or any active goal lacks estimate/deadline.
- **Currently infeasible:** a concrete deadline/window/dependency bottleneck is detected under the entered estimates and availability assumptions.
- **At risk:** upper demand exceeds lower sustainable capacity, or minimum weekly rate exceeds upper sustainable capacity without a concrete deadline/window bottleneck. This avoids calling very short-deadline weekly-rate extrapolations a proof of impossibility.
- **Feasible:** the stated minimum constraints and conservative bounds fit this heuristic.

Reports disclose assumptions and offer scope reduction, deadline extension or pausing suggestions. These never edit priorities or goals automatically. First-week capacity is intentionally conservative; a temporary busy week can flag risk even for a long goal.

This is an uncertainty-aware heuristic, not a proof of all tasks meeting every deadline. Per-goal bins and joint necessary-condition session counts are checked, but these are not a complete inter-goal resource-constrained scheduling proof. Smaller variants may represent partial progress rather than completion of the full task. Beyond 13 weeks the model projects weekly demand without claiming known future calendar availability. Remaining effort includes milestones and must be updated manually to avoid double counting tasks. Milestone-level deadlines, uncertainty propagation from individual estimates, historical completion-derived capacity and an interactive counterfactual comparison are not implemented yet.
