import React from "react";
import { Pressable, Text, View } from "react-native";
import { Copy, useTheme } from "./ui";

export function Rating({
  label,
  value,
  onSelect,
}: {
  label: string;
  value?: number;
  onSelect: (score: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Copy>
        {label}
        {value === undefined ? " · not recorded" : ` · ${value}/10`}
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${score} out of 10`}
            accessibilityState={{ selected: value === score }}
            onPress={() => onSelect(score)}
            style={{
              width: "18%",
              minHeight: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: value === score ? t.selected : t.button,
              borderWidth: value === score ? 2 : 0,
              borderColor: t.accent,
            }}
          >
            <Text
              style={{
                color: t.text,
                fontSize: 17,
                fontWeight: value === score ? "700" : "400",
              }}
            >
              {score}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
