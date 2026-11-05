import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { AppState } from "../src/components/AppState";
import { useTheme } from "../src/components/ui";
import { TabIcon } from "../src/components/TabIcon";
function Navigation() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabIcon name="today" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => <TabIcon name="goals" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <TabIcon name="insights" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen name="habits/index" options={{ href: null }} />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F5F2",
        padding: 28,
        paddingTop: 80,
      }}
    >
      <Text style={{ color: "#34302D", fontSize: 24 }}>
        Steadier could not start
      </Text>
      <Text selectable style={{ color: "#34302D", marginTop: 20 }}>
        {error.message}
      </Text>
      <Text style={{ color: "#34302D", marginTop: 20 }}>
        Your saved data has not been deleted. Please share this error message so
        we can fix startup.
      </Text>
    </View>
  );
}
