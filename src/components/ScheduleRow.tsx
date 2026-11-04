import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "./ui";

export function ScheduleRow({
  title,
  start,
  end,
  label,
  completed,
  onComplete,
  children,
}: {
  title: string;
  start: string;
  end: string;
  label: string;
  completed?: boolean;
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ width: 54, paddingTop: 14 }}>
        <Text style={{ color: t.muted, fontSize: 12 }}>{start}</Text>
        <Text style={{ color: t.muted, fontSize: 12 }}>{end}</Text>
      </View>
      <View style={{ width: 10, alignItems: "center" }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: -12,
            width: 2,
            backgroundColor: t.border,
          }}
        />
        <View
          style={{
            marginTop: 19,
            width: 9,
            height: 9,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: t.accent,
            backgroundColor: t.bg,
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: t.card,
          borderRadius: 19,
          padding: 12,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            disabled={!onComplete}
            accessibilityRole={onComplete ? "button" : undefined}
            accessibilityLabel={onComplete ? `Options for ${title}` : title}
            accessibilityState={onComplete ? { expanded } : undefined}
            onPress={() => setExpanded(!expanded)}
            style={{ flex: 1, minHeight: 44, justifyContent: "center", gap: 5 }}
          >
            <Text
              style={{
                color: t.text,
                fontWeight: "700",
                fontSize: 15,
                textDecorationLine: completed ? "line-through" : "none",
              }}
            >
              {title}
            </Text>
            <Text style={{ color: t.muted, fontSize: 11 }}>
              {label}
              {onComplete
                ? expanded
                  ? " · Hide options"
                  : " · Tap for options"
                : ""}
            </Text>
          </Pressable>
          {onComplete && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`Complete scheduled item: ${title}`}
              accessibilityState={{ checked: !!completed }}
              onPress={onComplete}
              style={{
                width: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.accent, fontSize: 27 }}>
                {completed ? "✓" : "○"}
              </Text>
            </Pressable>
          )}
        </View>
        {expanded && children}
      </View>
    </View>
  );
}
