import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "./AppState";
import { palette } from "./palette";
export function useTheme() {
  const system = useColorScheme(),
    { state } = useStore();
  const dark =
    state.preferences.appearance === "dark" ||
    (state.preferences.appearance === "system" && system === "dark");
  return dark
    ? {
        bg: "#211D32",
        card: "#302A45",
        text: palette.linen,
        muted: "#D4C9CE",
        accent: "#C9B9FF",
        onAccent: "#28204F",
        button: "#42395C",
        selected: "#57447E",
        border: "#625675",
      }
    : {
        bg: "#F1EBFC",
        card: "#FFFFFF",
        text: palette.ink,
        muted: "#6B627E",
        accent: palette.accent,
        onAccent: "#FFFFFF",
        button: "#F0ECFC",
        selected: palette.lilac,
        border: "#DDD5ED",
      };
}
export function Page({
  children,
  title,
  scrollRef,
}: {
  children: React.ReactNode;
  title?: string;
  scrollRef?: React.RefObject<React.ComponentRef<typeof ScrollView> | null>;
}) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {title && (
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 36,
              fontWeight: "800",
              letterSpacing: -1,
              color: t.text,
            }}
          >
            {title}
          </Text>
        )}
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
      style={{ fontSize: 24, fontWeight: "700", color: t.text }}
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
        borderRadius: 28,
        padding: 20,
        gap: 12,
        borderWidth: 0,
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
        borderRadius: 18,
        backgroundColor: selected ? t.selected : t.button,
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
  prominent = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  prominent?: boolean;
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
          minHeight: multiline ? 100 : 48,
          textAlignVertical: multiline ? "top" : "center",
          padding: 12,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 16,
          color: t.text,
          fontSize: prominent ? 23 : 17,
          fontWeight: prominent ? "600" : "400",
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
