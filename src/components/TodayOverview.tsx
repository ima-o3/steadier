import React, { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useStore } from "./AppState";
import { Button, Copy, useTheme } from "./ui";
import { localDate, nextDate } from "../utils/time";
import { indicator } from "../engines/patternDetector";

export function TodayOverview({ onCheckin }: { onCheckin?: () => void }) {
  const { state } = useStore();
  const t = useTheme();
  const today = localDate(state.preferences.zone);
  const [selected, setSelected] = useState(today);
  const [history, setHistory] = useState(false);
  const date =
    selected > today || selected < nextDate(today, -6) ? today : selected;
  const check = state.checkins.find((c) => c.date === date);
  const score = indicator(check);
  const days = Array.from({ length: 7 }, (_, i) => nextDate(today, i - 6));
  const size = Math.min(280, useWindowDimensions().width - 48);
  const radius = size * 0.4;
  const stroke = size * 0.105;
  const colors = ["#F4DA6F", "#C7B9E9", "#F0B6D9", "#B7CEE9"];
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: t.text, fontSize: 22, fontWeight: "700" }}
        >
          Steadier
        </Text>
        <Text style={{ color: t.muted, fontSize: 14 }}>
          {date === today ? "Today" : date}
        </Text>
      </View>
      <View
        style={{
          width: size,
          height: size,
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{ position: "absolute", width: size, height: size }}
        >
          {colors.flatMap((color, segment) =>
            Array.from({ length: 32 }, (_, i) => {
              const angle =
                ((segment * 90 - 78 + (i * 65) / 31) * Math.PI) / 180;
              return (
                <View
                  key={`${segment}-${i}`}
                  style={{
                    position: "absolute",
                    width: stroke,
                    height: stroke,
                    borderRadius: stroke / 2,
                    backgroundColor: color,
                    left: size / 2 + radius * Math.cos(angle) - stroke / 2,
                    top: size / 2 + radius * Math.sin(angle) - stroke / 2,
                  }}
                />
              );
            }),
          )}
        </View>
        <Text
          accessibilityLabel={`Wellbeing summary: ${score ? `${score.value.toFixed(1)} out of 10` : "not recorded"}`}
          style={{
            color: t.text,
            fontSize: 68,
            fontWeight: "600",
            letterSpacing: -3,
          }}
        >
          {score?.value.toFixed(1) ?? "—"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About your wellbeing score"
          onPress={() =>
            Alert.alert(
              "Your wellbeing",
              score?.explanation ??
                "Record mood or energy to see your personal wellbeing summary. Missing observations stay missing.",
            )
          }
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: t.muted, fontSize: 14 }}>
            {score ? "your wellbeing · ⓘ" : "no check-in yet · ⓘ"}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onCheckin}
        style={{
          alignSelf: "center",
          minHeight: 48,
          paddingHorizontal: 26,
          justifyContent: "center",
          borderRadius: 26,
          backgroundColor: "#242424",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
          Check in today
        </Text>
      </Pressable>
      <View
        style={{
          backgroundColor: "#F1BCDC",
          borderRadius: 24,
          padding: 20,
          gap: 8,
        }}
      >
        <Text style={{ color: "#493647", fontSize: 13 }}>
          A moment for yourself
        </Text>
        <Text
          style={{
            color: "#282326",
            fontSize: 20,
            lineHeight: 27,
            fontWeight: "600",
          }}
        >
          {score
            ? "There’s room to take today at your own pace."
            : "Start where you are. One small check-in is enough."}
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        style={{ color: t.text, fontSize: 22, fontWeight: "700" }}
      >
        Your wellbeing
      </Text>
      {(
        [
          ["Mood", check?.mood, "/ 10", colors[2]],
          ["Energy", check?.energy, "/ 10", colors[0]],
          ["Sleep", check?.sleepHours, "hours", colors[3]],
        ] as const
      ).map(([label, value, unit, color]) => (
        <View key={label} style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text style={{ color: t.text, fontSize: 16, fontWeight: "600" }}>
              {label}
            </Text>
            <Text
              accessibilityLabel={`${label} summary: ${value === undefined ? "not recorded" : `${value} ${unit}`}`}
              style={{ color: t.text, fontSize: 16 }}
            >
              {value === undefined ? "Not recorded" : `${value} ${unit}`}
            </Text>
          </View>
          {label !== "Sleep" && (
            <View
              accessible={false}
              style={{ height: 9, borderRadius: 5, backgroundColor: t.button }}
            >
              <View
                style={{
                  width: `${(value ?? 0) * 10}%`,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: color,
                }}
              />
            </View>
          )}
        </View>
      ))}
      <Button
        title={history ? "Hide recent check-ins" : "Recent check-ins"}
        onPress={() => {
          setHistory(!history);
          if (history) setSelected(today);
        }}
      />
      {history && (
        <>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {days.map((day) => {
              const recorded = state.checkins.some(
                (c) =>
                  c.date === day &&
                  (c.mood !== undefined || c.energy !== undefined),
              );
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${day}, ${recorded ? "check-in recorded" : "no mood or energy recorded"}`}
                  accessibilityState={{ selected: day === date }}
                  onPress={() => setSelected(day)}
                  style={{
                    flex: 1,
                    minHeight: 60,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: day === date ? t.selected : t.button,
                  }}
                >
                  <Text style={{ color: t.text }}>{Number(day.slice(-2))}</Text>
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: recorded ? t.accent : "transparent",
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
          <Copy small>
            {date === today
              ? "Today’s observations"
              : `Observations for ${date}`}
          </Copy>
        </>
      )}
    </View>
  );
}
