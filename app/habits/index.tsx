import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Page, Button, Card, Copy, Heading } from "../../src/components/ui";
import { Routines } from "../../src/components/Routines";
import { ScreenTime } from "../../src/components/ScreenTime";
import { useStore } from "../../src/components/AppState";
import { localDate } from "../../src/utils/time";
export default function Habits() {
  const router = useRouter();
  const { state } = useStore();
  const today = localDate(state.preferences.zone);
  const screenMinutes = state.checkins.find(
    (c) => c.date === today,
  )?.screenMinutes;
  // Refresh the existing native report on return, including across midnight.
  // This is a view key, not a second usage store.
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => setVisit((v) => v + 1), []));
  return (
    <Page title="Habit tracker">
      <Button title="Back" onPress={() => router.back()} />
      <Routines dashboard />
      <ScreenTime key={visit} refreshable />
      <Card>
        <Heading>Saved screen time</Heading>
        <Copy>
          {screenMinutes === undefined
            ? "No screen time saved in today’s check-in."
            : `${screenMinutes} min · ${today}`}
        </Copy>
        <Copy small>
          From your existing check-in, not the iPhone report above. Changes to
          that check-in appear here automatically. No extra entry is needed
          here.
        </Copy>
      </Card>
    </Page>
  );
}
