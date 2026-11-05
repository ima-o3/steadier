import { File } from "expo-file-system";
import React from "react";
import { Alert, Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppState } from "../components/AppState";
import { openStore, defaultState, restoreBackup } from "../database/repositories/store";

jest.mock("../database/repositories/store", () => ({
  defaultState: {},
  openStore: jest.fn(),
  saveState: jest.fn(),
  restoreBackup: jest.fn(),
}));

jest.mock("expo-file-system", () => ({ File: { pickFileAsync: jest.fn() } }));
jest.mock("../database/repositories/backup", () => ({ parseBackup: jest.fn(() => ({goals:[],actions:[],checkins:[]})) }));
const open = jest.mocked(openStore);
afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); jest.restoreAllMocks(); });

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

test("canceling the picker never starts recovery", async () => {
  open.mockRejectedValue(new Error("file is not a database"));
  jest.mocked(File.pickFileAsync).mockResolvedValue({canceled:true,result:null} as never);
  await render(<AppState><Text>Ready</Text></AppState>);
  await fireEvent.press(screen.getByRole("button", {name:"Restore saved backup"}));
  expect(restoreBackup).not.toHaveBeenCalled();
  expect(screen.queryByText("Ready")).toBeNull();
});
test("confirmed recovery enters the app with restored state", async () => {
  open.mockRejectedValue(new Error("file is not a database"));
  jest.mocked(File.pickFileAsync).mockResolvedValue({canceled:false,result:{size:10,text:async()=>"backup"}} as never);
  jest.spyOn(Alert,"alert").mockImplementation((_title,_message,buttons)=>{buttons?.find(b=>b.text==="Restore backup")?.onPress?.();});
  jest.mocked(restoreBackup).mockResolvedValue(defaultState);
  await render(<AppState><Text>Ready</Text></AppState>);
  await fireEvent.press(screen.getByRole("button", {name:"Restore saved backup"}));
  expect(restoreBackup).toHaveBeenCalledWith("backup");
  expect(screen.getByText("Ready")).toBeTruthy();
});
