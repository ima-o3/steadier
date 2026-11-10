import { ScheduleRow } from "../src/components/ScheduleRow";
import { Routines } from "../src/components/Routines";
import { syncCalendars } from "../src/integrations/googleCalendar/client";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { TodayOverview } from "../src/components/TodayOverview";
import { Rating } from "../src/components/Rating";
import { makeEasier } from "../src/features/planner/makeEasier";
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
import { WelcomeOnboarding } from "../src/components/WelcomeOnboarding";
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
  const router = useRouter();
  const params = useLocalSearchParams<{ tutorial?: string }>();
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
        "Pick a pace, then make a plan.",
    ),
    [edit, setEdit] = useState(""),
    [move, setMove] = useState(""),
    [editTitle, setEditTitle] = useState(""),
    [editDuration, setEditDuration] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<
    "all" | "task" | "habit"
  >("all");
  const [generating, setGenerating] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState("");
  const checkinRequest = useRef(0);
  const pageRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const checkinY = useRef(0);
  const plannerY = useRef(0);
  const showPlanner = () =>
    pageRef.current?.scrollTo({ y: plannerY.current, animated: true });
  const items = s.plans[date] || [];
  const feasibility = assessGoals(
    s.goals,
    s.actions,
    s.commitments,
    s.preferences,
    date,
  );
  const commit = (fn: Parameters<typeof update>[0]) =>
    void update(fn).catch((e) => Alert.alert("Could not save", message(e)));
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
      if (request === checkinRequest.current) setCheckinStatus("Saved");
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
  async function generate(selected = mode) {
    if (generating) return;
    setGenerating(true);
    try {
      let refreshed: typeof s.commitments | undefined;
      let calendarError: string | undefined;
      if (s.calendarIds.length) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          refreshed = await Promise.race([
            syncCalendars(s.calendarIds, date, s.preferences.zone),
            new Promise<never>((_, reject) => {
              timer = setTimeout(
                () => reject(new Error("Calendar refresh timed out.")),
                20000,
              );
            }),
          ]);
        } catch (e) {
          calendarError = `Using saved availability: ${message(e)}`;
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      let savedExplanation = "";
      await update((old) => {
        const commitments = refreshed
          ? [
              ...old.commitments.filter((c) => c.source !== "google"),
              ...refreshed,
            ]
          : old.commitments;
        const report = assessGoals(
          old.goals,
          old.actions,
          commitments,
          old.preferences,
          date,
        );
        const result = planDay({
          date,
          preferences: old.preferences,
          commitments,
          actions: old.actions,
          goals: old.goals,
          mode: selected,
          energy: old.checkins.find((c) => c.date === date)?.energy,
          overloaded:
            report.status === "Currently infeasible" ||
            report.status === "At risk",
          habits: old.habits,
          existing: old.plans[date] || [],
          excludedActionIds: old.excludedActions[date] || [],
          now: new Date().toISOString(),
        });
        savedExplanation = result.explanation;
        return {
          ...old,
          commitments,
          calendarError,
          lastSync: refreshed ? new Date().toISOString() : old.lastSync,
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
        };
      });
      setMode(selected);
      setExplanation(savedExplanation);
    } catch (e) {
      Alert.alert("Plan needs an edit", message(e));
    } finally {
      setGenerating(false);
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
  const simplifyDay = () => {
    void update((old) => makeEasier(old, date, new Date().toISOString()))
      .then(() => {
        setExplanation(
          "Flexible work was reduced where possible. Pinned, started and completed items stay. If no flexible items remain, choose a plan below.",
        );
        showPlanner();
      })
      .catch((e) => Alert.alert("Could not simplify plan", message(e)));
  };
  if (!s.onboarded || params.tutorial === "1") return <WelcomeOnboarding />;

  return (
    <Page scrollRef={pageRef}>
      <TodayOverview
        onPlan={showPlanner}
        onEasier={simplifyDay}
        onCalendar={() => router.push("/calendar")}
        onSettings={() => router.push("/settings")}
        onComplete={(item) => changeItem(item, { completed: !item.completed })}
        onCheckin={() =>
          pageRef.current?.scrollTo({ y: checkinY.current, animated: true })
        }
      />
      {s.demo && (
        <Copy small>
          DEMO DATA · Examples are stored locally. Clear demo data in Settings
          before recording personal observations.
        </Copy>
      )}
      <View
        onLayout={(event) => {
          checkinY.current = event.nativeEvent.layout.y;
        }}
      >
        <Card>
          <Heading>How are you today?</Heading>
          {s.preferences.tracking ? (
            <>
              <Copy small>1 = low · 10 = high · saves automatically</Copy>
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
                title={
                  details ? "Show fewer fields" : "Add sleep or notes"
                }
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
                    label="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                  <Button
                    title="Save these details"
                    onPress={() => void run()}
                  />
                </>
              )}
            </>
          ) : (
            <Copy>Tracking is disabled in Settings.</Copy>
          )}
        </Card>
      </View>

      <View
        onLayout={(event) => {
          plannerY.current = event.nativeEvent.layout.y;
        }}
      >
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
            title={
              generating
                ? "Refreshing availability…"
                : s.planMeta?.[date]
                  ? "Regenerate my day"
                  : "Generate my day"
            }
            disabled={generating}
            onPress={() => generate()}
          />
          {(!!s.planMeta?.[date] || items.some((item) => !item.completed)) && (
            <Button title="Reset today’s plan" onPress={resetPlan} />
          )}
          <Copy small>{explanation}</Copy>
          <Copy small>
            {s.lastSync
              ? `Calendar last synced ${new Date(s.lastSync).toLocaleString("en-GB")}. Selected calendars refresh when you generate a plan.`
              : "Google Calendar is not synced. Availability may be incomplete; add manual commitments in Settings."}
            {s.calendarError ? ` ${s.calendarError}` : ""}
          </Copy>
        </Card>
      </View>
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
        <Copy small>A calm, realistic plan for your day.</Copy>
        <Row>
          <Button
            title="Today"
            selected={scheduleFilter === "all"}
            onPress={() => setScheduleFilter("all")}
          />
          <Button title="Plan" onPress={showPlanner} />
          <Button
            title="Focus"
            selected={scheduleFilter === "task"}
            onPress={() => setScheduleFilter("task")}
          />
          <Button
            title="Recovery"
            selected={scheduleFilter === "habit"}
            onPress={() => setScheduleFilter("habit")}
          />
        </Row>
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
              title: `${c.title}${c.allDay ? " (all day)" : ""}`,
              item: undefined,
            })),
        ]
          .filter(
            (row) =>
              scheduleFilter === "all" || row.item?.kind === scheduleFilter,
          )
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((row) => (
            <ScheduleRow
              key={row.id}
              title={row.title}
              start={clock(row.start, s.preferences.zone)}
              end={clock(row.end, s.preferences.zone)}
              label={
                !row.item
                  ? "Fixed"
                  : row.item.kind === "habit"
                    ? "Recovery · Small routine"
                    : row.item.locked
                      ? "Pinned"
                      : "Suggested"
              }
              completed={row.item?.completed}
              onComplete={
                row.item
                  ? () =>
                      changeItem(row.item!, { completed: !row.item!.completed })
                  : undefined
              }
            >
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
            </ScheduleRow>
          ))}
        {scheduleFilter !== "all" &&
          !items.some((i) => i.kind === scheduleFilter) && (
            <Copy small>
              No {scheduleFilter === "task" ? "focus tasks" : "small routines"}{" "}
              scheduled. Choose Today to see everything.
            </Copy>
          )}
        <Row>
          <Button title="Make easier" onPress={simplifyDay} />
          <Button
            title={generating ? "Generating…" : "Regenerate"}
            disabled={generating}
            onPress={() => generate()}
          />
        </Row>
      </Card>
      <Routines />
    </Page>
  );
}
