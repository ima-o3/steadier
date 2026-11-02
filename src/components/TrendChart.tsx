import React from "react";
import { View } from "react-native";
import { Checkin } from "../types";
import { nextDate } from "../utils/time";
import { Copy, useTheme } from "./ui";
export function TrendChart({
  observations,
  date,
}: {
  observations: Checkin[];
  date: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Copy small>
        14-day mood (first bar) and energy (second bar), 1–10. Missing values
        have no bar.
      </Copy>
      {Array.from({ length: 14 }, (_, i) => {
        const day = nextDate(date, i - 13),
          c = observations.find((c) => c.date === day);
        return (
          <View
            key={day}
            accessible
            accessibilityLabel={`${day}: mood ${c?.mood ?? "missing"}, energy ${c?.energy ?? "missing"}`}
            style={{ gap: 3 }}
          >
            <Copy small>
              {day.slice(5)} · {c?.mood ?? "—"} / {c?.energy ?? "—"}
            </Copy>
            {(["mood", "energy"] as const).map((key, j) => (
              <View
                key={key}
                style={{ height: 7, backgroundColor: t.bg, borderRadius: 3 }}
              >
                {c?.[key] !== undefined && (
                  <View
                    style={{
                      height: 7,
                      width: `${c[key]! * 10}%`,
                      borderRadius: 3,
                      backgroundColor: j === 0 ? t.accent : t.muted,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
