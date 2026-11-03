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
function Harness({
  fail = false,
  extra = false,
}: {
  fail?: boolean;
  extra?: boolean;
}) {
  const [state, setState] = useState<State>({
    preferences: prefs,
    goals: extra ? [goal, { ...goal, id: "other", name: "Health" }] : [goal],
    actions: [{ ...action, milestoneId: "m" }],
    milestones: [
      { id: "m", goalId: goal.id, name: "First draft", completed: false },
    ],
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
    screen.getByLabelText("Show delete for Updated portfolio"),
  );
  expect(latest.goals).toHaveLength(2);
  await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
  expect(latest.goals).toHaveLength(2);
  await act(async () => {
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((b) => b.text === "Delete")
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

test("goal status buttons move goals between visible sections and restore them", async () => {
  await render(<Harness />);
  await fireEvent.press(screen.getByRole("button", { name: "Complete goal" }));
  expect(screen.queryByText("Portfolio")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Completed (1)" }));
  expect(screen.getByText("Portfolio")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Archive goal" }));
  expect(screen.queryByText("Portfolio")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Archive (1)" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Restore to active" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Active (1)" }));
  expect(screen.getByText("Portfolio")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Pause goal" }));
  expect(screen.getByText("Portfolio")).toBeTruthy();
  expect(latest.goals[0]?.status).toBe("paused");
});

test("Add work opens immediately and saves an action under the chosen goal", async () => {
  await render(<Harness extra />);
  await fireEvent.press(
    screen.getAllByRole("button", { name: "Add work" })[0]!,
  );
  expect(screen.getByLabelText("Action name")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Goal: Portfolio" }).props
      .accessibilityState.selected,
  ).toBe(true);
  await fireEvent.press(screen.getByRole("button", { name: "Goal: Health" }));
  await fireEvent.changeText(
    screen.getByLabelText("Action name"),
    "Walk outside",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save action" }));
  expect(latest.actions.find((a) => a.title === "Walk outside")?.goalId).toBe(
    "other",
  );
  expect(screen.queryByLabelText("Action name")).toBeNull();
});

test("milestones can be edited and moved without moving their actions, then deleted", async () => {
  const alert = jest.spyOn(Alert, "alert");
  await render(<Harness extra />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Edit milestone: First draft" }),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Milestone name"),
    "Final draft",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Goal: Health" }));
  await fireEvent.press(screen.getByRole("button", { name: "Save milestone" }));
  expect(latest.milestones[0]).toMatchObject({
    name: "Final draft",
    goalId: "other",
  });
  expect(latest.actions[0]?.goalId).toBe(goal.id);
  expect(latest.actions[0]?.milestoneId).toBeUndefined();
  await fireEvent.press(
    screen.getByRole("button", { name: "Delete milestone: Final draft" }),
  );
  await act(async () => {
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((b) => b.text === "Delete")
      ?.onPress?.();
  });
  expect(latest.milestones).toHaveLength(0);
  expect(latest.actions).toHaveLength(1);
});

test("action editing can change its goal and deletion requires confirmation", async () => {
  const alert = jest.spyOn(Alert, "alert");
  await render(<Harness extra />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Edit action: Build prototype" }),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Action name"),
    "Updated action",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Goal: Health" }));
  await fireEvent.press(screen.getByRole("button", { name: "Save action" }));
  expect(latest.actions[0]).toMatchObject({
    title: "Updated action",
    goalId: "other",
  });
  expect(latest.actions[0]?.milestoneId).toBeUndefined();
  await fireEvent.press(
    screen.getByRole("button", { name: "Delete action: Updated action" }),
  );
  expect(latest.actions).toHaveLength(1);
  await act(async () => {
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((b) => b.text === "Delete")
      ?.onPress?.();
  });
  expect(latest.actions).toHaveLength(0);
});

test("failed work saves retain the selected goal and draft", async () => {
  jest.spyOn(Alert, "alert");
  await render(<Harness fail extra />);
  await fireEvent.press(
    screen.getAllByRole("button", { name: "Add milestone" })[0]!,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Goal: Health" }));
  await fireEvent.changeText(
    screen.getByLabelText("Milestone name"),
    "Keep this milestone",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save milestone" }));
  expect(screen.getByLabelText("Milestone name").props.value).toBe(
    "Keep this milestone",
  );
  expect(
    screen.getByRole("button", { name: "Goal: Health" }).props
      .accessibilityState.selected,
  ).toBe(true);
  expect(latest.milestones).toHaveLength(1);
});

test("new milestones use the selected goal and keep existing actions unchanged", async () => {
  await render(<Harness extra />);
  await fireEvent.press(
    screen.getAllByRole("button", { name: "Add milestone" })[0]!,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Goal: Health" }));
  await fireEvent.changeText(
    screen.getByLabelText("Milestone name"),
    "Walk regularly",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save milestone" }));
  expect(
    latest.milestones.find((m) => m.name === "Walk regularly"),
  ).toMatchObject({ goalId: "other", completed: false });
  expect(latest.actions[0]?.milestoneId).toBe("m");
  expect(screen.queryByLabelText("Milestone name")).toBeNull();
});
