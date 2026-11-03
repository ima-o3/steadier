import React, { useMemo, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import { Button, Row, useTheme } from "./ui";

export function SlideDelete({
  name,
  onDelete,
}: {
  name: string;
  onDelete: () => void;
}) {
  const t = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [offset, setOffset] = useState(0);
  const gesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) =>
          setOffset(Math.min(90, Math.max(0, g.dx))),
        onPanResponderRelease: (_, g) => {
          setOffset(0);
          if (g.dx >= 65) setRevealed(true);
        },
        onPanResponderTerminate: () => setOffset(0),
      }),
    [],
  );
  return revealed ? (
    <Row>
      <Button title="Delete" onPress={onDelete} />
      <Button title="Keep goal" onPress={() => setRevealed(false)} />
    </Row>
  ) : (
    <View
      {...gesture.panHandlers}
      style={{
        borderRadius: 24,
        backgroundColor: t.button,
        padding: 4,
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Show delete for ${name}`}
        accessibilityHint="Reveals a Delete button. Your goal is not deleted yet."
        onPress={() => setRevealed(true)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: t.selected,
          justifyContent: "center",
          alignItems: "center",
          transform: [{ translateX: offset }],
        }}
      >
        <Text style={{ color: t.text, fontSize: 22 }}>→</Text>
      </Pressable>
      <Text style={{ color: t.muted, fontSize: 14, marginLeft: 8 }}>
        Slide right to reveal Delete
      </Text>
    </View>
  );
}
