import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Welcome } from "../components/Welcome";
jest.mock("../components/ui", () => {
  const { Pressable, Text } = require("react-native");
  return {
    useTheme: () => ({
      bg: "white",
      text: "black",
      muted: "gray",
      accent: "purple",
      button: "lavender",
      border: "gray",
    }),
    Button: ({ title, onPress, disabled }: any) => (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});
test("welcome starts without dashboard widgets and tutorial supports back and completion", async () => {
  const finish = jest.fn(async () => {});
  await render(<Welcome onComplete={finish} />);
  expect(screen.getByText("Small steps. Better days.")).toBeTruthy();
  await fireEvent.press(screen.getByText("Get Started"));
  expect(screen.getByText("Start with one goal")).toBeTruthy();
  await fireEvent.press(screen.getByText("Next"));
  expect(screen.getByText("Check in with yourself")).toBeTruthy();
  await fireEvent.press(screen.getByText("Back"));
  expect(screen.getByText("Start with one goal")).toBeTruthy();
  await fireEvent.press(screen.getByText("Next"));
  await fireEvent.press(screen.getByText("Next"));
  await fireEvent.press(screen.getByText("Create my first goal"));
  expect(finish).toHaveBeenCalledTimes(1);
});
test("replay skips welcome and can skip without resetting records", async () => {
  const finish = jest.fn(async () => {});
  await render(<Welcome replay onComplete={finish} />);
  expect(screen.queryByText("Get Started")).toBeNull();
  await fireEvent.press(screen.getByText("Skip tutorial"));
  expect(finish).toHaveBeenCalledTimes(1);
});
test("failed completion stays available for retry", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(
    <Welcome
      replay
      onComplete={async () => {
        throw Error("disk full");
      }}
    />,
  );
  await fireEvent.press(screen.getByText("Skip tutorial"));
  expect(alert).toHaveBeenCalled();
  expect(screen.getByText("Skip tutorial")).toBeTruthy();
  alert.mockRestore();
});
