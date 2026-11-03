import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { AppState } from "../components/AppState";
import { openStore, defaultState } from "../database/repositories/store";

jest.mock("../database/repositories/store", () => ({
  defaultState: {},
  openStore: jest.fn(),
  saveState: jest.fn(),
}));

const open = jest.mocked(openStore);
afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

test("startup displays progress while secure storage opens, then renders the app", async () => {
  let finish!: (value: typeof defaultState) => void;
  open.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render(<AppState><Text>Ready</Text></AppState>);
  expect(screen.getByText("Opening Steadier…")).toBeTruthy();
  await act(async () => { finish(defaultState); });
  expect(screen.getByText("Ready")).toBeTruthy();
});

test("storage failure displays a readable error without entering the app", async () => {
  open.mockRejectedValue(new Error("Keychain unavailable"));
  await render(<AppState><Text>Ready</Text></AppState>);
  expect(screen.getByText("Error: Keychain unavailable")).toBeTruthy();
  expect(screen.queryByText("Ready")).toBeNull();
});

test("a stalled storage operation times out visibly and can recover if it finishes", async () => {
  jest.useFakeTimers();
  let finish!: (value: typeof defaultState) => void;
  open.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render(<AppState><Text>Ready</Text></AppState>);
  await act(async () => { jest.advanceTimersByTime(20000); });
  expect(screen.getByText(/Opening encrypted storage is taking longer/)).toBeTruthy();
  await act(async () => { finish(defaultState); });
  expect(screen.getByText("Ready")).toBeTruthy();
});
