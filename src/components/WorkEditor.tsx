import React, { useState } from "react";
import { Alert, Modal, View, Text } from "react-native";
import * as Crypto from "expo-crypto";
import { useStore } from "./AppState";
import { Button, Card, Copy, Field, Heading, Page, Row, message } from "./ui";
import { validateDependencies } from "../features/goals/dependencies";

export type WorkSelection = {
  goalId: string;
  kind: "milestone" | "action";
  editId?: string;
};
export function WorkEditor({
  selection,
  onClose,
}: {
  selection: WorkSelection;
  onClose: () => void;
}) {
  const { state, update } = useStore();
  const action =
    selection.kind === "action"
      ? state.actions.find((a) => a.id === selection.editId)
      : undefined;
  const milestone =
    selection.kind === "milestone"
      ? state.milestones.find((m) => m.id === selection.editId)
      : undefined;
  const [kind, setKind] = useState(selection.kind);
  const [goalId, setGoalId] = useState(selection.goalId);
  const [name, setName] = useState(action?.title || milestone?.name || "");
  const [milestoneId, setMilestoneId] = useState(action?.milestoneId || "");
  const [minutes, setMinutes] = useState(String(action?.minutes ?? 30));
  const [effort, setEffort] = useState(String(action?.effort ?? 5));
  const [small, setSmall] = useState(action?.variants[0]?.title || "");
  const [smallMinutes, setSmallMinutes] = useState(
    String(action?.variants[0]?.minutes ?? 10),
  );
  const [tiny, setTiny] = useState(action?.variants[1]?.title || "");
  const [tinyMinutes, setTinyMinutes] = useState(
    String(action?.variants[1]?.minutes ?? 5),
  );
  const [dependencies, setDependencies] = useState(action?.dependencies || []);
  const [details, setDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (!name.trim()) throw new Error(`Give the ${kind} a name.`);
      if (!state.goals.some((g) => g.id === goalId))
        throw new Error("Choose a goal.");
      const id = selection.editId || Crypto.randomUUID();
      if (kind === "action") {
        if (
          !Number.isFinite(+minutes) ||
          +minutes < 1 ||
          !Number.isFinite(+effort) ||
          +effort < 1 ||
          +effort > 10
        )
          throw new Error(
            "Use a positive duration and effort between 1 and 10.",
          );
        for (const [title, duration] of [
          [small, smallMinutes],
          [tiny, tinyMinutes],
        ]) {
          if (
            title?.trim() &&
            (!Number.isFinite(Number(duration)) ||
              Number(duration) < 1 ||
              Number(duration) > +minutes)
          )
            throw new Error(
              "Smaller versions must fit within the full action duration.",
            );
        }
        validateDependencies(id, dependencies, state.actions);
      }
      await update((old) => {
        if (!old.goals.some((g) => g.id === goalId))
          throw new Error("This goal no longer exists. Choose another goal.");
        if (kind === "milestone") {
          const previous = old.milestones.find((m) => m.id === id);
          return {
            ...old,
            milestones: [
              ...old.milestones.filter((m) => m.id !== id),
              {
                ...previous,
                id,
                goalId,
                name: name.trim(),
                completed: previous?.completed ?? false,
              },
            ],
            actions: old.actions.map((a) =>
              a.milestoneId === id && a.goalId !== goalId
                ? { ...a, milestoneId: undefined }
                : a,
            ),
          };
        }
        validateDependencies(id, dependencies, old.actions);
        const previous = old.actions.find((a) => a.id === id);
        if (
          milestoneId &&
          !old.milestones.some(
            (m) => m.id === milestoneId && m.goalId === goalId,
          )
        )
          throw new Error(
            "Choose a milestone belonging to this goal, or select No milestone.",
          );
        return {
          ...old,
          actions: [
            ...old.actions.filter((a) => a.id !== id),
            {
              id,
              goalId,
              milestoneId: milestoneId || undefined,
              title: name.trim(),
              minutes: +minutes,
              effort: +effort,
              completed: previous?.completed ?? false,
              dependencies,
              variants: [
                ...(small.trim()
                  ? [{ title: small.trim(), minutes: +smallMinutes }]
                  : []),
                ...(tiny.trim()
                  ? [{ title: tiny.trim(), minutes: +tinyMinutes }]
                  : []),
                ...(previous?.variants.slice(2) || []),
              ],
            },
          ],
        };
      });
      onClose();
    } catch (e) {
      Alert.alert("Could not save work", message(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <Page title={selection.editId ? `Edit ${kind}` : "Add work"}>
        {!selection.editId && (
          <Row>
            <Button
              title="Milestone"
              selected={kind === "milestone"}
              onPress={() => setKind("milestone")}
            />
            <Button
              title="Action"
              selected={kind === "action"}
              onPress={() => setKind("action")}
            />
          </Row>
        )}
        <Card>
          <Heading>Choose goal</Heading>
          <Copy small>
            {state.goals.find((g) => g.id === goalId)?.name ||
              "Select a goal below"}
          </Copy>
          {state.goals.map((g) => (
            <Button
              key={g.id}
              title={`Goal: ${g.name}`}
              selected={g.id === goalId}
              onPress={() => {
                if (g.id !== goalId) setMilestoneId("");
                setGoalId(g.id);
              }}
            />
          ))}
        </Card>
        <View
          style={{
            backgroundColor: kind === "milestone" ? "#DCEBFA" : "#F9DDE0",
            borderRadius: 24,
            padding: 16,
          }}
        >
          <Text style={{ color: "#3C344D", fontSize: 15 }}>
            {kind === "milestone"
              ? "Milestones mark progress toward your goal."
              : "Actions are small tasks you can put in your plan."}
          </Text>
        </View>
        <Card>
          <Field
            label={kind === "milestone" ? "Milestone name" : "Action name"}
            value={name}
            onChangeText={setName}
          />
          {kind === "milestone" && selection.editId && (
            <Copy small>
              If you move this milestone to another goal, its existing actions
              stay with their original goal and become unlinked.
            </Copy>
          )}
          {kind === "action" && (
            <>
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
              <Copy small>Milestone · optional</Copy>
              <Button
                title="No milestone"
                selected={!milestoneId}
                onPress={() => setMilestoneId("")}
              />
              {state.milestones
                .filter((m) => m.goalId === goalId)
                .map((m) => (
                  <Button
                    key={m.id}
                    title={`Milestone: ${m.name}`}
                    selected={milestoneId === m.id}
                    onPress={() => setMilestoneId(m.id)}
                  />
                ))}
              <Button
                title={
                  details
                    ? "Hide action options"
                    : "Smaller versions and dependencies"
                }
                onPress={() => setDetails(!details)}
              />
              {details && (
                <>
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
                    label="Minimum version · optional"
                    value={tiny}
                    onChangeText={setTiny}
                  />
                  <Field
                    label="Minimum version minutes"
                    value={tinyMinutes}
                    onChangeText={setTinyMinutes}
                    numeric
                  />
                  <Copy small>Complete these actions first · optional</Copy>
                  {state.actions
                    .filter((a) => a.id !== selection.editId)
                    .map((a) => (
                      <Button
                        key={a.id}
                        title={`Depends on: ${a.title}`}
                        selected={dependencies.includes(a.id)}
                        onPress={() =>
                          setDependencies((ids) =>
                            ids.includes(a.id)
                              ? ids.filter((id) => id !== a.id)
                              : [...ids, a.id],
                          )
                        }
                      />
                    ))}
                </>
              )}
            </>
          )}
          <Button
            title={saving ? "Saving…" : `Save ${kind}`}
            disabled={saving}
            onPress={() => void save()}
          />
          <Button title="Cancel" disabled={saving} onPress={onClose} />
        </Card>
      </Page>
    </Modal>
  );
}
