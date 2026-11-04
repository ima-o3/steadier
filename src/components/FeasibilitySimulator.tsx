import React, { useState, useMemo } from "react";
import { Alert, Modal } from "react-native";
import { useStore } from "./AppState";
import { Button, Card, Copy, Field, Heading, Page, message } from "./ui";
import { assessGoals } from "../engines/goalFeasibility";
import { localDate } from "../utils/time";
import {
  applySimulation,
  emptySimulation,
  simulatedState,
  Simulation,
} from "../features/goals/simulation";
import { State } from "../types";
const range = (r: { low: number; high: number }) =>
  `${(r.low / 60).toFixed(1)}–${(r.high / 60).toFixed(1)} h/week`;
export function FeasibilitySimulator() {
  const { state, update } = useStore();
  const [visible, setVisible] = useState(false),
    [draft, setDraft] = useState<Simulation>(emptySimulation),
    [saving, setSaving] = useState(false);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const assess = (s: State) =>
    assessGoals(
      s.goals,
      s.actions,
      s.commitments,
      s.preferences,
      localDate(s.preferences.zone),
    );
  const current = useMemo(() => assess(state), [state]);
  const error =
    Object.values(invalid).some(Boolean) ||
    state.goals.some((g) => {
      const c = { ...g, ...draft.changes[g.id] };
      return (
        c.effortMin !== undefined &&
        c.effortMax !== undefined &&
        c.effortMin > c.effortMax
      );
    }) ||
    (draft.capacityLow ?? state.preferences.capacityLow) >
      (draft.capacityHigh ?? state.preferences.capacityHigh);
  const proposed = useMemo(
    () => (error || !visible ? current : assess(simulatedState(state, draft))),
    [state, draft, error, visible, current],
  );
  function number(
    key: string,
    value: string,
    min: number,
    max: number,
    save: (n: number) => void,
  ) {
    setRaw((old) => ({ ...old, [key]: value }));
    const n = Number(value),
      bad = !value.trim() || !Number.isFinite(n) || n < min || n > max;
    setInvalid((old) => ({ ...old, [key]: bad }));
    if (!bad) save(n);
  }
  function reset() {
    setDraft(emptySimulation());
    setInvalid({});
    setRaw({});
  }
  const summary = (report: ReturnType<typeof assess>) => (
    <>
      <Copy>{report.status}</Copy>
      <Copy small>Sustainable capacity: {range(report.capacity)}</Copy>
      <Copy small>
        Required effort:{" "}
        {report.missing.length
          ? `Incomplete estimates; known goals: ${range(report.required)}`
          : range(report.required)}
      </Copy>
      <Copy small>
        Demand/capacity:{" "}
        {report.missing.length
          ? "unknown"
          : (report.ratio?.toFixed(2) ?? "unknown")}
      </Copy>
      <Copy small>
        Weekly workload: {report.weeklyStatus}. Deadline and scheduling
        constraints: {report.deadlineStatus}.
      </Copy>
      <Copy small>{report.explanation}</Copy>
      {[...report.missing, ...report.bottlenecks].map((text, i) => (
        <Copy small key={i}>
          {text}
        </Copy>
      ))}
    </>
  );
  return (
    <>
      <Card>
        <Heading>Room for your goals</Heading>
        {summary(current)}
        <Button
          title="Make this realistic"
          onPress={() => {
            reset();
            setVisible(true);
          }}
        />
      </Card>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setVisible(false);
        }}
      >
        <Page title="Explore a realistic plan">
          <Copy>
            Nothing is saved until you apply changes. Estimates describe
            workload, not your worth.
          </Copy>
          <Card>
            <Heading>Current plan</Heading>
            {summary(current)}
          </Card>
          <Card>
            <Heading>Proposed plan</Heading>
            {error ? (
              <Copy>
                Enter valid values before comparing. Lower estimates must not
                exceed upper estimates.
              </Copy>
            ) : (
              summary(proposed)
            )}
            <Copy small>
              Priority changes selection order, not the amount of work.
              Exclusions affect this preview only; included goals remain active
              when you apply.
            </Copy>
          </Card>
          {state.goals
            .filter((g) => g.status === "active")
            .map((g) => {
              const c = draft.changes[g.id] || {};
              const change = (patch: typeof c) =>
                setDraft((old) => ({
                  ...old,
                  changes: {
                    ...old.changes,
                    [g.id]: { ...old.changes[g.id], ...patch },
                  },
                }));
              return (
                <Card key={g.id}>
                  <Heading>{g.name}</Heading>
                  <Button
                    title={`${draft.excluded.includes(g.id) ? "Include" : "Exclude"} ${g.name} in preview`}
                    onPress={() =>
                      setDraft((old) => ({
                        ...old,
                        excluded: old.excluded.includes(g.id)
                          ? old.excluded.filter((id) => id !== g.id)
                          : [...old.excluded, g.id],
                      }))
                    }
                  />
                  <Field
                    label={`Deadline for ${g.name}`}
                    value={raw[g.id + "date"] ?? c.deadline ?? g.deadline ?? ""}
                    onChangeText={(v) => {
                      setRaw((old) => ({ ...old, [g.id + "date"]: v }));
                      change({ deadline: v || undefined });
                      setInvalid((old) => ({
                        ...old,
                        [g.id + "date"]:
                          !!v &&
                          (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
                            Number.isNaN(Date.parse(v)) ||
                            new Date(v).toISOString().slice(0, 10) !== v),
                      }));
                    }}
                  />
                  {(["effortMin", "effortMax"] as const).map((key, i) => (
                    <Field
                      key={key}
                      label={`${i ? "Upper" : "Lower"} remaining hours for ${g.name}`}
                      value={
                        raw[g.id + key] ??
                        ((c[key] ?? g[key]) === undefined
                          ? ""
                          : String((c[key] ?? g[key])! / 60))
                      }
                      numeric
                      onChangeText={(v) =>
                        number(g.id + key, v, 0, 100000, (n) =>
                          change({ [key]: n * 60 }),
                        )
                      }
                    />
                  ))}
                  <Field
                    label={`Priority for ${g.name}`}
                    value={
                      raw[g.id + "priority"] ?? String(c.priority ?? g.priority)
                    }
                    numeric
                    onChangeText={(v) =>
                      number(g.id + "priority", v, 1, 1000, (n) =>
                        change({ priority: n }),
                      )
                    }
                  />
                  {Object.keys(c).length > 0 && (
                    <Copy small>
                      Proposed changes:{" "}
                      {Object.keys(c)
                        .map((key) =>
                          key === "effortMin"
                            ? "lower remaining effort"
                            : key === "effortMax"
                              ? "upper remaining effort"
                              : key,
                        )
                        .join(", ")}
                      . These values are still a draft.
                    </Copy>
                  )}
                </Card>
              );
            })}
          <Card>
            <Heading>Capacity assumptions</Heading>
            <Field
              label="Discretionary hours per week"
              value={
                raw.weekly ??
                String(
                  (draft.weeklyMinutes ?? state.preferences.weeklyMinutes) / 60,
                )
              }
              numeric
              onChangeText={(v) =>
                number("weekly", v, 0, 168, (n) =>
                  setDraft((old) => ({ ...old, weeklyMinutes: n * 60 })),
                )
              }
            />
            {(["capacityLow", "capacityHigh"] as const).map((key, i) => (
              <Field
                key={key}
                label={`${i ? "Upper" : "Lower"} sustainable allowance percent`}
                value={
                  raw[key] ??
                  String((draft[key] ?? state.preferences[key]) * 100)
                }
                numeric
                onChangeText={(v) =>
                  number(key, v, 0, 100, (n) =>
                    setDraft((old) => ({ ...old, [key]: n / 100 })),
                  )
                }
              />
            ))}
            <Copy small>{proposed.assumptions}</Copy>
            {Object.values(invalid).some(Boolean) && (
              <Copy small>
                Check dates and numeric inputs. Hours must be positive or zero;
                allowances must be between 0 and 100%.
              </Copy>
            )}
          </Card>
          <Button
            title={saving ? "Applying…" : "Apply Changes"}
            disabled={saving || error}
            onPress={async () => {
              setSaving(true);
              try {
                await update((old) => applySimulation(old, draft));
                setVisible(false);
              } catch (e) {
                Alert.alert("Could not apply changes", message(e));
              } finally {
                setSaving(false);
              }
            }}
          />
          <Button title="Reset" disabled={saving} onPress={reset} />
          <Button
            title="Cancel"
            disabled={saving}
            onPress={() => setVisible(false)}
          />
        </Page>
      </Modal>
    </>
  );
}
