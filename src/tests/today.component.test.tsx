import { syncCalendars } from "../integrations/googleCalendar/client";
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
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
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
jest.mock("../integrations/googleCalendar/client", () => ({
  syncCalendars: jest.fn(),
}));

afterEach(() => jest.restoreAllMocks());

test("schedule keeps controls collapsed, filters rows and completes only suggested work", async () => {
  const date = localDate(prefs.zone);
  const task = {
    id: "task",
    title: "Draft report",
    start: `${date}T09:00:00Z`,
    end: `${date}T09:30:00Z`,
    kind: "task" as const,
    completed: false,
    locked: false,
    variant: 0,
    effort: 1,
  };
  const habit = {
    ...task,
    id: "habit",
    title: "Walk outside",
    kind: "habit" as const,
  };
  const fixed = {
    id: "meeting",
    title: "Meeting",
    start: `${date}T11:00:00Z`,
    end: `${date}T12:00:00Z`,
    busy: true,
    source: "manual" as const,
  };
  await render(
    <Harness
      state={{
        ...initial,
        plans: { [date]: [task, habit] },
        commitments: [fixed],
      }}
    />,
  );
  expect(screen.queryByText("Move / edit time")).toBeNull();
  expect(
    screen.queryByLabelText("Complete scheduled item: Meeting"),
  ).toBeNull();
  await fireEvent.press(screen.getByLabelText("Options for Draft report"));
  expect(screen.getByText("Move / edit time")).toBeTruthy();
  await fireEvent.press(
    screen.getByLabelText("Complete scheduled item: Draft report"),
  );
  expect(latest.plans[date]?.find((i) => i.id === "task")?.completed).toBe(
    true,
  );
  expect(latest.commitments).toEqual([fixed]);
  await fireEvent.press(screen.getByRole("button", { name: "Focus" }));
  expect(screen.queryByLabelText("Options for Walk outside")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Recovery" }));
  expect(screen.getByLabelText("Options for Walk outside")).toBeTruthy();
  expect(screen.queryByLabelText("Options for Draft report")).toBeNull();
});

test("saved sleep and screen observations update the summary and editable targets", async () => {
  const date = localDate(prefs.zone);
  await render(
    <Harness
      state={{
        ...initial,
        checkins: [{ id: "check", date, sleepHours: 7, screenMinutes: 180 }],
      }}
    />,
  );
  expect(
    screen.getByLabelText("Wellbeing summary: 9.0 out of 10"),
  ).toBeTruthy();
  expect(screen.getByLabelText("Sleep duration: 7h")).toBeTruthy();
  await fireEvent.press(screen.getByText("Edit steadiness targets"));
  await fireEvent.changeText(screen.getByLabelText("Sleep target hours"), "7");
  await fireEvent.changeText(
    screen.getByLabelText("Screen time target minutes"),
    "180",
  );
  await fireEvent.press(screen.getByText("Save targets"));
  expect(
    screen.getByLabelText("Wellbeing summary: 10.0 out of 10"),
  ).toBeTruthy();
  expect(latest.preferences).toEqual({
    ...prefs,
    sleepTargetHours: 7,
    screenTargetMinutes: 180,
  });
});

test("tapping mood and energy updates today's wellbeing immediately and preserves both scores", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByLabelText("Energy 4 out of 10"));
  await fireEvent.press(screen.getByLabelText("Mood 8 out of 10"));
  expect(
    screen.getByLabelText("Wellbeing summary: 6.0 out of 10"),
  ).toBeTruthy();
  expect(latest.checkins).toHaveLength(1);
  expect(latest.checkins[0]).toMatchObject({ energy: 4, mood: 8 });
  expect(screen.getByText("Saved")).toBeTruthy();
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

test("generating refreshes selected calendars and retains manual commitments", async () => {
  const date = localDate(prefs.zone);
  const manual = {
    id: "manual",
    title: "Appointment",
    source: "manual" as const,
    busy: true,
    start: `${date}T14:00:00Z`,
    end: `${date}T15:00:00Z`,
  };
  const google = { ...manual, id: "google", source: "google" as const };
  jest.mocked(syncCalendars).mockResolvedValue([google]);
  await render(
    <Harness
      state={{ ...initial, calendarIds: ["selected"], commitments: [manual] }}
    />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Generate my day" }),
  );
  expect(syncCalendars).toHaveBeenCalledWith(["selected"], date, prefs.zone);
  expect(latest.commitments).toEqual([manual, google]);
  expect(latest.lastSync).toBeTruthy();
});
test("offline generation retains cached availability and reports fallback", async () => {
  jest.mocked(syncCalendars).mockRejectedValue(new Error("Offline"));
  await render(<Harness state={{ ...initial, calendarIds: ["selected"] }} />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Generate my day" }),
  );
  expect(latest.commitments).toEqual(initial.commitments);
  expect(latest.calendarError).toContain("Using saved availability");
  expect(latest.planMeta?.[localDate(prefs.zone)]).toBeDefined();
});
