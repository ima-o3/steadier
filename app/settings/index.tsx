import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Temporal } from "@js-temporal/polyfill";
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
import { defaultState } from "../../src/database/repositories/store";
import {
  CalendarEntry,
  connect,
  disconnect,
  listCalendars,
  syncCalendars,
} from "../../src/integrations/googleCalendar/client";
import { localDate } from "../../src/utils/time";
export default function Settings() {
  const { state: s, update } = useStore(),
    [calendars, setCalendars] = useState<CalendarEntry[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [zone, setZone] = useState(s.preferences.zone),
    [start, setStart] = useState(String(s.preferences.startHour)),
    [end, setEnd] = useState(String(s.preferences.endHour)),
    [restStart, setRestStart] = useState(String(s.preferences.restStart)),
    [restEnd, setRestEnd] = useState(String(s.preferences.restEnd)),
    [buffer, setBuffer] = useState(String(s.preferences.buffer)),
    [breaks, setBreaks] = useState(String(s.preferences.breakMinutes)),
    [weekly, setWeekly] = useState(String(s.preferences.weeklyMinutes / 60)),
    [low, setLow] = useState(String(s.preferences.capacityLow * 100)),
    [high, setHigh] = useState(String(s.preferences.capacityHigh * 100)),
    [title, setTitle] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [habit, setHabit] = useState(""),
    [habitMinutes, setHabitMinutes] = useState("10"),
    [habitFrequency, setHabitFrequency] = useState("3"),
    [habitMinimum, setHabitMinimum] = useState("");
  const commit = (fn: Parameters<typeof update>[0]) =>
    void update(fn).catch(() => {});
  async function work(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const text = message(e);
      setStatus(text);
      await update((old) => ({ ...old, calendarError: text })).catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (!s.calendarIds.length) throw new Error("Select at least one calendar.");
    const commitments = await syncCalendars(
      s.calendarIds,
      localDate(s.preferences.zone),
      s.preferences.zone,
    );
    await update((old) => ({
      ...old,
      commitments: [
        ...old.commitments.filter((c) => c.source !== "google"),
        ...commitments,
      ],
      lastSync: new Date().toISOString(),
      calendarError: undefined,
    }));
    setStatus("Availability refreshed for the next 91 days.");
  }
  function saveRoutine() {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: zone });
      const values = [
        start,
        end,
        restStart,
        restEnd,
        buffer,
        breaks,
        weekly,
        low,
        high,
      ].map(Number);
      if (
        values.some((v) => !Number.isFinite(v)) ||
        !start ||
        !end ||
        Number(start) < 0 ||
        Number(end) > 23.99 ||
        Number(start) >= Number(end) ||
        Number(restStart) < 0 ||
        Number(restEnd) > 23.99 ||
        Number(restStart) >= Number(restEnd) ||
        Number(buffer) < 0 ||
        Number(breaks) < 0 ||
        Number(weekly) <= 0 ||
        Number(weekly) > 168 ||
        Number(low) < 1 ||
        Number(high) > 100 ||
        Number(low) > Number(high)
      )
        throw new Error(
          "Check hour ranges, positive weekly hours, non-negative buffers and capacity percentages (1–100).",
        );
      commit((old) => ({
        ...old,
        preferences: {
          ...old.preferences,
          zone,
          startHour: Number(start),
          endHour: Number(end),
          restStart: Number(restStart),
          restEnd: Number(restEnd),
          buffer: Number(buffer),
          breakMinutes: Number(breaks),
          weeklyMinutes: Number(weekly) * 60,
          capacityLow: Number(low) / 100,
          capacityHigh: Number(high) / 100,
        },
        commitments: old.commitments.filter((c) => c.source !== "google"),
        lastSync: undefined,
        calendarError: old.calendarIds.length
          ? "Routine or timezone changed. Refresh calendar and regenerate plans."
          : undefined,
      }));
      setStatus(
        "Routine saved. Existing plans are preserved; regenerate to apply changes.",
      );
    } catch (e) {
      Alert.alert("Routine", message(e));
    }
  }
  async function exportData() {
    let file: File | undefined;
    try {
      file = new File(Paths.cache, `steadier-export-${Date.now()}.json`);
      file.create();
      file.write(
        JSON.stringify(
          { formatVersion: 1, exportedAt: new Date().toISOString(), ...s },
          null,
          2,
        ),
      );
      if (!(await Sharing.isAvailableAsync()))
        throw new Error("Sharing is unavailable on this device.");
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        UTI: "public.json",
      });
    } catch (e) {
      Alert.alert("Export", message(e));
    } finally {
      if (file?.exists) file.delete();
    }
  }
  return (
    <Page title="Settings">
      <Card>
        <Heading>Google Calendar</Heading>
        <Copy small>
          Read-only availability. Credentials stay with the native Google SDK in
          Keychain. Steadier never writes events or stores descriptions.
        </Copy>
        <Button
          title="Connect / choose calendars"
          disabled={busy}
          onPress={() =>
            void work(async () => {
              await connect();
              setCalendars(await listCalendars());
              setStatus("Connected. Select calendars, then refresh.");
            })
          }
        />
        {calendars.map((c) => (
          <Button
            key={c.id}
            selected={s.calendarIds.includes(c.id)}
            title={`${s.calendarIds.includes(c.id) ? "✓ " : ""}${c.summary}`}
            onPress={() =>
              commit((old) => ({
                ...old,
                calendarIds: old.calendarIds.includes(c.id)
                  ? old.calendarIds.filter((id) => id !== c.id)
                  : [...old.calendarIds, c.id],
                commitments: old.commitments.filter(
                  (c) => c.source !== "google",
                ),
                lastSync: undefined,
                calendarError:
                  "Calendar selection changed. Refresh availability.",
              }))
            }
          />
        ))}
        <Copy small>
          {s.calendarIds.length} selected · Last successful sync:{" "}
          {s.lastSync ? new Date(s.lastSync).toLocaleString("en-GB") : "never"}
        </Copy>
        <Copy small>
          {s.calendarError ||
            status ||
            "Without a fresh sync, availability may be incomplete. Manual commitments remain available offline."}
        </Copy>
        <Button
          title="Refresh availability"
          disabled={busy}
          onPress={() => void work(refresh)}
        />
        <Button
          title="Disconnect Google and clear cache"
          disabled={busy}
          onPress={() =>
            void work(async () => {
              await disconnect();
              await update((old) => ({
                ...old,
                calendarIds: [],
                commitments: old.commitments.filter(
                  (c) => c.source !== "google",
                ),
                lastSync: undefined,
                calendarError: undefined,
              }));
              setCalendars([]);
              setStatus("Disconnected and local calendar cache cleared.");
            })
          }
        />
        <Button
          title="Clear local calendar cache"
          onPress={() =>
            commit((old) => ({
              ...old,
              commitments: old.commitments.filter((c) => c.source !== "google"),
              lastSync: undefined,
              calendarError: "Cache cleared. Refresh to import availability.",
            }))
          }
        />
        <Button
          title={`All-day events block planning: ${s.preferences.allDayBusy ? "yes" : "no"}`}
          onPress={() =>
            commit((old) => ({
              ...old,
              preferences: {
                ...old.preferences,
                allDayBusy: !old.preferences.allDayBusy,
              },
            }))
          }
        />
      </Card>
      <Card>
        <Heading>Your routine</Heading>
        <Field label="IANA timezone" value={zone} onChangeText={setZone} />
        <Field
          label="Work start hour · 9 or 9.5"
          value={start}
          onChangeText={setStart}
          numeric
        />
        <Field
          label="Work end hour"
          value={end}
          onChangeText={setEnd}
          numeric
        />
        <Field
          label="Protected rest start hour"
          value={restStart}
          onChangeText={setRestStart}
          numeric
        />
        <Field
          label="Protected rest end hour"
          value={restEnd}
          onChangeText={setRestEnd}
          numeric
        />
        <Field
          label="Preparation / recovery buffer · minutes each side"
          value={buffer}
          onChangeText={setBuffer}
          numeric
        />
        <Field
          label="Break between actions · minutes"
          value={breaks}
          onChangeText={setBreaks}
          numeric
        />
        <Field
          label="Weekly discretionary hours ceiling"
          value={weekly}
          onChangeText={setWeekly}
          numeric
        />
        <Field
          label="Conservative capacity lower percent"
          value={low}
          onChangeText={setLow}
          numeric
        />
        <Field
          label="Conservative capacity upper percent"
          value={high}
          onChangeText={setHigh}
          numeric
        />
        <Button title="Save routine and assumptions" onPress={saveRoutine} />
        <Copy small>
          Hours outside your working window and the protected rest window cannot
          receive suggestions. Calendar availability is not guaranteed
          productive capacity.
        </Copy>
      </Card>
      <Card>
        <Heading>Manual commitment</Heading>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field
          label="Start local YYYY-MM-DDTHH:mm"
          value={from}
          onChangeText={setFrom}
        />
        <Field
          label="End local YYYY-MM-DDTHH:mm"
          value={to}
          onChangeText={setTo}
        />
        <Button
          title="Add fixed commitment"
          onPress={() => {
            try {
              if (!title.trim()) throw new Error("Add a title.");
              const start = Temporal.PlainDateTime.from(from)
                  .toZonedDateTime(s.preferences.zone, {
                    disambiguation: "reject",
                  })
                  .toInstant()
                  .toString(),
                end = Temporal.PlainDateTime.from(to)
                  .toZonedDateTime(s.preferences.zone, {
                    disambiguation: "reject",
                  })
                  .toInstant()
                  .toString();
              if (start >= end) throw new Error("End must follow start.");
              commit((old) => ({
                ...old,
                commitments: [
                  ...old.commitments,
                  {
                    id: Crypto.randomUUID(),
                    title: title.trim(),
                    start,
                    end,
                    busy: true,
                    source: "manual",
                  },
                ],
              }));
              setTitle("");
              setFrom("");
              setTo("");
            } catch (e) {
              Alert.alert("Commitment", message(e));
            }
          }}
        />
        {s.commitments
          .filter((c) => c.source === "manual")
          .map((c) => (
            <Button
              key={c.id}
              title={`Remove ${c.title}`}
              onPress={() =>
                commit((old) => ({
                  ...old,
                  commitments: old.commitments.filter((x) => x.id !== c.id),
                }))
              }
            />
          ))}
      </Card>
      <Card>
        <Heading>Flexible routines</Heading>
        <Field label="Habit name" value={habit} onChangeText={setHabit} />
        <Field
          label="Duration minutes"
          value={habitMinutes}
          onChangeText={setHabitMinutes}
          numeric
        />
        <Field
          label="Aim days per week · 1–7"
          value={habitFrequency}
          onChangeText={setHabitFrequency}
          numeric
        />
        <Field
          label="Minimum version · optional"
          value={habitMinimum}
          onChangeText={setHabitMinimum}
        />
        <Button
          title="Add routine"
          onPress={() => {
            if (
              !habit.trim() ||
              !Number.isFinite(Number(habitMinutes)) ||
              Number(habitMinutes) < 1 ||
              !Number.isInteger(Number(habitFrequency)) ||
              Number(habitFrequency) < 1 ||
              Number(habitFrequency) > 7
            ) {
              Alert.alert(
                "Routine",
                "Use a name, positive duration and 1–7 days/week.",
              );
              return;
            }
            commit((old) => ({
              ...old,
              habits: [
                ...old.habits,
                {
                  id: Crypto.randomUUID(),
                  name: habit.trim(),
                  minutes: Number(habitMinutes),
                  minimum: habitMinimum,
                  daysPerWeek: Number(habitFrequency),
                },
              ],
            }));
            setHabit("");
          }}
        />
      </Card>
      <Card>
        <Heading>Preferences</Heading>
        <Button
          title={`Wellbeing tracking: ${s.preferences.tracking ? "on" : "off"}`}
          onPress={() =>
            commit((old) => ({
              ...old,
              preferences: {
                ...old.preferences,
                tracking: !old.preferences.tracking,
              },
            }))
          }
        />
        <Button
          title={`Pattern observations: ${s.preferences.patterns ? "on" : "off"}`}
          onPress={() =>
            commit((old) => ({
              ...old,
              preferences: {
                ...old.preferences,
                patterns: !old.preferences.patterns,
              },
            }))
          }
        />
        <Copy small>
          Notifications are off. No reminder delivery is implemented. System
          text size and VoiceOver are supported; the app uses no
          motion-dependent interactions.
        </Copy>
        <Row>
          {(["system", "light", "dark"] as const).map((appearance) => (
            <Button
              key={appearance}
              title={appearance}
              selected={s.preferences.appearance === appearance}
              onPress={() =>
                commit((old) => ({
                  ...old,
                  preferences: { ...old.preferences, appearance },
                }))
              }
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Heading>Your data</Heading>
        <Copy small>
          Encrypted on this device. No backend or external AI. Export creates a
          temporary unencrypted JSON file for the share sheet; choose a
          destination you trust. The temporary file is deleted after sharing.
        </Copy>
        <Button title="Export my data" onPress={() => void exportData()} />
        <Button
          title="Delete wellbeing observations"
          onPress={() =>
            Alert.alert(
              "Delete observations?",
              "This permanently removes check-ins, sleep, screen observations and computed wellbeing indicators.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => commit((old) => ({ ...old, checkins: [] })),
                },
              ],
            )
          }
        />
        <Button
          title={
            s.demo ? "Clear demo and start fresh" : "Delete all local data"
          }
          onPress={() =>
            Alert.alert(
              "Clear all local data?",
              "Goals, plans, habits, observations and cached availability will be removed. Google access must be disconnected separately.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () =>
                    commit(() => ({ ...defaultState, onboarded: true })),
                },
              ],
            )
          }
        />
      </Card>
      <Card>
        <Heading>Support</Heading>
        <Copy>
          Steadier is a nonclinical self-management tool. For support with your
          mental health, speak with your GP or a qualified professional. If you
          are in immediate danger, contact local emergency services.
        </Copy>
        <Button
          title="NHS mental health support"
          onPress={() =>
            void Linking.openURL("https://www.nhs.uk/mental-health/")
          }
        />
        <Copy small>
          No automatic emergency response is provided. Medication decisions
          belong with your clinician. HealthKit and Screen Time integrations are
          disabled and not implemented.
        </Copy>
      </Card>
    </Page>
  );
}
