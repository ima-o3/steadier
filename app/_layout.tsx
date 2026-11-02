import React from "react";
import { Tabs } from "expo-router";
import { AppState } from "../src/components/AppState";
import { useTheme } from "../src/components/ui";
function Navigation() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card },
        tabBarLabelStyle: { fontSize: 13 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="goals/index" options={{ title: "Goals" }} />
      <Tabs.Screen name="insights/index" options={{ title: "Insights" }} />
      <Tabs.Screen name="settings/index" options={{ title: "Settings" }} />
    </Tabs>
  );
}
export default function Layout() {
  return (
    <AppState>
      <Navigation />
    </AppState>
  );
}
