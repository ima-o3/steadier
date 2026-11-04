import React, { useState } from "react";
import { Alert } from "react-native";
import { useStore } from "./AppState";
import { Button, Copy, Field, message } from "./ui";
export function CapacityHours() {
  const { state, update } = useStore(),
    [draft, setDraft] = useState<string | null>(null),
    [saving, setSaving] = useState(false);
  return (
    <>
      <Copy small>
        Discretionary time: {state.preferences.weeklyMinutes / 60} hours/week
      </Copy>
      {draft === null ? (
        <Button
          title="Edit discretionary hours"
          onPress={() => setDraft(String(state.preferences.weeklyMinutes / 60))}
        />
      ) : (
        <>
          <Field
            label="Weekly discretionary hours"
            value={draft}
            onChangeText={setDraft}
            numeric
          />
          <Button
            title={saving ? "Saving…" : "Save hours"}
            disabled={saving}
            onPress={async () => {
              setSaving(true);
              try {
                const hours = Number(draft);
                if (
                  !draft.trim() ||
                  !Number.isFinite(hours) ||
                  hours <= 0 ||
                  hours > 168
                )
                  throw Error(
                    "Enter more than 0 and at most 168 hours per week.",
                  );
                await update((old) => ({
                  ...old,
                  preferences: {
                    ...old.preferences,
                    weeklyMinutes: hours * 60,
                  },
                }));
                setDraft(null);
              } catch (e) {
                Alert.alert("Could not save hours", message(e));
              } finally {
                setSaving(false);
              }
            }}
          />
          <Button
            title="Cancel hours edit"
            disabled={saving}
            onPress={() => setDraft(null)}
          />
        </>
      )}
    </>
  );
}
