import React, { useState } from "react";
import { Alert, Modal, Pressable, Text, View, useColorScheme } from "react-native";
import * as Crypto from "expo-crypto";
import { useStore } from "../../src/components/AppState";
import {
  Button,
  Card,
  Copy,
  Field,
  Heading,
  Page,
  Row,
  message,
  useTheme,
} from "../../src/components/ui";
import { SlideDelete } from "../../src/components/SlideDelete";
import { WorkEditor, WorkSelection } from "../../src/components/WorkEditor";
import {
  removeActions,
  removeMilestone,
  removeGoal,
} from "../../src/features/goals/removeGoal";
import { Goal } from "../../src/types";
import { assessGoals } from "../../src/engines/goalFeasibility";
import { localDate } from "../../src/utils/time";
export default function Goals() {
  const { state: s, update } = useStore();
  const [formVisible, setFormVisible] = useState(false);
  const [capacityVisible, setCapacityVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goalDetails, setGoalDetails] = useState(false);
  const [editing, setEditing] = useState(""),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [category, setCategory] = useState("Personal"),
    [importance, setImportance] = useState("3"),
    [priority, setPriority] = useState("1"),
    [deadline, setDeadline] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [frequency, setFrequency] = useState("3"),
    [minimum, setMinimum] = useState("5");
  const [section, setSection] = useState<"active" | "completed" | "archived">(
    "active",
  );
  const [work, setWork] = useState<WorkSelection | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const inSection = (g: Goal, tab = section) =>
    tab === "active"
      ? g.status === "active" || g.status === "paused"
      : g.status === tab;
  const visibleGoals = s.goals.filter((g) => inSection(g));
  function deleteWork(kind: "milestone" | "action", id: string, title: string) {
    Alert.alert(
      `Delete ${title}?`,
      kind === "milestone"
        ? "The milestone will be deleted. Its actions will stay in the goal without a milestone."
        : "The action and its unfinished plan suggestions will be deleted. Completed plan history stays.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void update((old) =>
              kind === "milestone"
                ? removeMilestone(old, id)
                : removeActions(old, new Set([id])),
            ).catch((e) => Alert.alert("Could not delete", message(e)));
          },
        },
      ],
    );
  }
  function changeStatus(g: Goal, status: Goal["status"]) {
    void update((old) => ({
      ...old,
      goals: old.goals.map((x) => (x.id === g.id ? { ...x, status } : x)),
    })).catch((e) => Alert.alert("Could not move goal", message(e)));
  }
  const report = assessGoals(
    s.goals,
    s.actions,
    s.commitments,
    s.preferences,
    localDate(s.preferences.zone),
  );
  const commit = (fn: Parameters<typeof update>[0]) =>
    void update(fn).catch((e) => Alert.alert("Could not save", message(e)));
  function newGoal() {
    setGoalDetails(false);
    setEditing("");
    setName("");
    setDescription("");
    setCategory("Personal");
    setImportance("3");
    setPriority("1");
    setDeadline("");
    setMin("");
    setMax("");
    setFrequency("3");
    setMinimum("5");
    setFormVisible(true);
  }
  function remove(g: Goal) {
    Alert.alert(
      `Delete ${g.name}?`,
      "This removes the goal, its milestones, actions and unfinished plan suggestions. Completed plan history and check-ins stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void update((old) => removeGoal(old, g.id))
              .then(() => {
                if (work?.goalId === g.id) setWork(null);
              })
              .catch((e) => Alert.alert("Could not remove goal", message(e)));
          },
        },
      ],
    );
  }
  function edit(g: Goal) {
    setGoalDetails(false);
    setFormVisible(true);
    setEditing(g.id);
    setName(g.name);
    setDescription(g.description);
    setCategory(g.category);
    setImportance(String(g.importance));
    setPriority(String(g.priority));
    setDeadline(g.deadline || "");
    setMin(g.effortMin === undefined ? "" : String(g.effortMin / 60));
    setMax(g.effortMax === undefined ? "" : String(g.effortMax / 60));
    setFrequency(String(g.frequency));
    setMinimum(String(g.minimumMinutes));
  }
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (!name.trim()) throw new Error("Give the goal a name.");
      if (
        deadline &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
          Number.isNaN(Date.parse(deadline)))
      )
        throw new Error("Use a valid YYYY-MM-DD deadline.");
      for (const v of [importance, priority, frequency, minimum])
        if (!Number.isFinite(Number(v)) || Number(v) < 1)
          throw new Error(
            "Importance, priority, frequency and minimum must be positive numbers.",
          );
      if (Number(importance) > 5 || Number(frequency) > 7)
        throw new Error("Importance is 1–5; frequency is 1–7 days/week.");
      if (
        (min || max) &&
        (!min ||
          !max ||
          !Number.isFinite(Number(min)) ||
          !Number.isFinite(Number(max)) ||
          Number(min) < 0 ||
          Number(max) < Number(min))
      )
        throw new Error(
          "Enter a valid lower and upper remaining hours estimate, or leave both blank.",
        );
      const id = editing || Crypto.randomUUID();
      const g: Goal = {
        id,
        name: name.trim(),
        description,
        category,
        importance: Number(importance),
        priority: Number(priority),
        deadline: deadline || undefined,
        effortMin: min ? Number(min) * 60 : undefined,
        effortMax: max ? Number(max) * 60 : undefined,
        frequency: Number(frequency),
        minimumMinutes: Number(minimum),
        status: s.goals.find((g) => g.id === id)?.status || "active",
      };
      await update((old) => ({
        ...old,
        goals: [...old.goals.filter((g) => g.id !== id), g],
      }));
      setFormVisible(false);
      setName("");
      setEditing("");
      setSection(g.status === "paused" ? "active" : g.status);
    } catch (e) {
      Alert.alert("Goal", message(e));
    } finally {
      setSaving(false);
    }
  }
  const t = useTheme();
  const systemAppearance = useColorScheme();
  const dark = s.preferences.appearance === "dark" || (s.preferences.appearance === "system" && systemAppearance === "dark");
  const activeCount = s.goals.filter((g) => g.status === "active").length;
  const completedCount = s.goals.filter((g) => g.status === "completed").length;
  const hasCompleteEstimate = activeCount > 0 && report.missing.length === 0;
  const ratio = hasCompleteEstimate ? report.ratio : null;
  const demand = `${(report.required.low / 60).toFixed(1)}–${(report.required.high / 60).toFixed(1)} h`;
  const capacity = `${(report.capacity.low / 60).toFixed(1)}–${(report.capacity.high / 60).toFixed(1)} h`;
  const barPercent = ratio == null ? 0 : Math.min(100, Math.max(0, (ratio / Math.max(1, ratio)) * 100));
  const summaryTone = report.status === "Feasible" ? "#5C8E7B" : report.status === "Insufficient information" ? "#7963A2" : "#AB795B";
  const sectionCounts = {
    active: s.goals.filter((g) => inSection(g, "active")).length,
    completed: s.goals.filter((g) => inSection(g, "completed")).length,
    archived: s.goals.filter((g) => inSection(g, "archived")).length,
  };
  const cardTone = dark ? "#38304F" : "#F3EEFF";
  return (
    <Page>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ fontSize: 35, letterSpacing: -1.1, fontWeight: "800", color: t.text }}>Your goals</Text>
          <Text style={{ color: t.muted, fontSize: 15, lineHeight: 21 }}>Meaningful progress, at your pace.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add goal"
          onPress={newGoal}
          style={({ pressed }) => ({ backgroundColor: t.accent, paddingHorizontal: 16, minHeight: 46, borderRadius: 16, justifyContent: "center", opacity: pressed ? 0.75 : 1 })}
        >
          <Text style={{ color: t.onAccent, fontWeight: "700", fontSize: 15 }}>+ Add goal</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: dark ? "#41375B" : "#E8DFFC", borderRadius: 28, padding: 21, gap: 13 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Text style={{ color: dark ? "#EBE2FF" : "#6550A0", fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>YOUR CAPACITY THIS WEEK</Text>
          <View style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 15, backgroundColor: dark ? "#55466B" : "#FFFFFF" }}>
            <Text style={{ color: dark ? "#EDE8FF" : summaryTone, fontWeight: "700", fontSize: 12 }}>{report.status}</Text>
          </View>
        </View>
        <Text style={{ color: t.text, fontSize: 23, fontWeight: "800", letterSpacing: -0.45, lineHeight: 30 }}>
          {activeCount === 0 ? "Start with one thing that matters" : report.status === "Feasible" ? "Your plans have breathing room" : report.status === "Insufficient information" ? "Let's estimate what's realistic" : "Your goals may need more room"}
        </Text>
        <Text style={{ color: t.muted, lineHeight: 21, fontSize: 14 }}>
          {activeCount === 0 ? "Add a goal and a realistic estimate to see your capacity." : report.status === "Feasible" ? "Your current workload fits the estimated time available. You can adjust it whenever life changes." : report.status === "Insufficient information" ? "Add deadlines and effort estimates to understand your workload better." : "This is about the plan, not your ability. Explore the assumptions and adjust the workload if needed."}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, borderRadius: 17, padding: 14, backgroundColor: dark ? "#54496B" : "#FFFFFFB8", gap: 5 }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Time required / week</Text>
            <Text style={{ color: t.text, fontSize: 19, fontWeight: "800" }}>{hasCompleteEstimate ? demand : "Add estimates"}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 17, padding: 14, backgroundColor: dark ? "#54496B" : "#FFFFFFB8", gap: 5 }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Sustainable capacity</Text>
            <Text style={{ color: t.text, fontSize: 19, fontWeight: "800" }}>{capacity}</Text>
          </View>
        </View>
        {hasCompleteEstimate && (
          <View style={{ gap: 6 }}>
            <View style={{ backgroundColor: dark ? "#5C506E" : "#D0C5EB", height: 9, borderRadius: 99, overflow: "hidden" }}>
              <View style={{ width: `${barPercent}%` as `${number}%`, height: "100%", backgroundColor: summaryTone, borderRadius: 99 }} />
            </View>
            <Text style={{ color: t.muted, fontSize: 12 }}>{ratio != null && ratio > 1 ? "Estimated demand exceeds the lower end of capacity." : "Estimated demand compared with available capacity."}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={capacityVisible ? "Hide capacity details" : "View capacity details"}
          onPress={() => setCapacityVisible(!capacityVisible)}
          style={({ pressed }) => ({ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: dark ? "#E5D9FF" : "#5D4BB0", fontSize: 14, fontWeight: "700" }}>{capacityVisible ? "Hide the breakdown" : "See how this is calculated"}</Text>
          <Text style={{ color: dark ? "#E5D9FF" : "#5D4BB0", fontSize: 18 }}>{capacityVisible ? "⌃" : "›"}</Text>
        </Pressable>
        {capacityVisible && (
          <View style={{ backgroundColor: dark ? "#302A45" : "#FCFAFF", borderRadius: 18, padding: 14, gap: 9 }}>
            <Text style={{ color: t.text, fontWeight: "700", fontSize: 15 }}>Your feasibility breakdown</Text>
            <Text style={{ color: t.muted, fontSize: 13, lineHeight: 20 }}>{report.assumptions}</Text>
            {[...report.missing, ...report.bottlenecks, ...report.suggestions].map((line, i) => (
              <Text key={`${i}-${line}`} style={{ color: t.text, fontSize: 13, lineHeight: 20 }}>• {line}</Text>
            ))}
            <Text style={{ color: t.muted, fontSize: 12 }}>Peak projected overload: {(report.peakWeeklyOverload / 60).toFixed(1)} h/week · Scheduling margin: {(report.buffer / 60).toFixed(1)} h/week</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: t.card, borderRadius: 22, padding: 16, gap: 4 }}>
          <Text style={{ fontSize: 23, fontWeight: "800", color: t.text }}>{activeCount}</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>Active goals</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: t.card, borderRadius: 22, padding: 16, gap: 4 }}>
          <Text style={{ fontSize: 23, fontWeight: "800", color: t.text }}>{completedCount}</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>Completed goals</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", backgroundColor: dark ? "#302A45" : "#E5DEF5", borderRadius: 18, padding: 4, gap: 4 }}>
        {(["active", "completed", "archived"] as const).map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityLabel={`${tab === "active" ? "Active" : tab === "completed" ? "Completed" : "Archive"} (${sectionCounts[tab]})`}
            accessibilityState={{ selected: section === tab }}
            onPress={() => { setSection(tab); setExpandedGoal(null); }}
            style={{ flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: section === tab ? t.card : "transparent", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}
          >
            <Text style={{ color: section === tab ? t.text : t.muted, fontSize: 13, fontWeight: section === tab ? "700" : "600" }}>
              {tab === "active" ? "Active" : tab === "completed" ? "Completed" : "Archive"} ({sectionCounts[tab]})
            </Text>
          </Pressable>
        ))}
      </View>

      {work && <WorkEditor selection={work} onClose={() => setWork(null)} />}

      {s.goals.length === 0 && (
        <Card>
          <Heading>Make room for something that matters</Heading>
          <Copy>Add your first goal. You can keep it small.</Copy>
        </Card>
      )}
      {s.goals.length > 0 && visibleGoals.length === 0 && <Card><Copy>No goals in this section yet.</Copy></Card>}

      {visibleGoals.map((g) => {
        const milestones = s.milestones.filter((m) => m.goalId === g.id);
        const actions = s.actions.filter((a) => a.goalId === g.id);
        const hasTasks = actions.length > 0;
        const totalSteps = hasTasks ? actions.length : milestones.length;
        const completedSteps = hasTasks ? actions.filter((a) => a.completed).length : milestones.filter((m) => m.completed).length;
        const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : null;
        const individual = g.status === "active" ? assessGoals([g], actions, s.commitments, s.preferences, localDate(s.preferences.zone)) : null;
        const feasibilityLabel = g.status === "paused" ? "Paused" : g.status === "completed" ? "Completed" : g.status === "archived" ? "Archived" : individual?.status || "Unknown";
        const badgeBg = feasibilityLabel === "Feasible" || feasibilityLabel === "Completed" ? (dark ? "#315448" : "#E6F3ED") : feasibilityLabel === "At risk" || feasibilityLabel === "Currently infeasible" ? (dark ? "#665047" : "#F6E8D8") : cardTone;
        const badgeText = feasibilityLabel === "Feasible" || feasibilityLabel === "Completed" ? (dark ? "#C1E4D3" : "#397C66") : feasibilityLabel === "At risk" || feasibilityLabel === "Currently infeasible" ? (dark ? "#F8D3B0" : "#9A674A") : t.muted;
        const isExpanded = expandedGoal === g.id;
        const dateLabel = g.deadline
          ? `Target ${new Date(`${g.deadline}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
          : "No target date";
        const goalAccent = g.category.toLowerCase().includes("health") || g.category.toLowerCase().includes("well") ? "#8EAA99" : g.category.toLowerCase().includes("career") || g.category.toLowerCase().includes("work") ? "#B4A0EB" : g.category.toLowerCase().includes("learn") || g.category.toLowerCase().includes("education") ? "#DFC39A" : "#D7B0C3";
        return (
          <View key={g.id} style={{ backgroundColor: t.card, borderRadius: 28, padding: 19, gap: 13 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: goalAccent }}>
                <Text style={{ fontSize: 23, color: "#3F3559" }}>✦</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: t.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7 }}>{g.category || "Personal"}</Text>
                <Text accessibilityRole="header" style={{ fontSize: 20, color: t.text, fontWeight: "800", letterSpacing: -0.3 }}>{g.name}</Text>
              </View>
            </View>
            {!!g.description && <Text numberOfLines={isExpanded ? undefined : 2} style={{ color: t.muted, fontSize: 14, lineHeight: 21 }}>{g.description}</Text>}
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <View style={{ alignSelf: "flex-start", backgroundColor: badgeBg, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15 }}><Text style={{ color: badgeText, fontSize: 12, fontWeight: "700" }}>{feasibilityLabel}</Text></View>
              <Text style={{ color: t.muted, fontSize: 12 }}>{dateLabel} · Priority {g.priority}</Text>
            </View>
            {individual && individual.missing.length === 0 && (
              <Text style={{ color: t.muted, fontSize: 12 }}>
                Needs {(individual.required.low / 60).toFixed(1)}–{(individual.required.high / 60).toFixed(1)} h/week at the current pace
              </Text>
            )}
            <View style={{ gap: 7 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: t.text, fontWeight: "700", fontSize: 13 }}>Progress</Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>{percent === null ? "Add steps to track" : `${completedSteps} of ${totalSteps} ${hasTasks ? "actions" : "milestones"}`}</Text>
              </View>
              <View style={{ height: 9, backgroundColor: dark ? "#4C425C" : "#EBE5F8", borderRadius: 99, overflow: "hidden" }}>
                {percent !== null && <View style={{ height: "100%", width: `${percent}%` as `${number}%`, backgroundColor: goalAccent, borderRadius: 99 }} />}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <GoalAction label="Add work" onPress={() => setWork({ goalId: g.id, kind: "action" })} primary dark={dark} />
              <GoalAction label="Edit goal" onPress={() => edit(g)} dark={dark} />
              <GoalAction label={isExpanded ? "Hide details" : `Manage details for ${g.name}`} accessibilityLabel={isExpanded ? `Hide details for ${g.name}` : `Manage details for ${g.name}`} onPress={() => setExpandedGoal(isExpanded ? null : g.id)} dark={dark} />
            </View>
            {isExpanded && (
              <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 15 }}>
                <View style={{ gap: 9, backgroundColor: dark ? "#38304F" : "#F3EFFB", borderRadius: 20, padding: 15 }}>
                  <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Milestones</Text>
                  {milestones.length === 0 && <Text style={{ color: t.muted }}>No milestones yet.</Text>}
                  {milestones.map((m) => (
                    <View key={m.id} style={{ gap: 7, paddingVertical: 5 }}>
                      <Text style={{ color: t.text, fontWeight: "600" }}>{m.completed ? "✓ " : "○ "}{m.name}</Text>
                      <Row>
                        <Button title={`Edit milestone: ${m.name}`} onPress={() => setWork({ goalId: g.id, kind: "milestone", editId: m.id })} />
                        <Button title={`Delete milestone: ${m.name}`} onPress={() => deleteWork("milestone", m.id, m.name)} />
                        <Button title={m.completed ? `Reopen milestone: ${m.name}` : `Complete milestone: ${m.name}`} onPress={() => commit((old) => ({ ...old, milestones: old.milestones.map((x) => x.id === m.id ? { ...x, completed: !x.completed } : x) }))} />
                      </Row>
                    </View>
                  ))}
                  <Button title="Add milestone" onPress={() => setWork({ goalId: g.id, kind: "milestone" })} />
                </View>
                <View style={{ gap: 9, backgroundColor: dark ? "#38304F" : "#F9F2F7", borderRadius: 20, padding: 15 }}>
                  <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>Actions</Text>
                  {actions.length === 0 && <Text style={{ color: t.muted }}>No actions yet.</Text>}
                  {actions.map((a) => (
                    <View key={a.id} style={{ gap: 7, paddingVertical: 5 }}>
                      <Text style={{ color: t.text, fontWeight: "600" }}>{a.completed ? "✓ " : "○ "}{a.title}</Text>
                      <Text style={{ color: t.muted, fontSize: 12 }}>{a.minutes} min{a.milestoneId ? ` · ${s.milestones.find((m) => m.id === a.milestoneId)?.name || "Milestone"}` : ""}</Text>
                      <Row>
                        <Button title={`Edit action: ${a.title}`} onPress={() => setWork({ goalId: g.id, kind: "action", editId: a.id })} />
                        <Button title={`Delete action: ${a.title}`} onPress={() => deleteWork("action", a.id, a.title)} />
                        <Button title={a.completed ? `Reopen action: ${a.title}` : `Complete action: ${a.title}`} onPress={() => commit((old) => ({ ...old, actions: old.actions.map((x) => x.id === a.id ? { ...x, completed: !x.completed } : x) }))} />
                      </Row>
                    </View>
                  ))}
                  <Button title="Add action" onPress={() => setWork({ goalId: g.id, kind: "action" })} />
                </View>
                <Row>
                  {g.status !== "completed" && <Button title="Complete goal" onPress={() => changeStatus(g, "completed")} />}
                  {g.status !== "archived" && <Button title="Archive goal" onPress={() => changeStatus(g, "archived")} />}
                  {(g.status === "completed" || g.status === "archived") && <Button title="Restore to active" onPress={() => changeStatus(g, "active")} />}
                  {(g.status === "active" || g.status === "paused") && <Button title={g.status === "paused" ? "Resume goal" : "Pause goal"} onPress={() => changeStatus(g, g.status === "paused" ? "active" : "paused")} />}
                </Row>
                <SlideDelete name={g.name} onDelete={() => remove(g)} />
              </View>
            )}
          </View>
        );
      })}

      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!saving) setFormVisible(false); }}>
        <Page>
          <Card>
            <Heading>{editing ? "Edit goal" : "New goal"}</Heading>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Description" value={description} onChangeText={setDescription} />
            <Button title={goalDetails ? "Hide planning details" : "Planning details · optional"} onPress={() => setGoalDetails(!goalDetails)} />
            {goalDetails && (
              <>
                <Field label="Category" value={category} onChangeText={setCategory} />
                <Field label="Personal importance 1–5" value={importance} onChangeText={setImportance} numeric />
                <Field label="Priority · 1 is highest" value={priority} onChangeText={setPriority} numeric />
                <Field label="Desired deadline YYYY-MM-DD · optional" value={deadline} onChangeText={setDeadline} />
                <Field label="Remaining hours · lower estimate" value={min} onChangeText={setMin} numeric />
                <Field label="Remaining hours · upper estimate" value={max} onChangeText={setMax} numeric />
                <Field label="Days of work per week" value={frequency} onChangeText={setFrequency} numeric />
                <Field label="Minimum viable progress · minutes" value={minimum} onChangeText={setMinimum} numeric />
              </>
            )}
            <Button title={saving ? "Saving…" : "Save goal"} disabled={saving} onPress={() => void save()} />
            <Button title="Cancel" disabled={saving} onPress={() => setFormVisible(false)} />
          </Card>
        </Page>
      </Modal>
    </Page>
  );
}

function GoalAction({ label, accessibilityLabel, onPress, dark, primary = false }: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  dark: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44, justifyContent: "center", paddingHorizontal: 14,
        borderRadius: 15, backgroundColor: primary ? (dark ? "#A995E7" : "#E4DAFF") : (dark ? "#42395C" : "#F1EDFA"),
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: dark ? (primary ? "#28204F" : "#F3EDFF") : "#45377B", fontSize: 13, fontWeight: "700" }}>{label.startsWith("Manage details for ") ? "Details ›" : label}</Text>
    </Pressable>
  );
}
