import React from "react";
import { View, type ColorValue } from "react-native";

/** Small native shapes keep navigation independent of downloadable icon fonts. */
export function TabIcon({
  name,
  color,
}: {
  name: "today" | "goals" | "insights" | "settings";
  color: ColorValue;
}) {
  const outline = { borderColor: color, borderWidth: 2 };
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 26,
        height: 26,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {name === "today" && (
        <View
          style={{
            ...outline,
            width: 23,
            height: 23,
            borderRadius: 12,
            borderWidth: 6,
          }}
        />
      )}
      {name === "goals" && (
        <View
          style={{
            ...outline,
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{ ...outline, width: 12, height: 12, borderRadius: 6 }}
          />
        </View>
      )}
      {name === "insights" && (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
          {[12, 19, 26].map((height) => (
            <View
              key={height}
              style={{
                width: 5,
                height,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      )}
      {name === "settings" && (
        <View style={{ gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: 24,
                height: 3,
                borderRadius: 2,
                backgroundColor: color,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: i === 1 ? 14 : 4,
                  top: -2,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
