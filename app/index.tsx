import React, { useRef, useState } from "react";
import { Alert } from "react-native";
import * as Crypto from "expo-crypto";
import { Heatmap } from "../src/components/Heatmap";
import { Rating } from "../src/components/Rating";
import { resetDay } from "../src/features/planner/resetDay";
import { useStore } from "../src/components/AppState";
import {
  Button,
  Card,
  Copy,
  Field,
  Heading,
  Page,
  Row,
  message,
} from "../src/components/ui";
import { Mode, PlanItem } from "../src/types";
import { planDay, recommendMode } from "../src/engines/dailyPlanner";
import { indicator } from "../src/engines/patternDetector";
import {
  clock,
  localDate,
  addMinutes,
  duration,
  at,
  nextDate,
  fromLocal,
} from "../src/utils/time";
import { assessGoals } from "../src/engines/goalFeasibility";
import { editPlanItem } from "../src/features/planner/editPlan";
import { demoState } from "../src/features/demo";
import { freeWindows } from "../src/engines/capacityModel";
const dayChoices: Record<Mode, { title: string; description: string }> = {
  recovery: {
    title: "Take it easy",
    description:
      "Up to 1 small goal task. Shorter versions, with most of your free time left open.",
  },
  steady: {
    title: "A balanced day",
    description:
      "Up to 3 goal tasks. Smaller versions of demanding tasks, with room for breaks.",
  },
  momentum: {
    title: "A fuller day",
    description:
      "Up to 4 goal tasks. Full versions when they fit, while keeping breaks and protected rest.",
  },
};
export default function Today() {
  const { state: s, update } = useStore(),
    date = localDate(s.preferences.zone),
    check = s.checkins.find((c) => c.date === date);
  const [notes, setNotes] = useState(""),
    [sleep, setSleep] = useState(""),
    [quality, setQuality] = useState(""),
    [screen, setScreen] = useState(""),
    [details, setDetails] = useState(false),
    [mode, setMode] = useState<Mode>(s.planMeta?.[date]?.mode || "steady"),
    [explanation, setExplanation] = useState(
      s.planMeta?.[date]?.explanation ||
        "Choose how much to take on, then generate your day.",
    ),
    [edit, setEdit] = useState(""),
    [move, setMove] = useState(""),
    [editTitle, setEditTitle] = useState(""),
    [editDuration, setEditDuration] = useState("");
  const [checkinStatus, setCheckinStatus] = useState("");
  const checkinRequest = useRef(0);
  const items = s.plans[date] || [];
  const feasibility = assessGoals(
    s.goals,
    s.actions,
    s.commitments,
    s.preferences,
    date,
  );
  const recent = s.checkins.filter(
    (c) => c.date >= nextDate(date, -6) && c.date <= date,
  );
  const average = (key: "mood" | "energy") => {
    const values = recent
      .map((c) => c[key])
      .filter((v): v is number => v !== undefined);
    return values.length
      ? `${(values.reduce((n, v) => n + v, 0) / values.length).toFixed(1)} (${values.length} recorded days)`
      : "no observations";
  };
  const commit = (fn: Parameters<typeof update>[0]) =>
    void update(fn).catch(() => {});
  async function saveRating(field: "energy" | "mood", score: number) {
    const request = ++checkinRequest.current;
    setCheckinStatus("Saving…");
    try {
      const id = Crypto.randomUUID();
      await update((old) => {
        const existing = old.checkins.find((c) => c.date === date);
        return {
          ...old,
          checkins: [
            ...old.checkins.filter((c) => c.date !== date),
            { ...existing, id: existing?.id || id, date, [field]: score },
          ],
        };
      });
      if (request === checkinRequest.current)
        setCheckinStatus("Saved · your wellbeing calendar is up to date.");
    } catch {
      if (request === checkinRequest.current)
        setCheckinStatus("Could not save. Please tap your score again.");
    }
  }
  function resetPlan() {
    Alert.alert(
      "Reset today’s plan?",
      "Clear all unfinished suggestions, including pinned ones. Completed work and calendar appointments stay. You can generate a fresh plan afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset plan",
          onPress: () => {
            void update((old) => resetDay(old, date, new Date().toISOString()))
              .then(() => {
                setEdit("");
                setExplanation(
                  "Plan reset. Choose how much to take on and generate a fresh day when you’re ready.",
                );
              })
              .catch(() => {});
          },
        },
      ],
    );
  }
  function generate(selected = mode) {
    try {
      const result = planDay({
        date,
        preferences: s.preferences,
        commitments: s.commitments,
        actions: s.actions,
        goals: s.goals,
        mode: selected,
        habits: s.habits,
        existing: items,
        excludedActionIds: s.excludedActions[date] || [],
        now: new Date().toISOString(),
      });
      setMode(selected);
      setExplanation(result.explanation);
      commit((old) => ({
        ...old,
        planMeta: {
          ...old.planMeta,
          [date]: {
            mode: selected,
            version: result.version,
            explanation: result.explanation,
            createdAt: new Date().toISOString(),
          },
        },
        plans: { ...old.plans, [date]: result.items },
        revisions: [
          ...old.revisions,
          {
            date,
            at: new Date().toISOString(),
            reason: `Generate ${selected}`,
            items: old.plans[date] || [],
          },
        ],
      }));
    } catch (e) {
      Alert.alert("Plan needs an edit", message(e));
    }
  }
  function changeItem(item: PlanItem, change: Partial<PlanItem>) {
    commit((old) => editPlanItem(old, date, item.id, change));
  }
  function easier(item: PlanItem) {
    if (item.kind === "habit" && item.variant === 0) {
      const habit = s.habits.find((h) => `${date}-${h.id}` === item.id);
      if (habit?.minimum) {
        changeItem(item, {
          title: habit.minimum,
          end: addMinutes(item.start, Math.min(habit.minutes, 5)),
          variant: 1,
        });
        return;
      }
    }
    const action = s.actions.find((a) => a.id === item.actionId);
    const variant = action?.variants[item.variant];
    if (!variant) {
      Alert.alert(
        "Smallest version",
        "This is already the smallest configured version. You can remove it or rest.",
      );
      return;
    }
    changeItem(item, {
      title: variant.title,
      end: addMinutes(item.start, variant.minutes),
      variant: item.variant + 1,
    });
  }
  function replace(item: PlanItem) {
    try {
      const others = items.filter((i) => i.id !== item.id);
      const result = planDay({
        date,
        preferences: s.preferences,
        commitments: s.commitments,
        actions: s.actions.filter((a) => a.id !== item.actionId),
        goals: s.goals,
        mode,
        existing: others.map((i) => ({ ...i, locked: true })),
        excludedActionIds: s.excludedActions[date],
        now: new Date().toISOString(),
      });
      const replacement = result.items.find(
        (i) => !others.some((o) => o.id === i.id) && i.kind === "task",
      );
      if (!replacement)
        throw new Error(
          "No other unblocked action fits. Add another action in Goals or leave this time free.",
        );
      commit((old) => ({
        ...old,
        plans: {
          ...old.plans,
          [date]: [...others, { ...replacement, locked: true }].sort((a, b) =>
            a.start.localeCompare(b.start),
          ),
        },
        excludedActions: {
          ...old.excludedActions,
          [date]: [
            ...(old.excludedActions[date] || []),
            ...(item.actionId ? [item.actionId] : []),
          ],
        },
        revisions: [
          ...old.revisions,
          {
            date,
            at: new Date().toISOString(),
            reason: "Replace action",
            items: old.plans[date] || [],
          },
        ],
      }));
    } catch (e) {
      Alert.alert("Replace action", message(e));
    }
  }
  const run = async () => {
    try {
      const score = (v: string) => (v.trim() ? Number(v) : undefined);
      for (const v of [quality])
        if (
          v.trim() &&
          (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 10)
        )
          throw new Error(
            "Scores must be whole numbers from 1 to 10, or blank.",
          );
      if (
        sleep &&
        (!Number.isFinite(Number(sleep)) ||
          Number(sleep) < 0 ||
          Number(sleep) > 24)
      )
        throw new Error("Sleep must be between 0 and 24 hours.");
      if (
        screen &&
        (!Number.isFinite(Number(screen)) ||
          Number(screen) < 0 ||
          Number(screen) > 1440)
      )
        throw new Error("Screen time must be between 0 and 1440 minutes.");
      await update((old) => {
        const saved = old.checkins.find((c) => c.date === date);
        return {
          ...old,
          checkins: [
            ...old.checkins.filter((c) => c.date !== date),
            {
              ...saved,
              id: saved?.id || Crypto.randomUUID(),
              date,
              notes: notes || saved?.notes,
              sleepQuality: score(quality) ?? saved?.sleepQuality,
              sleepHours: score(sleep) ?? saved?.sleepHours,
              screenMinutes: score(screen) ?? saved?.screenMinutes,
            },
          ],
        };
      });
      setNotes("");
      Alert.alert(
        "Saved on this device",
        "Your observations are separate from task progress.",
      );
    } catch (e) {
      Alert.alert("Check-in", message(e));
    }
  };
  return (
    <Page>
      {s.demo && (
        <Copy small>
          DEMO DATA · Examples are stored locally. Clear demo data in Settings
          before recording personal observations.
        </Copy>
      )}
      {!s.onboarded && (
        <Card>
          <Heading>A steadier day</Heading>
          <Copy>
            Start with a check-in or add a goal. Everything is optional.
            Settings lets you choose your routine and connect a calendar.
          </Copy>
          <Button
            title="Start with my own data"
            onPress={() => commit((old) => ({ ...old, onboarded: true }))}
          />
          <Button
            title="Explore deterministic demo"
            disabled={
              s.goals.length > 0 ||
              s.checkins.length > 0 ||
              s.commitments.length > 0
            }
            onPress={() => commit(demoState)}
          />
        </Card>
      )}
      <Card>
        <Heading>How are you today?</Heading>
        <Copy small>
          Last 7 days · mood {average("mood")} · energy {average("energy")}.
          Recorded observations only.
        </Copy>
        <Copy small>
          {check
            ? `Recorded: mood ${check.mood ?? "—"}, energy ${check.energy ?? "—"}. ${indicator(check)?.explanation || ""}`
            : "No check-in yet. Skipping is okay."}
        </Copy>
        {s.preferences.tracking ? (
          <>
            <Copy small>
              Tap a number to save immediately. 1 is very low; 10 is very high.
              Either score is optional.
            </Copy>
            <Rating
              label="Energy"
              value={check?.energy}
              onSelect={(score) => void saveRating("energy", score)}
            />
            <Rating
              label="Mood"
              value={check?.mood}
              onSelect={(score) => void saveRating("mood", score)}
            />
            {!!checkinStatus && <Copy small>{checkinStatus}</Copy>}
            <Button
              title={details ? "Fewer fields" : "Sleep, screen time and notes"}
              onPress={() => setDetails(!details)}
            />
            {details && (
              <>
                <Field
                  label="Sleep hours · optional"
                  value={sleep}
                  onChangeText={setSleep}
                  numeric
                />
                <Field
                  label="Sleep quality 1–10 · optional"
                  value={quality}
                  onChangeText={setQuality}
                  numeric
                />
                <Field
                  label="Screen minutes · optional"
                  value={screen}
                  onChangeText={setScreen}
                  numeric
                />
                <Field
                  label="Symptoms or annotation · optional"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
                <Button title="Save these details" onPress={() => void run()} />
              </>
            )}
          </>
        ) : (
          <Copy>Tracking is disabled in Settings.</Copy>
        )}
      </Card>
      <Heatmap />
      <Card>
        <Heading>Plan your day</Heading>
        <Copy>How much do you want to take on?</Copy>
        <Copy small>
          Suggested: {dayChoices[recommendMode(check?.energy)].title} based on{" "}
          {check?.energy === undefined
            ? "no energy data; a neutral default"
            : `reported energy ${check.energy}/10`}
          . You can choose any option.
        </Copy>
        <Row>
          {(["recovery", "steady", "momentum"] as Mode[]).map((m) => (
            <Button
              key={m}
              title={dayChoices[m].title}
              selected={mode === m}
              onPress={() => setMode(m)}
            />
          ))}
        </Row>
        <Copy>{dayChoices[mode].description}</Copy>
        <Copy small>
          Choosing an option changes the next generated plan. Pinned and
          completed items stay when regenerating.
        </Copy>
        <Button
          title={s.planMeta?.[date] ? "Regenerate my day" : "Generate my day"}
          onPress={() => generate()}
        />
        {(!!s.planMeta?.[date] || items.some((item) => !item.completed)) && (
          <Button title="Reset today’s plan" onPress={resetPlan} />
        )}
        <Copy small>{explanation}</Copy>
        <Copy small>
          {s.lastSync
            ? `Calendar last synced ${new Date(s.lastSync).toLocaleString("en-GB")}. Refresh in Settings before relying on availability.`
            : "Google Calendar is not synced. Availability may be incomplete; add manual commitments in Settings."}
          {s.calendarError ? ` ${s.calendarError}` : ""}
        </Copy>
      </Card>
      <Card>
        <Heading>Room for your goals</Heading>
        <Copy>{feasibility.status}</Copy>
        <Copy small>
          {feasibility.status === "Insufficient information"
            ? "Add remaining effort estimates and deadlines in Goals."
            : `Estimated workload ${(feasibility.required.low / 60).toFixed(1)}–${(feasibility.required.high / 60).toFixed(1)} h/week; sustainable capacity ${(feasibility.capacity.low / 60).toFixed(1)}–${(feasibility.capacity.high / 60).toFixed(1)} h/week. See Goals for assumptions and options.`}
        </Copy>
      </Card>
      <Card>
        <Heading>Today’s schedule</Heading>
        {!items.length && (
          <Copy>
            No suggested actions. Add a goal and an action, or leave room for
            rest.
          </Copy>
        )}
        {items
          .filter((i) => i.kind === "task")
          .slice(0, 3)
          .map((i, n) => (
            <Copy key={`priority-${i.id}`}>
              {n === 0 ? "Priority" : "Supporting"}: {i.title}
            </Copy>
          ))}
        {[
          ...items.map((i) => ({
            id: i.id,
            start: i.start,
            end: i.end,
            title: i.title,
            item: i,
          })),
          ...s.commitments
            .filter(
              (c) =>
                c.start < at(nextDate(date, 1), 0, s.preferences.zone) &&
                c.end > at(date, 0, s.preferences.zone),
            )
            .map((c) => ({
              id: c.id,
              start: c.start,
              end: c.end,
              title: `Fixed · ${c.title}${c.allDay ? " (all day)" : ""}`,
              item: undefined,
            })),
        ]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((row) => (
            <Card key={row.id}>
              <Copy>
                {clock(row.start, s.preferences.zone)}–
                {clock(row.end, s.preferences.zone)} · {row.title}
              </Copy>
              {row.item && (
                <>
                  <Row>
                    <Button
                      title={
                        row.item.completed ? "Undo completion" : "Complete"
                      }
                      onPress={() => {
                        const item = row.item!;
                        changeItem(item, { completed: !item.completed });
                      }}
                    />
                    <Button
                      title="Make this easier"
                      onPress={() => easier(row.item!)}
                    />
                    <Button
                      title={row.item.locked ? "Unpin" : "Pin"}
                      onPress={() =>
                        changeItem(row.item!, { locked: !row.item!.locked })
                      }
                    />
                  </Row>
                  {row.item.kind === "task" && row.item.variant > 0 && (
                    <Copy small>
                      Completing this smaller version records today’s progress.
                      The full action and its remaining estimate stay available
                      in Goals.
                    </Copy>
                  )}
                  <Button
                    title="Move / edit time"
                    onPress={() => {
                      setEdit(row.id);
                      setMove(clock(row.start, s.preferences.zone));
                      setEditTitle(row.title);
                      setEditDuration(String(duration(row.start, row.end)));
                    }}
                  />
                  <Button
                    title="Replace with another action"
                    onPress={() => replace(row.item!)}
                  />
                  <Button
                    title="Remove suggestion"
                    onPress={() =>
                      commit((old) => ({
                        ...old,
                        excludedActions: {
                          ...old.excludedActions,
                          [date]: [
                            ...(old.excludedActions[date] || []),
                            ...(row.item?.actionId ? [row.item.actionId] : []),
                          ],
                        },
                        plans: {
                          ...old.plans,
                          [date]: (old.plans[date] || []).filter(
                            (i) => i.id !== row.id,
                          ),
                        },
                      }))
                    }
                  />
                  {edit === row.id && (
                    <>
                      <Field
                        label="Suggested action title"
                        value={editTitle}
                        onChangeText={setEditTitle}
                      />
                      <Field
                        label="Duration minutes"
                        value={editDuration}
                        onChangeText={setEditDuration}
                        numeric
                      />
                      <Field
                        label="Start time HH:mm"
                        value={move}
                        onChangeText={setMove}
                      />
                      <Button
                        title="Save new time"
                        onPress={() => {
                          try {
                            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(move))
                              throw new Error("Use HH:mm.");
                            if (
                              !editTitle.trim() ||
                              !Number.isFinite(Number(editDuration)) ||
                              Number(editDuration) < 1
                            )
                              throw new Error(
                                "Use a title and a positive duration.",
                              );
                            const start = fromLocal(
                                date,
                                move,
                                s.preferences.zone,
                              ),
                              end = addMinutes(start, Number(editDuration));
                            const blockers = [
                              ...s.commitments,
                              ...items
                                .filter((i) => i.id !== row.id)
                                .map((i) => ({
                                  ...i,
                                  busy: true,
                                  source: "manual" as const,
                                })),
                            ];
                            if (
                              !freeWindows(date, s.preferences, blockers).some(
                                (w) => start >= w.start && end <= w.end,
                              )
                            )
                              throw new Error(
                                "That time conflicts with a commitment, buffer, another task or protected rest.",
                              );
                            changeItem(row.item!, {
                              start,
                              end,
                              title: editTitle.trim(),
                            });
                            setEdit("");
                          } catch (e) {
                            Alert.alert("Move task", message(e));
                          }
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </Card>
          ))}
      </Card>
      <Card>
        <Heading>Small routines</Heading>
        {s.habits.length === 0 && (
          <Copy>Add a flexible routine in Settings.</Copy>
        )}
        {s.habits.map((h) => (
          <Button
            key={h.id}
            title={`${s.habitLogs[date]?.includes(h.id) ? "✓ " : ""}${h.name} · aim ${h.daysPerWeek}/week`}
            onPress={() =>
              commit((old) => {
                const logs = old.habitLogs[date] || [];
                return {
                  ...old,
                  habitLogs: {
                    ...old.habitLogs,
                    [date]: logs.includes(h.id)
                      ? logs.filter((id) => id !== h.id)
                      : [...logs, h.id],
                  },
                };
              })
            }
          />
        ))}
      </Card>
    </Page>
  );
}
