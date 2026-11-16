import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { DeadlinePicker, dateValue } from "../components/DeadlinePicker";
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = require("react-native");
  return (props: any) => <View testID="native-date" {...props} />;
});
jest.mock("../components/AppState", () => ({
  useStore: () => ({ state: { preferences: { appearance: "light" } } }),
}));
test("native selection stores calendar date, cancellation leaves it unchanged, deadline clears", async () => {
  const change = jest.fn();
  await render(<DeadlinePicker value="2026-12-20" onChange={change} />);
  await fireEvent.press(
    screen.getByText(new Date("2026-12-20T12:00:00").toLocaleDateString()),
  );
  await fireEvent(
    screen.getByTestId("native-date"),
    "onChange",
    {},
    new Date(2027, 0, 4, 12),
  );
  await fireEvent.press(screen.getByText("Use this date"));
  expect(change).toHaveBeenCalledWith("2027-01-04");
  expect(dateValue(new Date(2026, 10, 12, 0))).toBe("2026-11-12");
  await fireEvent.press(screen.getByText("Clear deadline"));
  expect(change).toHaveBeenLastCalledWith("");
});
