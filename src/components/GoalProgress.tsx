import React from "react";
import { View } from "react-native";
import { Copy, useTheme } from "./ui";
export function GoalProgress({ done, total }: { done: number; total: number }) {
  const t = useTheme(),
    percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Goal progress"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={{ height: 9, borderRadius: 5, backgroundColor: t.button }}
      >
        <View
          style={{
            height: 9,
            borderRadius: 5,
            backgroundColor: t.accent,
            width: `${percent}%`,
          }}
        />
      </View>
      <Copy small>
        {total
          ? `${done} of ${total} milestones and actions complete · ${percent}%`
          : "No work added yet"}
      </Copy>
    </>
  );
}
