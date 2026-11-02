import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Heatmap } from "../components/Heatmap";
import { localDate } from "../utils/time";
jest.mock("../components/AppState", () => ({
  useStore: () => ({
    state: {
      preferences: { zone: "Europe/London", appearance: "light" },
      checkins: [
        {
          id: "recorded",
          date:
            require("../utils/time").localDate("Europe/London").slice(0, 7) +
            "-02",
          mood: 8,
          energy: 4,
          notes: "Time outside",
        },
      ],
    },
  }),
}));
test("heatmap exposes original data and neutral missing days accessibly", async () => {
  await render(<Heatmap />);
  const month = localDate("Europe/London").slice(0, 7);
  await fireEvent.press(
    screen.getByLabelText(
      `${month}-02: 6.0 out of 10, self-reported mood and energy`,
    ),
  );
  expect(screen.getByText("Time outside")).toBeTruthy();
  await fireEvent.press(
    screen.getByLabelText(`${month}-01: no wellbeing data`),
  );
  expect(screen.getByText("Missing observations stay missing.")).toBeTruthy();
});
