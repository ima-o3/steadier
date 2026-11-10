import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();
  const orbitSize = Math.min(width - 30, 390);
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

  const orbitalDecor = [
    { label: "♡", x: 0.18, y: 0.14, color: "#FFD3D8", rotation: "-12deg" },
    { label: "✦", x: 0.72, y: 0.12, color: "#EDC8FF", rotation: "20deg" },
    { label: "◷", x: 0.86, y: 0.47, color: "#FFE3A6", rotation: "9deg" },
    { label: "☀", x: 0.68, y: 0.78, color: "#F6C1DB", rotation: "-10deg" },
    { label: "✓", x: 0.2, y: 0.76, color: "#D4EDC5", rotation: "15deg" },
    { label: "▢", x: 0.11, y: 0.48, color: "#C3E6FF", rotation: "-10deg" },
  ] as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "left", "right"]}>
      {step === 0 ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 28,
            paddingBottom: 26,
            justifyContent: "space-between",
            backgroundColor: state.preferences.appearance === "dark" ? t.bg : "#FCF9FF",
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
            }}
          >
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={{
                width: orbitSize,
                height: orbitSize,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: orbitSize * 0.94,
                  height: orbitSize * 0.94,
                  borderRadius: orbitSize,
                  borderWidth: 2,
                  borderColor: state.preferences.appearance === "dark" ? t.border : "#E8DFEF",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  width: orbitSize * 0.65,
                  height: orbitSize * 0.65,
                  borderRadius: orbitSize,
                  borderWidth: 2,
                  borderColor: state.preferences.appearance === "dark" ? t.border : "#E9DDEB",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  width: orbitSize * 0.35,
                  height: orbitSize * 0.35,
                  borderRadius: orbitSize,
                  borderWidth: 2,
                  borderColor: state.preferences.appearance === "dark" ? t.border : "#E7D9EB",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.card,
                }}
              >
                <Text style={{ color: t.accent, fontSize: 58 }}>✦</Text>
              </View>
              {orbitalDecor.map((item, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: orbitSize * item.x - 26,
                    top: orbitSize * item.y - 26,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: item.color,
                    borderWidth: 3,
                    borderColor: t.card,
                    justifyContent: "center",
                    alignItems: "center",
                    transform: [{ rotate: item.rotation }],
                  }}
                >
                  <Text style={{ fontSize: 28, color: "#754B94", fontWeight: "700" }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            <Image
              source={require("../../assets/icon.png")}
              style={{ width: 46, height: 46, borderRadius: 14 }}
            />
            <Text style={{ color: t.muted, fontSize: 21, fontWeight: "800" }}>
              steadier
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                color: t.text,
                fontSize: 34,
                fontWeight: "800",
                textAlign: "center",
                letterSpacing: -0.8,
                marginTop: 7,
              }}
            >
              Small steps. Better days.
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: t.accent,
                textAlign: "center",
              }}
            >
              Start here
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            onPress={() => setStep(1)}
            style={({ pressed }) => ({
              backgroundColor: state.preferences.appearance === "dark" ? t.accent : "#17141B",
              minHeight: 58,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: state.preferences.appearance === "dark" ? t.onAccent : "#FFFFFF",
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              Get Started
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 26,
            paddingBottom: 32,
            gap: 28,
          }}
        >
          <View style={{ gap: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 38, height: 38, borderRadius: 12 }}
              />
              <Text style={{ color: t.accent, fontSize: 20, fontWeight: "800" }}>
                steadier
              </Text>
            </View>
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: "700" }}>
              HOW IT WORKS · {tutorial[step - 1].number}
            </Text>
            <View
              style={{
                height: 190,
                borderRadius: 32,
                backgroundColor: t.selected,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.accent, fontSize: 78 }}>
                {tutorial[step - 1].icon}
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 34,
                fontWeight: "800",
                color: t.text,
                letterSpacing: -0.5,
              }}
            >
              {tutorial[step - 1].title}
            </Text>
            <Text style={{ fontSize: 18, lineHeight: 27, color: t.muted }}>
              {tutorial[step - 1].description}
            </Text>
            <View style={{ backgroundColor: t.card, padding: 18, borderRadius: 22 }}>
              <Text style={{ color: t.text, fontSize: 16, lineHeight: 24 }}>
                {tutorial[step - 1].example}
              </Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {primary(
              step === tutorial.length ? "Set my first goal" : "Next",
              () =>
                step === tutorial.length
                  ? void finish("goals")
                  : setStep((current) => current + 1),
            )}
            {secondary("Back", () => setStep((current) => current - 1))}
            <Pressable
              accessibilityRole="button"
              onPress={() => void finish("goals")}
              style={{ padding: 12, minHeight: 44 }}
            >
              <Text style={{ color: t.muted, fontSize: 15, textAlign: "center" }}>
                Skip tutorial
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
