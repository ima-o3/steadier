import React, { useState } from "react";
import { Alert, Modal, Text, View } from "react-native";
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
  return (
    <Page title="Goals">
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
      {visibleGoals.map((g) => (
        <Card key={g.id}>
          <Heading>{g.name}</Heading>
          {!!g.description && <Copy>{g.description}</Copy>}
          <Copy small>
            {g.status === "paused" ? "Paused · " : ""}
            {g.deadline || "No deadline"} · priority {g.priority}
          </Copy>
          <Row>
            <Button title="Edit goal" onPress={() => edit(g)} />
            <Button
              title="Add work"
              onPress={() => setWork({ goalId: g.id, kind: "action" })}
            />
          </Row>
          <Row>
            {g.status !== "completed" && (
              <Button
                title="Complete goal"
                onPress={() => changeStatus(g, "completed")}
              />
            )}
            {g.status !== "archived" && (
              <Button
                title="Archive goal"
                onPress={() => changeStatus(g, "archived")}
              />
            )}
            {(g.status === "completed" || g.status === "archived") && (
              <Button
                title="Restore to active"
                onPress={() => changeStatus(g, "active")}
              />
            )}
            {(g.status === "active" || g.status === "paused") && (
              <Button
                title={g.status === "paused" ? "Resume goal" : "Pause goal"}
                onPress={() =>
                  changeStatus(g, g.status === "paused" ? "active" : "paused")
                }
              />
            )}
          </Row>
          <View
            style={{
              backgroundColor: "#DCEBFA",
              borderRadius: 20,
              padding: 14,
              gap: 12,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{ color: "#30465D", fontSize: 20, fontWeight: "700" }}
            >
              Milestones
            </Text>
            {s.milestones.filter((m) => m.goalId === g.id).length === 0 && (
              <Text style={{ color: "#30465D" }}>No milestones yet.</Text>
            )}
            {s.milestones
              .filter((m) => m.goalId === g.id)
              .map((m) => (
                <View key={m.id} style={{ gap: 8 }}>
                  <Text
                    style={{
                      color: "#30465D",
                      fontSize: 17,
                      fontWeight: "600",
                    }}
                  >
                    {m.completed ? "✓ " : ""}
                    {m.name}
                  </Text>
                  <Row>
                    <Button
                      title={`Edit milestone: ${m.name}`}
                      onPress={() =>
                        setWork({
                          goalId: g.id,
                          kind: "milestone",
                          editId: m.id,
                        })
                      }
                    />
                    <Button
                      title={`Delete milestone: ${m.name}`}
                      onPress={() => deleteWork("milestone", m.id, m.name)}
                    />
                  </Row>
                  <Button
                    title={
                      m.completed
                        ? `Reopen milestone: ${m.name}`
                        : `Complete milestone: ${m.name}`
                    }
                    onPress={() =>
                      commit((old) => ({
                        ...old,
                        milestones: old.milestones.map((x) =>
                          x.id === m.id ? { ...x, completed: !x.completed } : x,
                        ),
                      }))
                    }
                  />
                </View>
              ))}
            <Button
              title="Add milestone"
              onPress={() => setWork({ goalId: g.id, kind: "milestone" })}
            />
          </View>
          <View
            style={{
              backgroundColor: "#F9DDE0",
              borderRadius: 20,
              padding: 14,
              gap: 12,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{ color: "#673E49", fontSize: 20, fontWeight: "700" }}
            >
              Actions
            </Text>
            {s.actions.filter((a) => a.goalId === g.id).length === 0 && (
              <Text style={{ color: "#673E49" }}>No actions yet.</Text>
            )}
            {s.actions
              .filter((a) => a.goalId === g.id)
              .map((a) => (
                <View key={a.id} style={{ gap: 8 }}>
                  <Text
                    style={{
                      color: "#673E49",
                      fontSize: 17,
                      fontWeight: "600",
                    }}
                  >
                    {a.completed ? "✓ " : ""}
                    {a.title}
                  </Text>
                  <Text style={{ color: "#673E49" }}>
                    {a.minutes} min
                    {a.milestoneId
                      ? ` · ${s.milestones.find((m) => m.id === a.milestoneId)?.name || "Milestone"}`
                      : ""}
                  </Text>
                  <Row>
                    <Button
                      title={`Edit action: ${a.title}`}
                      onPress={() =>
                        setWork({ goalId: g.id, kind: "action", editId: a.id })
                      }
                    />
                    <Button
                      title={`Delete action: ${a.title}`}
                      onPress={() => deleteWork("action", a.id, a.title)}
                    />
                  </Row>
                  <Button
                    title={
                      a.completed
                        ? `Reopen action: ${a.title}`
                        : `Complete action: ${a.title}`
                    }
                    onPress={() =>
                      commit((old) => ({
                        ...old,
                        actions: old.actions.map((x) =>
                          x.id === a.id ? { ...x, completed: !x.completed } : x,
                        ),
                      }))
                    }
                  />
                </View>
              ))}
            <Button
              title="Add action"
              onPress={() => setWork({ goalId: g.id, kind: "action" })}
            />
          </View>
          <SlideDelete name={g.name} onDelete={() => remove(g)} />
        </Card>
      ))}
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
