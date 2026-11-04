import React, { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import { useTheme } from "./ui";
export function SwipeDelete({
  name,
  onDelete,
  children,
}: {
  name: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme(),
    x = useRef(new Animated.Value(0)).current,
    base = useRef(0),
    [open, setOpen] = useState(false);
  const settle = (value: number) => {
    base.current = value;
    setOpen(value < 0);
    Animated.spring(x, {
      toValue: value,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () =>
          x.stopAnimation((value) => {
            base.current = value;
          }),
        onPanResponderMove: (_, g) =>
          x.setValue(Math.max(-96, Math.min(0, base.current + g.dx))),
        onPanResponderRelease: (_, g) =>
          settle(
            g.vx < -0.4
              ? -96
              : g.vx > 0.4
                ? 0
                : base.current + g.dx < -45
                  ? -96
                  : 0,
          ),
        onPanResponderTerminate: () => settle(0),
      }),
    [x],
  );
  return (
    <View style={{ borderRadius: 24, overflow: "hidden" }}>
      <Pressable
        accessible={open}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        pointerEvents={open ? "auto" : "none"}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${name}`}
        onPress={onDelete}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 96,
          backgroundColor: "#A4344A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Delete</Text>
      </Pressable>
      <Animated.View
        {...responder.panHandlers}
        style={{ transform: [{ translateX: x }], backgroundColor: t.bg }}
      >
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${open ? "Hide" : "Show"} delete for ${name}`}
          onPress={() => settle(open ? 0 : -96)}
          style={{
            minHeight: 44,
            justifyContent: "center",
            alignItems: "flex-end",
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {open ? "Cancel" : "•••"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
