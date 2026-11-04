import React, { useState } from "react";
import { Alert } from "react-native";
import { useStore } from "./AppState";
import { Button, Copy, Field, message } from "./ui";
export function SteadinessTargets() {
  const { state, update } = useStore();
  const [editing, setEditing] = useState(false);
  const [sleep, setSleep] = useState("");
  const [screen, setScreen] = useState("");
  const [saving, setSaving] = useState(false);
  if (!editing)
    return (
      <Button
        title="Edit steadiness targets"
        onPress={() => {
          setSleep(String(state.preferences.sleepTargetHours ?? 8));
          setScreen(String(state.preferences.screenTargetMinutes ?? 300));
          setEditing(true);
        }}
      />
    );
  return (
    <>
      <Copy small>
        Personal planning targets, not medical thresholds. Changes recalculate
        today's summary.
      </Copy>
      <Field
        label="Sleep target hours"
        value={sleep}
        onChangeText={setSleep}
        numeric
      />
      <Field
        label="Screen time target minutes"
        value={screen}
        onChangeText={setScreen}
        numeric
      />
      <Button
        title={saving ? "Saving targets…" : "Save targets"}
        disabled={saving}
        onPress={async () => {
          setSaving(true);
          try {
            const hours = Number(sleep),
              minutes = Number(screen);
            if (
              !sleep.trim() ||
              !screen.trim() ||
              !Number.isFinite(hours) ||
              !Number.isFinite(minutes) ||
              hours <= 0 ||
              hours > 24 ||
              minutes < 0 ||
              minutes > 1440
            )
              throw Error(
                "Use more than 0–24 sleep hours and 0–1440 screen minutes.",
              );
            await update((old) => ({
              ...old,
              preferences: {
                ...old.preferences,
                sleepTargetHours: hours,
                screenTargetMinutes: minutes,
              },
            }));
            setEditing(false);
          } catch (e) {
            Alert.alert("Could not save targets", message(e));
          } finally {
            setSaving(false);
          }
        }}
      />
      <Button
        title="Cancel target changes"
        disabled={saving}
        onPress={() => setEditing(false)}
      />
    </>
  );
}
