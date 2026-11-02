import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "./AppState";
export function useTheme() {
  const system = useColorScheme(),
    { state } = useStore();
  const dark =
    state.preferences.appearance === "dark" ||
    (state.preferences.appearance === "system" && system === "dark");
  return dark
    ? {
        bg: "#101C1A",
        card: "#1C2C29",
        text: "#F0F5EF",
        muted: "#BACBC3",
        accent: "#A9D9C2",
        button: "#284F40",
        border: "#456055",
      }
    : {
        bg: "#F4F5EE",
        card: "#FFFFFF",
        text: "#19382D",
        muted: "#52675D",
        accent: "#275F47",
        button: "#DCECE0",
        border: "#B7C8BC",
      };
}
export function Page({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {title && <Heading>{title}</Heading>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: 27, fontWeight: "600", color: t.text }}
    >
      {children}
    </Text>
  );
}
export function Copy({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: small ? t.muted : t.text,
        fontSize: small ? 14 : 17,
        lineHeight: small ? 21 : 26,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.card,
        borderRadius: 20,
        padding: 18,
        gap: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  selected = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        justifyContent: "center",
        padding: 12,
        borderRadius: 12,
        backgroundColor: t.button,
        borderWidth: selected ? 2 : 0,
        borderColor: t.accent,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          color: t.text,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  multiline?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <Copy small>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        autoCapitalize="sentences"
        style={{
          minHeight: 48,
          padding: 12,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          color: t.text,
          fontSize: 17,
        }}
      />
    </View>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {children}
    </View>
  );
}
export const message = (e: unknown) =>
  e instanceof Error ? e.message : String(e);
