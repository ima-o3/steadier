import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "./AppState";
import { Card, Copy, useTheme } from "./ui";
import { localDate, nextDate } from "../utils/time";

export function TodayOverview() {
  const { state } = useStore();
  const t = useTheme();
  const today = localDate(state.preferences.zone);
  const [selected, setSelected] = useState(today);
  const date =
    selected > today || selected < nextDate(today, -6) ? today : selected;
  const check = state.checkins.find((c) => c.date === date);
  const days = Array.from({ length: 7 }, (_, i) => nextDate(today, i - 6));
  return (
    <View style={{ gap: 16 }}>
      <Copy small>A little space for you, every day.</Copy>
      <View
        style={{
          backgroundColor: t.card,
          borderRadius: 24,
          padding: 10,
          flexDirection: "row",
          gap: 4,
        }}
      >
        {days.map((day) => {
          const recorded = state.checkins.some(
            (c) =>
              c.date === day &&
              (c.mood !== undefined || c.energy !== undefined),
          );
          const active = date === day;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`${day}, ${recorded ? "check-in recorded" : "no mood or energy recorded"}`}
              accessibilityState={{ selected: active }}
              onPress={() => setSelected(day)}
              style={{
                flex: 1,
                minHeight: 78,
                borderRadius: 16,
                backgroundColor: active ? t.selected : t.button,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderWidth: active ? 2 : 0,
                borderColor: t.accent,
              }}
            >
              <Text style={{ color: t.muted, fontSize: 11 }}>
                {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </Text>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>
                {Number(day.slice(-2))}
              </Text>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: recorded ? t.accent : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <Copy small>
        {date === today ? "Your day at a glance" : `Your check-in · ${date}`}
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {(
          [
            ["Mood", check?.mood, "/ 10"],
            ["Energy", check?.energy, "/ 10"],
            ["Sleep", check?.sleepHours, "hours"],
          ] as const
        ).map(([label, value, unit]) => (
          <View
            key={label}
            style={{
              flexGrow: 1,
              flexBasis: label === "Sleep" ? "100%" : "45%",
            }}
          >
            <Card>
              <Text
                style={{ color: t.accent, fontSize: 15, fontWeight: "700" }}
              >
                {label}
              </Text>
              <Text
                accessibilityLabel={`${label} summary: ${value === undefined ? "not recorded" : `${value} ${unit}`}`}
                style={{ color: t.text, fontSize: 30, fontWeight: "800" }}
              >
                {value ?? "—"}
                <Text
                  style={{ color: t.muted, fontSize: 14, fontWeight: "400" }}
                >
                  {" "}
                  {value === undefined ? "Not recorded" : unit}
                </Text>
              </Text>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}
