import React, { useState } from "react";
import { Pressable, View, Text, Alert } from "react-native";
import { useStore } from "./AppState";
import { Button, Card, Copy, Heading, Row, useTheme, Field } from "./ui";
import { indicator } from "../engines/patternDetector";
import { localDate } from "../utils/time";
export function Heatmap() {
  const { state, update } = useStore(),
    t = useTheme();
  const [month, setMonth] = useState(
      localDate(state.preferences.zone).slice(0, 7),
    ),
    [selected, setSelected] = useState(""),
    [annotation, setAnnotation] = useState("");
  const year = Number(month.slice(0, 4)),
    m = Number(month.slice(5)),
    days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
    offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const change = (n: number) => {
    const d = new Date(Date.UTC(year, m - 1 + n, 1));
    setMonth(d.toISOString().slice(0, 7));
    setSelected("");
  };
  const observation = state.checkins.find((c) => c.date === selected),
    value = indicator(observation);
  return (
    <Card>
      <Heading>Wellbeing</Heading>
      <Row>
        <Button title="‹ Previous" onPress={() => change(-1)} />
        <Button title="Next ›" onPress={() => change(1)} />
      </Row>
      <Copy>
        {new Intl.DateTimeFormat("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(year, m - 1, 1)))}
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <View key={i} style={{ width: "14.285%", alignItems: "center" }}>
            <Copy small>{d}</Copy>
          </View>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <View key={`blank-${i}`} style={{ width: "14.285%" }} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`,
            ind = indicator(state.checkins.find((c) => c.date === date));
          const color = !ind
            ? t.card
            : ind.value < 4
              ? "#E7C3B6"
              : ind.value < 7
                ? "#BDCCB2"
                : "#77AE93";
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`${date}: ${ind ? `${ind.value.toFixed(1)} out of 10, self-reported mood and energy` : "no wellbeing data"}`}
              onPress={() => {
                setSelected(date);
                setAnnotation(
                  state.checkins.find((c) => c.date === date)?.notes || "",
                );
              }}
              style={{ width: "14.285%", minHeight: 48, padding: 3 }}
            >
              <View
                style={{
                  flex: 1,
                  minHeight: 42,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: color,
                  borderWidth: selected === date ? 2 : 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ color: ind ? "#19382D" : t.text, fontSize: 14 }}>
                  {i + 1}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Copy small>
        Peach: 1–3.9 · sage: 4–6.9 · green: 7–10. Unfilled days have no data.
        Numbers and VoiceOver labels supplement colour.
      </Copy>
      {selected && (
        <>
          <Copy>
            {selected}:{" "}
            {value
              ? value.value.toFixed(1) + "/10"
              : "No mood or energy recorded"}
          </Copy>
          <Copy small>
            {value?.explanation || "Missing observations stay missing."}
          </Copy>
          <Copy small>
            Mood {observation?.mood ?? "—"} · energy{" "}
            {observation?.energy ?? "—"} · sleep quality{" "}
            {observation?.sleepQuality ?? "—"} · screen time{" "}
            {observation?.screenMinutes ?? "—"} min
          </Copy>
          <Copy small>
            {observation?.notes || "No annotation"}
            {observation?.sleepHours !== undefined
              ? ` · Sleep ${observation.sleepHours}h`
              : ""}
          </Copy>
          {state.preferences.tracking && (
            <>
              <Field
                label="Day annotation · optional"
                value={annotation}
                onChangeText={setAnnotation}
              />
              <Button
                title="Save annotation"
                onPress={() =>
                  void update((old) => ({
                    ...old,
                    checkins: old.checkins.some((c) => c.date === selected)
                      ? old.checkins.map((c) =>
                          c.date === selected ? { ...c, notes: annotation } : c,
                        )
                      : [
                          ...old.checkins,
                          {
                            id: `annotation-${selected}`,
                            date: selected,
                            notes: annotation,
                          },
                        ],
                  })).catch(() => {})
                }
              />
            </>
          )}
          {observation && (
            <Button
              title="Delete this day’s observations"
              onPress={() =>
                Alert.alert(
                  "Delete this day?",
                  `Remove original observations and derived wellbeing for ${selected}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () =>
                        void update((old) => ({
                          ...old,
                          checkins: old.checkins.filter(
                            (c) => c.date !== selected,
                          ),
                        })).catch(() => {}),
                    },
                  ],
                )
              }
            />
          )}
        </>
      )}
    </Card>
  );
}
