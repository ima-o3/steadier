import { useRouter } from "expo-router";
import { habitProgress } from "../features/planner/habitProgress";
import React, { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import { useStore } from "./AppState";
import {
  Button,
  Card,
  Copy,
  Field,
  Heading,
  Page,
  message,
  useTheme,
} from "./ui";
import { SwipeDelete } from "./SwipeDelete";
import { Habit } from "../types";
import { localDate } from "../utils/time";
import { removeRoutine } from "../features/planner/routines";
export function Routines({ dashboard = false }: { dashboard?: boolean }) {
  const router = useRouter();
  const { state: s, update } = useStore(),
    t = useTheme(),
    date = localDate(s.preferences.zone);
  const [draft, setDraft] = useState<Habit | null>(null),
    [minutes, setMinutes] = useState(""),
    [frequency, setFrequency] = useState(""),
    [saving, setSaving] = useState(false);
  function edit(h: Habit) {
    setDraft({ ...h });
    setMinutes(String(h.minutes));
    setFrequency(String(h.daysPerWeek));
  }
  function remove(h: Habit) {
    Alert.alert(
      `Delete ${h.name}?`,
      "This removes the habit, its checkmarks and unfinished plan suggestions. Completed plan entries and plan revision history stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void update((old) => removeRoutine(old, h.id))
              .then(() => setDraft(null))
              .catch((e) => Alert.alert("Could not delete habit", message(e)));
          },
        },
      ],
    );
  }
  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    try {
      if (
        !draft.name.trim() ||
        !minutes.trim() ||
        !Number.isFinite(Number(minutes)) ||
        Number(minutes) < 1 ||
        Number(minutes) > 1440 ||
        !Number.isInteger(Number(frequency)) ||
        Number(frequency) < 1 ||
        Number(frequency) > 7
      )
        throw Error("Enter a name, 1–1440 minutes and 1–7 days per week.");
      const h = {
        ...draft,
        name: draft.name.trim(),
        minutes: Number(minutes),
        daysPerWeek: Number(frequency),
      };
      await update((old) => ({
        ...old,
        habits: old.habits.some((x) => x.id === h.id)
          ? old.habits.map((x) => (x.id === h.id ? h : x))
          : [...old.habits, h],
      }));
      setDraft(null);
    } catch (e) {
      Alert.alert("Could not save habit", message(e));
    } finally {
      setSaving(false);
    }
  }
  if (!dashboard)
    return (
      <Card>
        <Heading>Habit tracker</Heading>
        <Copy>
          {s.habits.length} habits ·{" "}
          {s.habits.filter((h) => s.habitLogs[date]?.includes(h.id)).length}{" "}
          completed today
        </Copy>
        <Button
          title="Open habit dashboard"
          onPress={() => router.push("/habits")}
        />
      </Card>
    );
  return (
    <Card>
      <Heading>Your habits</Heading>
      <Button
        title="Add habit"
        onPress={() =>
          edit({
            id: Crypto.randomUUID(),
            name: "",
            minutes: 10,
            daysPerWeek: 3,
            minimum: "",
          })
        }
      />
      {!s.habits.length && <Copy>Add a habit that fits your day.</Copy>}
      <Copy small>
        Weekly progress uses the last 7 days and your days-per-week target. Each
        habit counts once per day. The grid shows the last 28 days, oldest
        first.
      </Copy>
      {s.habits.map((h) => (
        <SwipeDelete key={h.id} name={h.name} onDelete={() => remove(h)}>
          <View style={{ padding: 12, gap: 8 }}>
            <Copy small>
              {habitProgress(h, s.habitLogs, date).week} / {h.daysPerWeek} days
              this week · {habitProgress(h, s.habitLogs, date).percent}% of
              target · {habitProgress(h, s.habitLogs, date).total} total
              completions
            </Copy>
            <View
              accessibilityLabel={`${h.name}: ${habitProgress(h, s.habitLogs, date).percent}% of weekly target`}
              style={{ height: 8, backgroundColor: t.button, borderRadius: 8 }}
            >
              <View
                style={{
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: t.accent,
                  width: `${habitProgress(h, s.habitLogs, date).percent}%`,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {habitProgress(h, s.habitLogs, date).days.map((d) => (
                <View
                  key={d}
                  accessible
                  accessibilityLabel={`${h.name}, ${d}: ${s.habitLogs[d]?.includes(h.id) ? "completed" : "not recorded"}`}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 5,
                    backgroundColor: s.habitLogs[d]?.includes(h.id)
                      ? t.accent
                      : t.button,
                  }}
                />
              ))}
            </View>
            <View
              style={{
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Complete habit: ${h.name}`}
                accessibilityState={{
                  checked: s.habitLogs[date]?.includes(h.id) || false,
                }}
                onPress={() => {
                  void update((old) => {
                    const logs = old.habitLogs[date] || [];
                    return {
                      ...old,
                      plans: {
                        ...old.plans,
                        ...(old.plans[date]
                          ? {
                              [date]: old.plans[date]!.map((item) =>
                                item.kind === "habit" &&
                                item.id === `${date}-${h.id}`
                                  ? { ...item, completed: !logs.includes(h.id) }
                                  : item,
                              ),
                            }
                          : {}),
                      },
                      habitLogs: {
                        ...old.habitLogs,
                        [date]: logs.includes(h.id)
                          ? logs.filter((id) => id !== h.id)
                          : [...logs, h.id],
                      },
                    };
                  }).catch((e) => Alert.alert("Could not save", message(e)));
                }}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: t.accent, fontSize: 28 }}>
                  {s.habitLogs[date]?.includes(h.id) ? "☑" : "☐"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit habit: ${h.name}`}
                onPress={() => edit(h)}
                style={{ flex: 1, minHeight: 44 }}
              >
                <Copy>{h.name}</Copy>
                <Copy small>
                  {h.minutes} min · {h.daysPerWeek} days/week · Edit
                </Copy>
              </Pressable>
            </View>
          </View>
        </SwipeDelete>
      ))}
      <Modal
        visible={!!draft}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setDraft(null);
        }}
      >
        <Page
          title={
            s.habits.some((h) => h.id === draft?.id)
              ? "Edit habit"
              : "New habit"
          }
        >
          {draft && (
            <>
              <Field
                label="Habit name"
                value={draft.name}
                onChangeText={(name) => setDraft({ ...draft, name })}
              />
              <Field
                label="Duration minutes"
                value={minutes}
                onChangeText={setMinutes}
                numeric
              />
              <Field
                label="Days per week"
                value={frequency}
                onChangeText={setFrequency}
                numeric
              />
              <Field
                label="Minimum version · optional"
                value={draft.minimum}
                onChangeText={(minimum) => setDraft({ ...draft, minimum })}
              />
              <Copy small>
                Changes apply to newly generated plans. Existing scheduled work
                and completed history keep their original details.
              </Copy>
              <Button
                title={saving ? "Saving…" : "Save habit"}
                disabled={saving}
                onPress={() => void save()}
              />
              <Button
                title="Cancel"
                disabled={saving}
                onPress={() => setDraft(null)}
              />
              {s.habits.some((h) => h.id === draft.id) && (
                <Button
                  title="Delete habit"
                  disabled={saving}
                  onPress={() => remove(draft)}
                />
              )}
            </>
          )}
        </Page>
      </Modal>
    </Card>
  );
}
