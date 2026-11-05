import { steadiness } from "../engines/steadiness";
import { SteadinessTargets } from "./SteadinessTargets";
import React from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useStore } from "./AppState";
import { useTheme } from "./ui";
import { localDate } from "../utils/time";
import { indicator, detectPatterns } from "../engines/patternDetector";
import { PlanItem } from "../types";

type Props = {
  onCheckin: () => void;
  onPlan: () => void;
  onEasier: () => void;
  onCalendar: () => void;
  onSettings: () => void;
  onComplete: (item: PlanItem) => void;
};
export function TodayOverview({
  onCheckin,
  onPlan,
  onEasier,
  onCalendar,
  onSettings,
  onComplete,
}: Props) {
  const { state } = useStore();
  const t = useTheme();
  const today = localDate(state.preferences.zone);
  const check = state.checkins.find((c) => c.date === today);
  const summary = steadiness(
    check,
    state.preferences.sleepTargetHours,
    state.preferences.screenTargetMinutes,
  );
  const weights = summary.factors.map((f) =>
    f.value === undefined ? 0.5 : Math.max(0.5, f.value),
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let cursor = -90;
  const arcs = weights.map((w) => {
    const sweep = (w / totalWeight) * 324;
    const arc = { start: cursor, sweep };
    cursor += sweep + 6;
    return arc;
  });
  const score =
    summary.value === undefined
      ? undefined
      : { value: summary.value, explanation: summary.explanation };
  const month = today.slice(0, 7);
  const dayCount = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0),
  ).getUTCDate();
  const days = Array.from(
    { length: dayCount },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
  const recorded = state.checkins.filter(
    (c) =>
      c.date.startsWith(month) && c.date <= today && indicator(c) !== undefined,
  ).length;
  const items = state.plans[today] || [];
  const pattern = state.preferences.patterns
    ? detectPatterns(state.checkins, today)
    : undefined;
  const size = Math.min(222, useWindowDimensions().width - 64);
  const radius = size * 0.4,
    stroke = size * 0.13;
  const action = (label: string, onPress: () => void, primary = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: primary ? t.accent : t.button,
      }}
    >
      <Text
        style={{
          color: primary ? t.onAccent : t.text,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 13 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("../../assets/icon.png")}
            style={{ width: 30, height: 30, borderRadius: 10 }}
          />
          <Text style={{ color: t.accent, fontSize: 21, fontWeight: "700" }}>
            Steadier
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={onSettings}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: t.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: t.accent, fontSize: 24 }}>☷</Text>
        </Pressable>
      </View>
      <View>
        <Text
          accessibilityRole="header"
          style={{
            color: t.text,
            fontSize: 32,
            fontWeight: "800",
            letterSpacing: -0.8,
          }}
        >
          Today
        </Text>
        <Text style={{ color: t.muted, fontSize: 17 }}>
          A gentle plan for your day
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Your wellbeing this month: ${recorded} recorded days. Open calendar`}
        onPress={onCalendar}
        style={{
          backgroundColor: t.card,
          borderRadius: 22,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          minHeight: 64,
        }}
      >
        <Text style={{ color: t.muted, width: 65, fontSize: 12 }}>
          Wellbeing{"\n"}this month
        </Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: t.muted, fontSize: 10 }}>
            Days 1–{dayCount} · open calendar
          </Text>
          {[days.slice(0, 16), days.slice(16)].map((row, index) => (
            <View key={index} style={{ flexDirection: "row", gap: 3 }}>
              {row.map((day) => {
                const value = indicator(
                  state.checkins.find((c) => c.date === day),
                )?.value;
                return (
                  <View
                    key={day}
                    style={{
                      flex: 1,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor:
                        day <= today && value !== undefined
                          ? t.accent
                          : t.button,
                      opacity:
                        day > today
                          ? 0.35
                          : value === undefined
                            ? 1
                            : 0.25 + value * 0.075,
                    }}
                  />
                );
              })}
              {index === 1 &&
                Array.from({ length: 32 - dayCount }, (_, i) => (
                  <View key={`empty-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
          ))}
        </View>
      </Pressable>
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
          {summary.factors.flatMap((factor, segment) =>
            Array.from({ length: 24 }, (_, i) => {
              const angle =
                ((arcs[segment]!.start + (i * arcs[segment]!.sweep) / 23) *
                  Math.PI) /
                180;
              return (
                <View
                  key={`${segment}-${i}`}
                  style={{
                    position: "absolute",
                    width: stroke,
                    height: stroke,
                    borderRadius: stroke / 2,
                    backgroundColor: factor.color,
                    opacity:
                      factor.value === undefined
                        ? 0.18
                        : 0.3 + factor.value * 0.07,
                    left: size / 2 + radius * Math.cos(angle) - stroke / 2,
                    top: size / 2 + radius * Math.sin(angle) - stroke / 2,
                  }}
                />
              );
            }),
          )}
          {summary.factors.map((factor, i) => {
            const angle =
              ((arcs[i]!.start + arcs[i]!.sweep / 2) * Math.PI) / 180;
            return (
              <Text
                key={i}
                style={{
                  position: "absolute",
                  width: 32,
                  height: 42,
                  textAlign: "center",
                  fontSize: 17,
                  color: "#55446F",
                  left: size / 2 + radius * Math.cos(angle) - 16,
                  top: size / 2 + radius * Math.sin(angle) - 16,
                }}
              >
                {factor.value === undefined ? "·" : factor.icon}
              </Text>
            );
          })}
        </View>
        <Text
          accessibilityLabel={`Wellbeing summary: ${score ? `${score.value.toFixed(1)} out of 10` : "not recorded"}`}
          style={{
            color: t.text,
            fontSize: 54,
            fontWeight: "800",
            letterSpacing: -2,
          }}
        >
          {score?.value.toFixed(1) ?? "—"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About today's steadiness"
          onPress={() =>
            Alert.alert(
              "Today’s steadiness",
              score?.explanation ??
                "Record a check-in to see your personal summary. Missing observations stay missing.",
            )
          }
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {score ? "today’s steadiness ⓘ" : "no check-in yet ⓘ"}
          </Text>
        </Pressable>
      </View>
      <SteadinessTargets />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {summary.factors.map((f) => (
          <Pressable
            key={f.name}
            accessibilityRole="button"
            accessibilityLabel={`${f.name}: ${f.raw === undefined ? "not recorded" : `${f.raw}${f.unit}`}`}
            onPress={() =>
              Alert.alert(
                f.name,
                `${f.raw === undefined ? "Not recorded" : `${f.raw}${f.unit}`}\n${f.value === undefined ? "Excluded from the summary." : `Score: ${f.value.toFixed(1)}/10`}\n\n${summary.explanation}`,
              )
            }
            style={{
              padding: 8,
              minHeight: 44,
              borderRadius: 14,
              backgroundColor: t.button,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.muted, fontSize: 11 }}>
              {f.icon} {f.name} {f.raw ?? "—"}
              {f.raw === undefined ? "" : f.unit}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {action("Plan my day", onPlan, true)}
        {action("Check in", onCheckin)}
        {action("Make it easier", onEasier)}
      </View>
      <View
        style={{
          backgroundColor: t.selected,
          borderRadius: 25,
          padding: 18,
          gap: 10,
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: t.button,
            right: -55,
            bottom: -90,
          }}
        />
        <Text style={{ color: t.accent, fontSize: 12, fontWeight: "700" }}>
          ✦ INSIGHT FOR YOU
        </Text>
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 23 }}>
          {pattern?.sufficient
            ? pattern.text.split(". ")[0] + "."
            : check?.energy !== undefined && check.energy <= 3
              ? "You’ve recorded low energy today. Would a gentler plan help?"
              : "Small steps count. Choose a plan that leaves room for rest."}
        </Text>
        <View style={{ alignSelf: "flex-start" }}>
          {action("See suggestions →", onPlan, true)}
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: t.text, fontSize: 23, fontWeight: "700" }}
        >
          Today’s plan
        </Text>
        <Text style={{ color: t.muted, fontSize: 13 }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </Text>
      </View>
      {!items.length && (
        <Pressable
          accessibilityRole="button"
          onPress={onPlan}
          style={{ backgroundColor: t.card, borderRadius: 20, padding: 18 }}
        >
          <Text style={{ color: t.text, fontSize: 15 }}>
            A little room to begin.
          </Text>
          <Text style={{ color: t.accent, marginTop: 6 }}>
            Choose your plan →
          </Text>
        </Pressable>
      )}
      {items.slice(0, 3).map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          accessibilityLabel={`${item.title}, ${item.completed ? "completed" : "not completed"}`}
          onPress={() => onComplete(item)}
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            backgroundColor: t.card,
            padding: 14,
            borderRadius: 20,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: t.button,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.accent, fontSize: 21 }}>
              {item.kind === "habit" ? "♧" : "◇"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: t.text,
                fontWeight: "700",
                fontSize: 15,
                textDecorationLine: item.completed ? "line-through" : "none",
              }}
            >
              {item.title}
            </Text>
            <Text style={{ color: t.muted, fontSize: 12, marginTop: 3 }}>
              {item.kind === "habit" ? "Small routine" : "A meaningful step"}
            </Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 25 }}>
            {item.completed ? "✓" : "○"}
          </Text>
        </Pressable>
      ))}
      {items.length > 3 && action("View full plan", onPlan)}
    </View>
  );
}
