import { palette } from "../../src/components/palette";
import React, { useState } from "react";
import { Alert, Modal, Text, View, Pressable } from "react-native";
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
} from "../../src/components/ui";
import { FeasibilitySimulator } from "../../src/components/FeasibilitySimulator";
import { GoalProgress } from "../../src/components/GoalProgress";
import { WorkRow } from "../../src/components/WorkRow";
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
  const [selectedGoal, setSelectedGoal] = useState("");
  const [goalStatus, setGoalStatus] = useState<Goal["status"]>("active");
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
    setGoalStatus("active");
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
                setFormVisible(false);
                setSelectedGoal("");
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
    setGoalStatus(g.status);
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
        status: goalStatus,
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
  return (
    <Page
      key={selectedGoal || "overview"}
      title={selectedGoal ? undefined : "Goals"}
    >
      {!!selectedGoal && (
        <Button title="Back to goals" onPress={() => setSelectedGoal("")} />
      )}
      {!selectedGoal && (
        <>
          <Button title="Add goal" onPress={newGoal} />
          <Row>
            {(["active", "completed", "archived"] as const).map((tab) => (
              <Button
                key={tab}
                title={`${tab === "active" ? "Active" : tab === "completed" ? "Completed" : "Archive"} (${s.goals.filter((g) => inSection(g, tab)).length})`}
                selected={section === tab}
                onPress={() => setSection(tab)}
              />
            ))}
          </Row>
          {s.goals.length > 0 && visibleGoals.length === 0 && (
            <Copy>No goals in this section yet.</Copy>
          )}
        </>
      )}
      {work && <WorkEditor selection={work} onClose={() => setWork(null)} />}
      {s.goals.length === 0 && (
        <Card>
          <Heading>Make room for something that matters</Heading>
          <Copy>Add your first goal. You can keep it small.</Copy>
        </Card>
      )}
      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setFormVisible(false);
        }}
      >
        <Page>
          <Card>
            <Heading>{editing ? "Edit goal" : "New goal"}</Heading>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
            />
            <Field
              label="Desired deadline YYYY-MM-DD · optional"
              value={deadline}
              onChangeText={setDeadline}
            />
            <Field
              label="Personal importance 1–5"
              value={importance}
              onChangeText={setImportance}
              numeric
            />
            <Field
              label="Priority · 1 is highest"
              value={priority}
              onChangeText={setPriority}
              numeric
            />
            <Field
              label="Remaining hours · lower estimate"
              value={min}
              onChangeText={setMin}
              numeric
            />
            <Field
              label="Remaining hours · upper estimate"
              value={max}
              onChangeText={setMax}
              numeric
            />
            <Button
              title={
                goalDetails
                  ? "Hide planning details"
                  : "Planning details · optional"
              }
              onPress={() => setGoalDetails(!goalDetails)}
            />
            {goalDetails && (
              <>
                <Field
                  label="Category"
                  value={category}
                  onChangeText={setCategory}
                />
                <Field
                  label="Days of work per week"
                  value={frequency}
                  onChangeText={setFrequency}
                  numeric
                />
                <Field
                  label="Minimum viable progress · minutes"
                  value={minimum}
                  onChangeText={setMinimum}
                  numeric
                />
              </>
            )}
            <Copy small>Goal status</Copy>
            <Row>
              {(["active", "completed", "archived"] as const).map((status) => (
                <Button
                  key={status}
                  title={
                    status === "active"
                      ? "Active"
                      : status === "completed"
                        ? "Completed"
                        : "Archived"
                  }
                  selected={goalStatus === status}
                  onPress={() => setGoalStatus(status)}
                />
              ))}
            </Row>
            {goalStatus === "paused" && (
              <Copy small>
                This older goal remains paused until you choose another status.
              </Copy>
            )}
            {!!editing && (
              <SlideDelete
                name={name}
                onDelete={() => {
                  const goal = s.goals.find((g) => g.id === editing);
                  if (goal) remove(goal);
                }}
              />
            )}
            <Button
              title={saving ? "Saving…" : "Save goal"}
              disabled={saving}
              onPress={() => void save()}
            />
            <Button
              title="Cancel"
              disabled={saving}
              onPress={() => setFormVisible(false)}
            />
          </Card>
        </Page>
      </Modal>
      {!selectedGoal &&
        visibleGoals.map((g) => {
          const milestones = s.milestones.filter((m) => m.goalId === g.id);
          const actions = s.actions.filter((a) => a.goalId === g.id);
          const total = milestones.length + actions.length;
          const done =
            milestones.filter((m) => m.completed).length +
            actions.filter((a) => a.completed).length;
          const result = assessGoals(
            [{ ...g, status: "active" }],
            s.actions,
            s.commitments,
            s.preferences,
            localDate(s.preferences.zone),
          );
          return (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              accessibilityLabel={`Open goal: ${g.name}`}
              onPress={() => setSelectedGoal(g.id)}
            >
              <Card>
                <Heading>{g.name}</Heading>
                <Copy small>
                  {g.deadline || "No deadline"} · Priority {g.priority}
                  {g.status === "paused" ? " · Previously paused" : ""}
                </Copy>
                <Copy>{result.status}</Copy>
                <GoalProgress done={done} total={total} />
                {result.status !== "Feasible" && (
                  <Copy small>
                    {result.missing[0] ||
                      result.bottlenecks[0] ||
                      "Required effort may exceed sustainable capacity."}
                  </Copy>
                )}
              </Card>
            </Pressable>
          );
        })}
      {s.goals
        .filter((g) => g.id === selectedGoal)
        .map((g) => (
          <Card key={g.id}>
            <Heading>{g.name}</Heading>
            {!!g.description && <Copy>{g.description}</Copy>}
            <Copy small>
              {g.status === "paused" ? "Paused · " : ""}
              {g.deadline || "No deadline"} · priority {g.priority}
            </Copy>
            <Copy>
              {
                assessGoals(
                  [{ ...g, status: "active" }],
                  s.actions,
                  s.commitments,
                  s.preferences,
                  localDate(s.preferences.zone),
                ).status
              }
            </Copy>
            <GoalProgress
              done={
                s.milestones.filter((m) => m.goalId === g.id && m.completed)
                  .length +
                s.actions.filter((a) => a.goalId === g.id && a.completed).length
              }
              total={
                s.milestones.filter((m) => m.goalId === g.id).length +
                s.actions.filter((a) => a.goalId === g.id).length
              }
            />
            <Copy small>
              {
                s.milestones.filter((m) => m.goalId === g.id && m.completed)
                  .length
              }{" "}
              of {s.milestones.filter((m) => m.goalId === g.id).length}{" "}
              milestones ·{" "}
              {s.actions.filter((a) => a.goalId === g.id && a.completed).length}{" "}
              of {s.actions.filter((a) => a.goalId === g.id).length} actions
              complete
            </Copy>
            <Row>
              <Button title="Edit goal" onPress={() => edit(g)} />
              <Button
                title="Add work"
                onPress={() => setWork({ goalId: g.id, kind: "action" })}
              />
            </Row>
            <View
              style={{
                backgroundColor: palette.milestone,
                borderRadius: 20,
                padding: 14,
                gap: 12,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  color: palette.milestoneText,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                Milestones
              </Text>
              {s.milestones.filter((m) => m.goalId === g.id).length === 0 && (
                <Text style={{ color: palette.milestoneText }}>
                  No milestones yet.
                </Text>
              )}
              {s.milestones
                .filter((m) => m.goalId === g.id)
                .map((m) => (
                  <WorkRow
                    key={m.id}
                    kind="milestone"
                    title={m.name}
                    completed={m.completed}
                    onToggle={() =>
                      commit((old) => ({
                        ...old,
                        milestones: old.milestones.map((x) =>
                          x.id === m.id ? { ...x, completed: !x.completed } : x,
                        ),
                      }))
                    }
                    onEdit={() =>
                      setWork({ goalId: g.id, kind: "milestone", editId: m.id })
                    }
                    onDelete={() => deleteWork("milestone", m.id, m.name)}
                  />
                ))}
              <Button
                title="Add milestone"
                onPress={() => setWork({ goalId: g.id, kind: "milestone" })}
              />
            </View>
            <View
              style={{
                backgroundColor: palette.action,
                borderRadius: 20,
                padding: 14,
                gap: 12,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  color: palette.actionText,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                Actions
              </Text>
              {s.actions.filter((a) => a.goalId === g.id).length === 0 && (
                <Text style={{ color: palette.actionText }}>
                  No actions yet.
                </Text>
              )}
              {s.actions
                .filter((a) => a.goalId === g.id)
                .map((a) => (
                  <WorkRow
                    key={a.id}
                    kind="action"
                    title={a.title}
                    completed={a.completed}
                    subtitle={`${a.minutes} min${a.milestoneId ? " · " + (s.milestones.find((m) => m.id === a.milestoneId)?.name || "Milestone") : ""}`}
                    onToggle={() =>
                      commit((old) => ({
                        ...old,
                        actions: old.actions.map((x) =>
                          x.id === a.id ? { ...x, completed: !x.completed } : x,
                        ),
                      }))
                    }
                    onEdit={() =>
                      setWork({ goalId: g.id, kind: "action", editId: a.id })
                    }
                    onDelete={() => deleteWork("action", a.id, a.title)}
                  />
                ))}
              <Button
                title="Add action"
                onPress={() => setWork({ goalId: g.id, kind: "action" })}
              />
            </View>
          </Card>
        ))}
      {!selectedGoal && <FeasibilitySimulator />}
      <Button
        title={
          capacityVisible ? "Hide capacity details" : "View capacity details"
        }
        onPress={() => setCapacityVisible(!capacityVisible)}
      />
      {capacityVisible && (
        <>
          <Card>
            <Heading>{report.status}</Heading>
            <Copy>
              Required: {(report.required.low / 60).toFixed(1)}–
              {(report.required.high / 60).toFixed(1)} h/week
            </Copy>
            <Copy>
              Sustainable: {(report.capacity.low / 60).toFixed(1)}–
              {(report.capacity.high / 60).toFixed(1)} h/week
            </Copy>
            <Copy small>{report.assumptions}</Copy>
            {[
              ...report.missing,
              ...report.bottlenecks,
              ...report.suggestions,
            ].map((text, i) => (
              <Copy key={i} small>
                {text}
              </Copy>
            ))}
            <Copy small>
              Workload/capacity ratio: {report.ratio?.toFixed(2) ?? "unknown"} ·
              peak projected weekly overload:{" "}
              {(report.peakWeeklyOverload / 60).toFixed(1)} h · scheduling
              margin: {(report.buffer / 60).toFixed(1)} h
            </Copy>
          </Card>
        </>
      )}
    </Page>
  );
}
