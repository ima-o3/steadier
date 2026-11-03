import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useStore } from "../../src/components/AppState";
import {
  Button,
  Card,
  Copy,
  Heading,
  Page,
  Row,
} from "../../src/components/ui";
import { Heatmap } from "../../src/components/Heatmap";
import { at, clock, localDate, nextDate } from "../../src/utils/time";

export default function Calendar() {
  const { state } = useStore();
  const router = useRouter();
  const today = localDate(state.preferences.zone);
  const [date, setDate] = useState(today);
  const appointments = state.commitments.filter(
    (c) =>
      c.start < at(nextDate(date, 1), 0, state.preferences.zone) &&
      c.end > at(date, 0, state.preferences.zone),
  );
  return (
    <Page title="Calendar">
      <Card>
        <Heading>{date === today ? "Today’s appointments" : date}</Heading>
        <Row>
          <Button
            title="Previous day"
            onPress={() => setDate(nextDate(date, -1))}
          />
          <Button title="Next day" onPress={() => setDate(nextDate(date, 1))} />
          <Button title="Today" onPress={() => setDate(today)} />
        </Row>
        {!appointments.length && <Copy>No appointments recorded.</Copy>}
        {[...appointments]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((c) => (
            <Copy key={c.id}>
              {c.allDay ? "All day" : clock(c.start, state.preferences.zone)} ·{" "}
              {c.title}
            </Copy>
          ))}
        <Button
          title="Manage appointments"
          onPress={() => router.push("/settings")}
        />
      </Card>
      <Heatmap />
    </Page>
  );
}
