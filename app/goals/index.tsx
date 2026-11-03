import React, { useState } from "react";
import { Alert, Modal } from "react-native";
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
import { removeGoal } from "../../src/features/goals/removeGoal";
import { Goal } from "../../src/types";
import { assessGoals } from "../../src/engines/goalFeasibility";
import { localDate } from "../../src/utils/time";
import { validateDependencies } from "../../src/features/goals/dependencies";
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
    [minimum, setMinimum] = useState("5"),
    [goalId, setGoalId] = useState(""),
    [milestoneId, setMilestoneId] = useState(""),
    [milestone, setMilestone] = useState(""),
    [title, setTitle] = useState(""),
    [minutes, setMinutes] = useState("30"),
    [effort, setEffort] = useState("5"),
    [small, setSmall] = useState(""),
    [smallMinutes, setSmallMinutes] = useState("10"),
    [tiny, setTiny] = useState(""),
    [dependency, setDependency] = useState(""),
    [editingAction, setEditingAction] = useState("");
  const report = assessGoals(
    s.goals,
    s.actions,
    s.commitments,
    s.preferences,
    localDate(s.preferences.zone),
  );
  const commit = (fn: Parameters<typeof update>[0]) =>
    void update(fn).catch(() => {});
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
      `Remove ${g.name}?`,
      "This removes the goal, its milestones, actions and unfinished plan suggestions. Completed plan history and check-ins stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove goal",
          style: "destructive",
          onPress: () => {
            void update((old) => removeGoal(old, g.id))
              .then(() => {
                if (goalId === g.id) setGoalId("");
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
      setGoalId(id);
    } catch (e) {
      Alert.alert("Goal", message(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Page title="Goals">
      <Button title="Add goal" onPress={newGoal} />
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
                  label="Desired deadline YYYY-MM-DD · optional"
                  value={deadline}
                  onChangeText={setDeadline}
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
      {s.goals.map((g) => (
        <Card key={g.id}>
          <Heading>{g.name}</Heading>
          <Copy>
            {g.status} · importance {g.importance}/5 · priority {g.priority}
          </Copy>
          <Copy small>
            {g.description} · {g.deadline || "No deadline"} · remaining{" "}
            {g.effortMin === undefined
              ? "unknown"
              : `${g.effortMin / 60}–${g.effortMax! / 60} h`}
          </Copy>
          <Copy small>
            {
              s.milestones.filter((m) => m.goalId === g.id && m.completed)
                .length
            }
            /{s.milestones.filter((m) => m.goalId === g.id).length} milestones
            achieved.{" "}
            {s.actions.filter((a) => a.goalId === g.id && a.completed).length}{" "}
            actions completed. Remaining effort is manually estimated;
            completion does not silently change it.
          </Copy>
          <Row>
            <Button title="Edit goal" onPress={() => edit(g)} />
            <Button title="Remove goal" onPress={() => remove(g)} />
            <Button
              title="Add work"
              onPress={() => {
                setGoalId(g.id);
                setEditingAction("");
                setTitle("");
                setSmall("");
                setTiny("");
                setDependency("");
                setMilestoneId("");
              }}
            />
            {(["active", "paused", "completed", "archived"] as const)
              .filter((status) => status !== g.status)
              .map((status) => (
                <Button
                  title={status}
                  key={status}
                  onPress={() =>
                    commit((old) => ({
                      ...old,
                      goals: old.goals.map((x) =>
                        x.id === g.id ? { ...x, status } : x,
                      ),
                    }))
                  }
                />
              ))}
          </Row>
          {s.milestones
            .filter((m) => m.goalId === g.id)
            .map((m) => (
              <Button
                key={m.id}
                title={`${m.completed ? "✓ " : ""}${m.name}`}
                onPress={() =>
                  commit((old) => ({
                    ...old,
                    milestones: old.milestones.map((x) =>
                      x.id === m.id ? { ...x, completed: !x.completed } : x,
                    ),
                  }))
                }
              />
            ))}
          {s.actions
            .filter((a) => a.goalId === g.id)
            .map((a) => (
              <React.Fragment key={a.id}>
                <Copy small>
                  {a.completed ? "✓ " : ""}
                  {a.title} · {a.minutes} min · {a.variants.length} smaller
                  versions · ID {a.id}
                </Copy>
                <Button
                  title={`Edit ${a.title}`}
                  onPress={() => {
                    setGoalId(a.goalId);
                    setEditingAction(a.id);
                    setMilestoneId(a.milestoneId || "");
                    setTitle(a.title);
                    setMinutes(String(a.minutes));
                    setEffort(String(a.effort));
                    setSmall(a.variants[0]?.title || "");
                    setSmallMinutes(String(a.variants[0]?.minutes || 10));
                    setTiny(a.variants[1]?.title || "");
                    setDependency(a.dependencies.join(","));
                  }}
                />
              </React.Fragment>
            ))}
        </Card>
      ))}
      {goalId && (
        <Card>
          <Heading>
            Add work to {s.goals.find((g) => g.id === goalId)?.name}
          </Heading>
          <Field
            label="New milestone name"
            value={milestone}
            onChangeText={setMilestone}
          />
          <Button
            title="Add milestone"
            onPress={() => {
              if (!milestone.trim()) return;
              const id = Crypto.randomUUID();
              commit((old) => ({
                ...old,
                milestones: [
                  ...old.milestones,
                  { id, goalId, name: milestone.trim(), completed: false },
                ],
              }));
              setMilestoneId(id);
              setMilestone("");
            }}
          />
          <Copy small>Select parent milestone (optional)</Copy>
          {s.milestones
            .filter((m) => m.goalId === goalId)
            .map((m) => (
              <Button
                title={m.name}
                key={m.id}
                selected={milestoneId === m.id}
                onPress={() => setMilestoneId(m.id)}
              />
            ))}
          <Field label="Action name" value={title} onChangeText={setTitle} />
          <Field
            label="Duration · minutes"
            value={minutes}
            onChangeText={setMinutes}
            numeric
          />
          <Field
            label="Effort 1–10"
            value={effort}
            onChangeText={setEffort}
            numeric
          />
          <Field
            label="Smaller version · optional"
            value={small}
            onChangeText={setSmall}
          />
          <Field
            label="Smaller version minutes"
            value={smallMinutes}
            onChangeText={setSmallMinutes}
            numeric
          />
          <Field
            label="Minimum version · 5 minutes · optional"
            value={tiny}
            onChangeText={setTiny}
          />
          <Field
            label="Dependency action IDs · comma-separated · optional"
            value={dependency}
            onChangeText={setDependency}
          />
          <Button
            title={editingAction ? "Save action changes" : "Add action"}
            onPress={() => {
              if (
                !title.trim() ||
                !Number.isFinite(Number(minutes)) ||
                Number(minutes) < 1 ||
                !Number.isFinite(Number(effort)) ||
                Number(effort) < 1 ||
                Number(effort) > 10 ||
                (small &&
                  (!Number.isFinite(Number(smallMinutes)) ||
                    Number(smallMinutes) < 1 ||
                    Number(smallMinutes) > Number(minutes))) ||
                (tiny && Number(minutes) < 5)
              ) {
                Alert.alert(
                  "Action",
                  "Use a title, positive duration, effort 1–10 and smaller versions within the full duration.",
                );
                return;
              }
              const id = editingAction || Crypto.randomUUID(),
                dependencies = dependency
                  .split(",")
                  .map((d) => d.trim())
                  .filter(Boolean);
              try {
                validateDependencies(id, dependencies, s.actions);
              } catch (e) {
                Alert.alert("Dependency", message(e));
                return;
              }
              commit((old) => ({
                ...old,
                actions: [
                  ...old.actions.filter((a) => a.id !== id),
                  {
                    id,
                    goalId,
                    milestoneId: milestoneId || undefined,
                    title: title.trim(),
                    minutes: Number(minutes),
                    effort: Number(effort),
                    completed:
                      old.actions.find((a) => a.id === id)?.completed || false,
                    dependencies,
                    variants: [
                      ...(small
                        ? [{ title: small, minutes: Number(smallMinutes) }]
                        : []),
                      ...(tiny ? [{ title: tiny, minutes: 5 }] : []),
                    ],
                  },
                ],
              }));
              setTitle("");
              setEditingAction("");
              setSmall("");
              setTiny("");
              setDependency("");
            }}
          />
        </Card>
      )}
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
