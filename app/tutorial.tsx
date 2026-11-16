import { completeTutorial } from "../src/features/onboarding/flow";
import React from "react";
import { useRouter } from "expo-router";
import { Welcome } from "../src/components/Welcome";
import { useStore } from "../src/components/AppState";
export default function Tutorial() {
  const router = useRouter();
  const { update } = useStore();
  return (
    <Welcome
      replay
      onComplete={async () => {
        await update(completeTutorial);
        router.replace("/goals");
      }}
    />
  );
}
