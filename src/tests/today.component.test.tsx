import React, { useState } from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Today from "../../app/index";
import { useStore } from "../components/AppState";
import { State } from "../types";
import { prefs, goal, action } from "./fixtures";
import { localDate } from "../utils/time";
jest.setTimeout(20000);

jest.mock("../components/AppState", () => ({ useStore: jest.fn() }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "checkin-id" }));

const initial: State = {
  preferences: prefs,
  goals: [goal],
  actions: [action],
  milestones: [],
  checkins: [],
  commitments: [],
  plans: {},
  excludedActions: {},
  habits: [],
  habitLogs: {},
  onboarded: true,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
let latest: State;
function Harness({ state = initial }: { state?: State }) {
  const [current, setCurrent] = useState(state);
  latest = current;
  jest.mocked(useStore).mockReturnValue({
    state: current,
    update: async (fn) => {
      setCurrent(fn);
    },
  });
  return <Today />;
}
afterEach(() => jest.restoreAllMocks());

test("tapping mood and energy updates today's wellbeing immediately and preserves both scores", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByLabelText("Energy 4 out of 10"));
  await fireEvent.press(screen.getByLabelText("Mood 8 out of 10"));
  expect(screen.getByText("Today · 6.0/10")).toBeTruthy();
  expect(
    screen.getByLabelText(
      `${localDate(prefs.zone)}: 6.0 out of 10, self-reported mood and energy`,
    ),
  ).toBeTruthy();
  expect(latest.checkins).toHaveLength(1);
  expect(latest.checkins[0]).toMatchObject({ energy: 4, mood: 8 });
  expect(
    screen.getByText("Saved · your wellbeing calendar is up to date."),
  ).toBeTruthy();
});

test("reset clears pinned unfinished suggestions while preserving completed work and appointments", async () => {
  const date = localDate(prefs.zone);
  const base = {
    start: `${date}T09:00:00Z`,
    end: `${date}T09:05:00Z`,
    title: "Task",
    kind: "task" as const,
    variant: 0,
    effort: 1,
    locked: true,
  };
  const pending = { ...base, id: "pending", completed: false };
  const done = { ...base, id: "done", title: "Finished task", completed: true };
  const alert = jest.spyOn(Alert, "alert");
  const commitments = [
    {
      id: "appointment",
      title: "Appointment",
      start: `${date}T14:00:00Z`,
      end: `${date}T15:00:00Z`,
      busy: true,
      source: "manual" as const,
    },
  ];
  await render(
    <Harness
      state={{
        ...initial,
        commitments,
        plans: { [date]: [pending, done] },
        excludedActions: { [date]: ["a"] },
        planMeta: {
          [date]: {
            mode: "steady",
            explanation: "Old plan",
            version: "planner-1",
            createdAt: date,
          },
        },
      }}
    />,
  );
  await fireEvent.press(screen.getByText("Reset today’s plan"));
  const buttons = alert.mock.calls.at(-1)?.[2];
  await act(async () => {
    buttons?.find((button) => button.text === "Reset plan")?.onPress?.();
  });
  expect(latest.plans[date]).toEqual([done]);
  expect(latest.excludedActions[date]).toEqual([]);
  expect(latest.planMeta?.[date]).toBeUndefined();
  expect(latest.actions).toEqual(initial.actions);
  expect(latest.commitments).toEqual(commitments);
  expect(screen.getByText("Generate my day")).toBeTruthy();
});

test("day choices explain their workload and selection does not generate a plan", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByText("Take it easy"));
  expect(screen.getByText(/Up to 1 small goal task/)).toBeTruthy();
  expect(latest.plans).toEqual({});
  await fireEvent.press(screen.getByText("A fuller day"));
  expect(screen.getByText(/Up to 4 goal tasks/)).toBeTruthy();
  expect(latest.plans).toEqual({});
});
