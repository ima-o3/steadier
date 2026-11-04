import React, { useState } from "react";
import { Alert, PanResponder } from "react-native";
import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { Routines } from "../components/Routines";
import { CapacityHours } from "../components/CapacityHours";
import { useStore } from "../components/AppState";
import { State } from "../types";
import { prefs } from "./fixtures";
jest.mock("../components/AppState", () => ({ useStore: jest.fn() }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-routine" }));
jest.setTimeout(20000);
let latest: State;
function Harness({ fail = false }: { fail?: boolean }) {
  const [state, setState] = useState<State>({
    preferences: prefs,
    goals: [],
    actions: [],
    milestones: [],
    checkins: [],
    commitments: [],
    plans: {},
    excludedActions: {},
    habits: [
      {
        id: "h",
        name: "Walk",
        minutes: 15,
        daysPerWeek: 3,
        minimum: "Step outside",
      },
    ],
    habitLogs: {},
    onboarded: true,
    demo: false,
    calendarIds: [],
    feedback: {},
    revisions: [],
  });
  latest = state;
  jest.mocked(useStore).mockReturnValue({
    state,
    update: async (fn) => {
      if (fail) throw Error("Storage unavailable");
      setState(fn);
    },
  });
  return (
    <>
      <Routines />
      <CapacityHours />
    </>
  );
}
afterEach(() => jest.restoreAllMocks());
test("horizontal swipe reveals deletion without deleting; vertical scroll does not claim the gesture", async () => {
  const create = jest.spyOn(PanResponder, "create");
  await render(<Harness />);
  const handlers = create.mock.calls[0]![0];
  const event = {} as Parameters<
    NonNullable<typeof handlers.onPanResponderRelease>
  >[0];
  const gesture = (dx: number, dy: number) =>
    ({ dx, dy }) as Parameters<
      NonNullable<typeof handlers.onPanResponderRelease>
    >[1];
  expect(handlers.onMoveShouldSetPanResponder?.(event, gesture(5, 50))).toBe(
    false,
  );
  expect(handlers.onMoveShouldSetPanResponder?.(event, gesture(-70, 3))).toBe(
    true,
  );
  expect(screen.queryByRole("button", { name: "Delete Walk" })).toBeNull();
  await act(async () =>
    handlers.onPanResponderRelease?.(event, gesture(-70, 3)),
  );
  expect(screen.getByRole("button", { name: "Delete Walk" })).toBeTruthy();
  expect(latest.habits).toHaveLength(1);
  await act(async () =>
    handlers.onPanResponderRelease?.(event, gesture(80, 0)),
  );
  expect(screen.queryByRole("button", { name: "Delete Walk" })).toBeNull();
});
test("routine editing preserves identity and checkmarks; cancellation preserves saved values", async () => {
  await render(<Harness />);
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Complete routine: Walk" }),
  );
  const logs = latest.habitLogs;
  await fireEvent.press(
    screen.getByRole("button", { name: "Edit routine: Walk" }),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Routine name"),
    "Morning walk",
  );
  await fireEvent.changeText(screen.getByLabelText("Duration minutes"), "20");
  await fireEvent.changeText(screen.getByLabelText("Days per week"), "4");
  await fireEvent.press(screen.getByRole("button", { name: "Save routine" }));
  expect(latest.habits[0]).toMatchObject({
    id: "h",
    name: "Morning walk",
    minutes: 20,
    daysPerWeek: 4,
  });
  expect(latest.habitLogs).toEqual(logs);
  await fireEvent.press(
    screen.getByRole("button", { name: "Edit routine: Morning walk" }),
  );
  await fireEvent.changeText(screen.getByLabelText("Routine name"), "Unsaved");
  await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
  expect(latest.habits[0]?.name).toBe("Morning walk");
});
test("routine deletion requires a revealed action and confirmation", async () => {
  const alert = jest.spyOn(Alert, "alert");
  await render(<Harness />);
  await fireEvent.press(screen.getByLabelText("Show delete for Walk"));
  expect(latest.habits).toHaveLength(1);
  await fireEvent.press(screen.getByRole("button", { name: "Delete Walk" }));
  expect(latest.habits).toHaveLength(1);
  await act(async () => {
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((b) => b.text === "Delete")
      ?.onPress?.();
  });
  expect(latest.habits).toHaveLength(0);
});
test("capacity editing validates, cancels and saves only weekly hours", async () => {
  jest.spyOn(Alert, "alert");
  await render(<Harness />);
  await fireEvent.press(screen.getByText("Edit discretionary hours"));
  await fireEvent.changeText(
    screen.getByLabelText("Weekly discretionary hours"),
    "200",
  );
  await fireEvent.press(screen.getByText("Save hours"));
  expect(latest.preferences).toEqual(prefs);
  await fireEvent.changeText(
    screen.getByLabelText("Weekly discretionary hours"),
    "12",
  );
  await fireEvent.press(screen.getByText("Cancel hours edit"));
  expect(latest.preferences).toEqual(prefs);
  await fireEvent.press(screen.getByText("Edit discretionary hours"));
  await fireEvent.changeText(
    screen.getByLabelText("Weekly discretionary hours"),
    "10",
  );
  await fireEvent.press(screen.getByText("Save hours"));
  expect(latest.preferences).toEqual({ ...prefs, weeklyMinutes: 600 });
});
test("routine and capacity failed saves retain drafts", async () => {
  jest.spyOn(Alert, "alert");
  await render(<Harness fail />);
  await fireEvent.press(screen.getByText("Add routine"));
  await fireEvent.changeText(screen.getByLabelText("Routine name"), "Read");
  await fireEvent.press(screen.getByText("Save routine"));
  expect(screen.getByLabelText("Routine name").props.value).toBe("Read");
  expect(latest.habits).toHaveLength(1);
  await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
  await fireEvent.press(screen.getByText("Edit discretionary hours"));
  await fireEvent.changeText(
    screen.getByLabelText("Weekly discretionary hours"),
    "12",
  );
  await fireEvent.press(screen.getByText("Save hours"));
  expect(screen.getByLabelText("Weekly discretionary hours").props.value).toBe(
    "12",
  );
});
