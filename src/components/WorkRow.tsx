import { palette } from "./palette";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function WorkRow({
  kind,
  title,
  subtitle,
  completed,
  onToggle,
  onEdit,
  onDelete,
}: {
  kind: "action" | "milestone";
  title: string;
  subtitle?: string;
  completed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = kind === "action" ? palette.actionText : palette.milestoneText;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: color + "22",
        gap: 4,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${completed ? "Reopen" : "Complete"} ${kind}: ${title}`}
        accessibilityState={{ checked: completed }}
        onPress={onToggle}
        style={{
          minWidth: 44,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color, fontSize: 27 }}>{completed ? "☑" : "☐"}</Text>
      </Pressable>
      <View style={{ flex: 1, paddingVertical: 8 }}>
        <Text
          style={{
            color,
            fontSize: 17,
            textDecorationLine: completed ? "line-through" : "none",
          }}
        >
          {title}
        </Text>
        {!!subtitle && <Text style={{ color, fontSize: 13 }}>{subtitle}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${kind}: ${title}`}
        onPress={onEdit}
        style={{
          minWidth: 44,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color, fontSize: 23 }}>✎</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${kind}: ${title}`}
        onPress={onDelete}
        style={{
          minWidth: 44,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color, fontSize: 20 }}>×</Text>
      </Pressable>
    </View>
  );
}
