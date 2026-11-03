import React, { useState } from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Goals from "../../app/goals";
import { useStore } from "../components/AppState";
import { State } from "../types";
import { prefs, goal, action } from "./fixtures";
jest.setTimeout(20000);
jest.mock("../components/AppState", () => ({ useStore: jest.fn() }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-goal" }));
let latest: State;
function Harness({ fail = false }: { fail?: boolean }) {
  const [state, setState] = useState<State>({
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
  });
  latest = state;
  jest.mocked(useStore).mockReturnValue({
    state,
    update: async (fn) => {
      if (fail) throw new Error("Storage unavailable");
      setState(fn);
    },
  });
  return <Goals />;
}
afterEach(() => jest.restoreAllMocks());
test("visible goal controls add, edit and remove a goal with confirmation", async () => {
  const alert = jest.spyOn(Alert, "alert");
  await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Edit goal" }));
  expect(screen.getByLabelText("Name").props.value).toBe("Portfolio");
  await fireEvent.changeText(
    screen.getByLabelText("Name"),
    "Updated portfolio",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save goal" }));
  expect(latest.goals[0]!.name).toBe("Updated portfolio");
  await fireEvent.press(screen.getByRole("button", { name: "Add goal" }));
  expect(screen.getByLabelText("Name").props.value).toBe("");
  await fireEvent.changeText(screen.getByLabelText("Name"), "Read more");
  await fireEvent.press(screen.getByRole("button", { name: "Save goal" }));
  expect(latest.goals).toHaveLength(2);
  expect(latest.goals.find((g) => g.id === "new-goal")?.category).toBe(
    "Personal",
  );
  await fireEvent.press(
    screen.getAllByRole("button", { name: "Remove goal" })[0]!,
  );
  expect(latest.goals).toHaveLength(2);
  await act(async () => {
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((b) => b.text === "Remove goal")
      ?.onPress?.();
  });
  expect(latest.goals.map((g) => g.name)).toEqual(["Read more"]);
  expect(latest.actions).toHaveLength(0);
});
test("failed saves keep the goal form and entered name available", async () => {
  jest.spyOn(Alert, "alert");
  await render(<Harness fail />);
  await fireEvent.press(screen.getByRole("button", { name: "Add goal" }));
  await fireEvent.changeText(screen.getByLabelText("Name"), "Keep this draft");
  await fireEvent.press(screen.getByRole("button", { name: "Save goal" }));
  expect(screen.getByLabelText("Name").props.value).toBe("Keep this draft");
  expect(latest.goals).toHaveLength(1);
  expect(Alert.alert).toHaveBeenCalledWith("Goal", "Storage unavailable");
});
