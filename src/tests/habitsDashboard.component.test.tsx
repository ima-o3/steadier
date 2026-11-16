import React, { useState } from "react";
import { AppState } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Habits from "../../app/habits";
import { useStore } from "../components/AppState";
import { State } from "../types";
import { prefs } from "./fixtures";
import { localDate, nextDate } from "../utils/time";

jest.mock("../components/AppState", () => ({ useStore: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useFocusEffect: (callback: () => void) => {
    require("react").useEffect(callback, [callback]);
    mockFocus = callback;
  },
}));
jest.mock("expo", () => ({
  requireOptionalNativeModule: () => ({
    authorizationStatus: () => mockAuthorization(),
    requestAuthorization: () => mockRequest(),
  }),
  requireNativeView: () =>
    function ExistingReport() {
      require("react").useEffect(() => {
        mockMounts++;
      }, []);
      return require("react").createElement(require("react-native").View, {
        testID: "existing-ios-report",
      });
    },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-habit" }));
const mockAuthorization = jest.fn();
const mockRequest = jest.fn();
let mockMounts = 0;
let mockFocus: () => void;
let changeStore: React.Dispatch<React.SetStateAction<State>>;
let latest: State;
const today = localDate(prefs.zone);
const initial: State = {
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
      id: "walk",
      name: "Walk",
      minutes: 10,
      daysPerWeek: 3,
      minimum: "Step outside",
    },
  ],
  habitLogs: { [nextDate(today, -1)]: ["walk"] },
  onboarded: true,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
function Harness({ state = initial }: { state?: State }) {
  const [current, setCurrent] = useState(state);
  changeStore = setCurrent;
  latest = current;
  jest
    .mocked(useStore)
    .mockReturnValue({ state: current, update: async (fn) => setCurrent(fn) });
  return <Habits />;
}
beforeEach(() => {
  mockAuthorization.mockReset().mockResolvedValue("approved");
  mockRequest.mockReset().mockResolvedValue("approved");
  mockMounts = 0;
});
afterEach(() => jest.restoreAllMocks());

test("existing habit completion and shared check-in updates render without another entry", async () => {
  await render(
    <Harness
      state={{
        ...initial,
        checkins: [{ id: "c", date: today, screenMinutes: 90 }],
      }}
    />,
  );
  expect(screen.getByTestId("existing-ios-report")).toBeTruthy();
  expect(screen.getByText(`90 min · ${today}`)).toBeTruthy();
  expect(screen.getByText(/1 \/ 3 days this week · 33%/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Complete habit: Walk" }),
  );
  expect(screen.getByText(/2 \/ 3 days this week · 67%/)).toBeTruthy();
  expect(latest.checkins[0]?.screenMinutes).toBe(90);
  await act(async () =>
    changeStore((s) => ({
      ...s,
      checkins: [{ id: "c", date: today, screenMinutes: 0 }],
    })),
  );
  expect(screen.getByText(`0 min · ${today}`)).toBeTruthy();
  expect(screen.queryByText(`90 min · ${today}`)).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  await act(async () => changeStore((s) => ({ ...s, checkins: [] })));
  expect(
    screen.getByText("No screen time saved in today’s check-in."),
  ).toBeTruthy();
});

test("never substitutes yesterday's saved value for today's missing observation", async () => {
  await render(
    <Harness
      state={{
        ...initial,
        checkins: [
          { id: "old", date: nextDate(today, -1), screenMinutes: 120 },
        ],
      }}
    />,
  );
  expect(
    screen.getByText("No screen time saved in today’s check-in."),
  ).toBeTruthy();
  expect(screen.queryByText(/120 min/)).toBeNull();
});

test("refresh, returning to dashboard and foregrounding remount the same native report without writing usage", async () => {
  const listen = jest.spyOn(AppState, "addEventListener");
  await render(<Harness />);
  const before = mockMounts;
  await fireEvent.press(
    screen.getByRole("button", { name: "Refresh Screen Time report" }),
  );
  expect(mockMounts).toBeGreaterThan(before);
  const refreshed = mockMounts;
  await act(async () => mockFocus());
  expect(mockMounts).toBeGreaterThan(refreshed);
  const focused = mockMounts;
  const foreground = listen.mock.calls.at(-1)![1];
  await act(async () => foreground("active"));
  expect(mockMounts).toBeGreaterThan(focused);
  expect(latest.checkins).toEqual([]);
});

test("revoked permission hides the report; reconnect reuses authorization without manual input", async () => {
  const listen = jest.spyOn(AppState, "addEventListener");
  await render(<Harness />);
  mockAuthorization.mockResolvedValue("denied");
  await act(async () => listen.mock.calls.at(-1)![1]("active"));
  expect(screen.queryByTestId("existing-ios-report")).toBeNull();
  expect(screen.getByText(/Screen Time access is off/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Connect Screen Time" }),
  );
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("existing-ios-report")).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});
