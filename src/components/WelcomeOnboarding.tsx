import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "./AppState";
import { useTheme } from "./ui";
import { demoState } from "../features/demo";

const tutorial = [
  {
    number: "01 / 03",
    icon: "✦",
    title: "Choose one goal",
    description:
      "Start with something that matters to you. A small goal is a great place to begin.",
    example: "Example: Read for 10 minutes a day.",
  },
  {
    number: "02 / 03",
    icon: "♡",
    title: "Check in with yourself",
    description:
      "Tell Steadier how you're feeling. You can skip this whenever you want.",
    example: "Your energy can change from day to day.",
  },
  {
    number: "03 / 03",
    icon: "☀",
    title: "Make a flexible plan",
    description:
      "Choose an easier or fuller day. Steadier suggests steps that fit the pace you choose.",
    example: "Hard day? Make your plan easier. Small steps still count.",
  },
] as const;

export function WelcomeOnboarding() {
  const t = useTheme();
  const router = useRouter();
  const { state, update } = useStore();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const hasPersonalData =
    state.goals.length > 0 ||
    state.checkins.length > 0 ||
    state.commitments.length > 0;

  async function finish(destination: "goals" | "today" | "demo") {
    if (busy) return;
    setBusy(true);
    try {
      if (destination === "demo") {
        if (hasPersonalData) return;
        await update(demoState);
      } else {
        await update((old) => ({ ...old, onboarded: true }));
      }
      if (destination === "goals") {
        router.replace("/goals?new=1");
      } else {
        router.replace("/");
      }
    } catch (error) {
      Alert.alert("Could not get started", "Please try again. Your data is safe.");
    } finally {
      setBusy(false);
    }
  }

  const primary = (title: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: t.accent,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 18,
        minHeight: 54,
        justifyContent: "center",
        opacity: busy ? 0.5 : pressed ? 0.82 : 1,
      })}
    >
      <Text
        style={{
          color: t.onAccent,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );

  const secondary = (title: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        padding: 12,
        justifyContent: "center",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.card,
        opacity: busy ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{ color: t.text, fontSize: 16, fontWeight: "600", textAlign: "center" }}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 42,
          gap: 24,
        }}
      >
        <View style={{ gap: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={require("../../assets/icon.png")}
              style={{ width: 46, height: 46, borderRadius: 15 }}
            />
            <Text style={{ color: t.accent, fontSize: 21, fontWeight: "800" }}>
              steadier
            </Text>
          </View>

          {step === 0 ? (
            <>
              <View
                style={{
                  minHeight: 174,
                  backgroundColor: t.selected,
                  borderRadius: 32,
                  padding: 24,
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    width: 175,
                    height: 175,
                    borderRadius: 88,
                    borderWidth: 26,
                    borderColor: t.button,
                    position: "absolute",
                    right: -28,
                    top: -34,
                    opacity: 0.8,
                  }}
                />
                <Text
                  style={{ color: t.accent, fontSize: 13, fontWeight: "800", letterSpacing: 1 }}
                >
                  A LITTLE PROGRESS, EVERY DAY
                </Text>
                <Text
                  style={{
                    color: t.text,
                    fontSize: 30,
                    lineHeight: 37,
                    letterSpacing: -0.7,
                    fontWeight: "800",
                    marginTop: 14,
                    maxWidth: 270,
                  }}
                >
                  Your pace is enough.
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: t.text,
                    fontSize: 35,
                    fontWeight: "800",
                    letterSpacing: -0.8,
                  }}
                >
                  Welcome to Steadier
                </Text>
                <Text style={{ color: t.muted, fontSize: 18, lineHeight: 27 }}>
                  A gentler way to set goals and plan your day, even when your energy changes.
                </Text>
              </View>
              <View style={{ gap: 13, backgroundColor: t.card, padding: 20, borderRadius: 25 }}>
                {[
                  ["1", "Pick one small goal"],
                  ["2", "Check in when you want"],
                  ["3", "Make a plan that fits today"],
                ].map(([number, label]) => (
                  <View key={number} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                    <View
                      style={{
                        backgroundColor: t.button,
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: t.accent, fontWeight: "800" }}>{number}</Text>
                    </View>
                    <Text style={{ color: t.text, fontSize: 16, fontWeight: "600", flex: 1 }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={{ gap: 19 }}>
              <Text
                style={{ color: t.accent, fontSize: 14, fontWeight: "800", letterSpacing: 1 }}
              >
                HOW IT WORKS · {tutorial[step - 1].number}
              </Text>
              <View
                style={{
                  backgroundColor: t.selected,
                  height: 180,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{ fontSize: 76, color: t.accent }}
                >
                  {tutorial[step - 1].icon}
                </Text>
              </View>
              <Text
                accessibilityRole="header"
                style={{ color: t.text, fontSize: 34, fontWeight: "800", letterSpacing: -0.6 }}
              >
                {tutorial[step - 1].title}
              </Text>
              <Text style={{ color: t.muted, fontSize: 18, lineHeight: 27 }}>
                {tutorial[step - 1].description}
              </Text>
              <View style={{ backgroundColor: t.card, borderRadius: 20, padding: 18 }}>
                <Text style={{ color: t.text, fontSize: 16, lineHeight: 24 }}>
                  {tutorial[step - 1].example}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ gap: 11 }}>
          {step === 0 ? (
            <>
              {primary("Set my first goal", () => void finish("goals"))}
              {secondary("Show me how it works", () => setStep(1))}
              <Pressable
                accessibilityRole="button"
                onPress={() => void finish("today")}
                style={{ padding: 12, minHeight: 44 }}
              >
                <Text style={{ color: t.muted, fontSize: 15, textAlign: "center" }}>
                  Explore the app first
                </Text>
              </Pressable>
              {!hasPersonalData && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void finish("demo")}
                  style={{ padding: 8, minHeight: 44 }}
                >
                  <Text style={{ color: t.muted, fontSize: 14, textAlign: "center" }}>
                    Try with example data
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              {primary(
                step === tutorial.length ? "Set my first goal" : "Next",
                () =>
                  step === tutorial.length
                    ? void finish("goals")
                    : setStep((value) => value + 1),
              )}
              {secondary("Back", () => setStep((value) => value - 1))}
              <Pressable
                accessibilityRole="button"
                onPress={() => void finish("goals")}
                style={{ padding: 12, minHeight: 44 }}
              >
                <Text style={{ color: t.muted, fontSize: 15, textAlign: "center" }}>
                  Skip tutorial
                </Text>
              </Pressable>
            </>
          )}
          <Text style={{ color: t.muted, fontSize: 12, textAlign: "center" }}>
            No pressure. You can change your plan whenever you need to.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
