import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
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
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <AppState>
      <Navigation />
    </AppState>
  );
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F5EE", padding: 28, paddingTop: 80 }}>
      <Text style={{ color: "#19382D", fontSize: 24 }}>Steadier could not start</Text>
      <Text selectable style={{ color: "#19382D", marginTop: 20 }}>{error.message}</Text>
      <Text style={{ color: "#19382D", marginTop: 20 }}>Your saved data has not been deleted. Please share this error message so we can fix startup.</Text>
    </View>
  );
}
