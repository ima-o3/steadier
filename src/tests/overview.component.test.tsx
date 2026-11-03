import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { TodayOverview } from "../components/TodayOverview";
import { localDate, nextDate } from "../utils/time";
jest.mock("../components/AppState", () => ({
  useStore: () => ({
    state: {
      preferences: { zone: "Europe/London", appearance: "light" },
      checkins: [
        {
          id: "yesterday",
          date: require("../utils/time").nextDate(
            require("../utils/time").localDate("Europe/London"),
            -1,
          ),
          mood: 7,
          energy: 3,
          sleepHours: 0,
        },
      ],
    },
  }),
}));
test("week selection shows the selected day's real values and preserves missing observations", async () => {
  await render(<TodayOverview />);
  expect(screen.getByLabelText("Mood summary: not recorded")).toBeTruthy();
  expect(screen.getByLabelText("Wellbeing summary: not recorded")).toBeTruthy();
  await fireEvent.press(screen.getByText("Recent check-ins"));
  await fireEvent.press(
    screen.getByLabelText(
      `${nextDate(localDate("Europe/London"), -1)}, check-in recorded`,
    ),
  );
  expect(screen.getByLabelText("Mood summary: 7 / 10")).toBeTruthy();
  expect(screen.getByLabelText("Energy summary: 3 / 10")).toBeTruthy();
  expect(screen.getByLabelText("Sleep summary: 0 hours")).toBeTruthy();
  expect(
    screen.getByLabelText("Wellbeing summary: 5.0 out of 10"),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByLabelText(
      `${localDate("Europe/London")}, no mood or energy recorded`,
    ),
  );
  expect(screen.getByLabelText("Sleep summary: not recorded")).toBeTruthy();
});
