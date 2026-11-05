import React from "react";
import { useRouter } from "expo-router";
import { Page, Button } from "../../src/components/ui";
import { Routines } from "../../src/components/Routines";
export default function Habits() {
  const router = useRouter();
  return (
    <Page title="Habit tracker">
      <Button title="Back" onPress={() => router.back()} />
      <Routines dashboard />
    </Page>
  );
}
