import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, useTheme } from "./ui";
export const tutorialSteps = [
  {
    title: "Start with one goal",
    description:
      "Choose something you'd like to work towards. It doesn't have to be big.",
    help: "In Goals, tap Add goal, give it a name, then Save goal. You can add details later.",
  },
  {
    title: "Check in with yourself",
    description:
      "Record how you're feeling, whenever you want. Your energy can change from day to day.",
    help: "Mood and energy tracking are optional. A quick check-in can help you choose a gentler plan.",
  },
  {
    title: "Make a plan that fits today",
    description:
      "Steadier helps you plan around your energy, with room for breaks and easier days.",
    help: "On Today, choose Plan your day. You can move tasks, change the plan or make it easier whenever you need.",
  },
];
export function Welcome({
  replay = false,
  onComplete,
}: {
  replay?: boolean;
  onComplete: () => Promise<void>;
}) {
  const t = useTheme(),
    [step, setStep] = useState(replay ? 0 : -1),
    [saving, setSaving] = useState(false);
  async function finish() {
    if (saving) return;
    setSaving(true);
    try {
      await onComplete();
    } catch {
      Alert.alert(
        "Could not continue",
        "Your progress could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  const current = tutorialSteps[step];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 28,
          gap: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center", paddingTop: 28, gap: 24 }}>
          <View
            accessible={false}
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: t.button,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: t.border,
            }}
          >
            <View
              style={{
                width: 185,
                height: 185,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: t.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 120, height: 120, borderRadius: 35 }}
              />
            </View>
            <Text
              style={{
                position: "absolute",
                top: 10,
                right: 25,
                fontSize: 36,
                color: t.accent,
              }}
            >
              ✦
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: t.accent }}>
            Steadier
          </Text>
        </View>
        <View style={{ gap: 18 }}>
          <Text
            accessibilityRole="header"
            style={{ fontSize: 38, fontWeight: "800", color: t.text }}
          >
            {current?.title ?? "Small steps. Better days."}
          </Text>
          <Text style={{ fontSize: 21, lineHeight: 30, color: t.muted }}>
            {current?.description ?? "A gentler way to reach your goals."}
          </Text>
          {current && (
            <Text style={{ fontSize: 17, lineHeight: 26, color: t.muted }}>
              {current.help}
            </Text>
          )}
        </View>
        <View style={{ gap: 12 }}>
          {current && (
            <Text
              accessibilityLabel={`Tutorial step ${step + 1} of 3`}
              style={{ textAlign: "center", color: t.muted }}
            >
              {step + 1} of 3　
              {tutorialSteps.map((_, i) => (i === step ? "●" : "○")).join("　")}
            </Text>
          )}
          <Button
            title={
              saving
                ? "Saving…"
                : !current
                  ? "Get Started"
                  : step === 2
                    ? replay
                      ? "Create a goal"
                      : "Create my first goal"
                    : "Next"
            }
            disabled={saving}
            onPress={() =>
              !current
                ? setStep(0)
                : step === 2
                  ? void finish()
                  : setStep(step + 1)
            }
          />
          {current && (
            <>
              <Button
                title="Back"
                disabled={saving}
                onPress={() => setStep(Math.max(replay ? 0 : -1, step - 1))}
              />
              <Button
                title="Skip tutorial"
                disabled={saving}
                onPress={() => void finish()}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
