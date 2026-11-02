import React from "react";
import { useStore } from "../../src/components/AppState";
import { Button, Card, Copy, Heading, Page } from "../../src/components/ui";
import { detectPatterns } from "../../src/engines/patternDetector";
import { localDate, nextDate } from "../../src/utils/time";
import { TrendChart } from "../../src/components/TrendChart";
export default function Insights() {
  const { state: s, update } = useStore(),
    pattern = detectPatterns(s.checkins, localDate(s.preferences.zone)),
    today = localDate(s.preferences.zone),
    rows = [...s.checkins]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 28);
  const feedbackKey = `patterns-1:${rows[0]?.date || "none"}`;
  return (
    <Page title="Insights">
      <Card>
        <Heading>Personal observations</Heading>
        <Copy>
          {s.feedback[feedbackKey] === "dismissed"
            ? "This observation is dismissed. New observations may produce a new comparison."
            : s.preferences.patterns
              ? pattern.text
              : "Pattern observations are disabled."}
        </Copy>
        <Copy small>
          These are exploratory observations, not a diagnosis. Missing days are
          excluded. Task completion never determines wellbeing.
        </Copy>
        {pattern.sufficient &&
          s.preferences.patterns &&
          !s.feedback[feedbackKey] && (
            <>
              <Button
                title="Helpful"
                onPress={() =>
                  void update((old) => ({
                    ...old,
                    feedback: { ...old.feedback, [feedbackKey]: "helpful" },
                  })).catch(() => {})
                }
              />
              <Button
                title="Dismiss"
                onPress={() =>
                  void update((old) => ({
                    ...old,
                    feedback: { ...old.feedback, [feedbackKey]: "dismissed" },
                  })).catch(() => {})
                }
              />
            </>
          )}
      </Card>
      <Card>
        <Heading>Mood, energy and sleep</Heading>
        <TrendChart observations={s.checkins} date={today} />
        <Copy small>
          Latest 28 recorded days. Values are original manual observations; a
          dash means missing.
        </Copy>
        {!rows.length && <Copy>No observations yet.</Copy>}
        {rows.map((c) => (
          <Copy key={c.id} small>
            {c.date} · mood {c.mood ?? "—"} · energy {c.energy ?? "—"} · sleep{" "}
            {c.sleepHours ?? "—"} h · quality {c.sleepQuality ?? "—"} · screen{" "}
            {c.screenMinutes ?? "—"} min
          </Copy>
        ))}
      </Card>
      <Card>
        <Heading>Flexible routines</Heading>
        {s.habits.map((h) => {
          const week = Object.entries(s.habitLogs)
              .filter(([d]) => d >= nextDate(today, -6) && d <= today)
              .filter(([, ids]) => ids.includes(h.id)).length,
            month = Object.entries(s.habitLogs)
              .filter(([d]) => d >= nextDate(today, -29) && d <= today)
              .filter(([, ids]) => ids.includes(h.id)).length;
          return (
            <Copy key={h.id}>
              {h.name}: {week} days this week, {month} in 30 days · flexible aim{" "}
              {h.daysPerWeek}/week
            </Copy>
          );
        })}
        <Copy small>
          Rest and skipped days carry no penalties. Habit activity is separate
          from mood and goal progress.
        </Copy>
      </Card>
    </Page>
  );
}
