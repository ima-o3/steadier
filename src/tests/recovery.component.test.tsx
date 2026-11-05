import {
  openStore,
  restoreBackup,
  defaultState,
} from "../database/repositories/store";
import { parseBackup } from "../database/repositories/backup";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

let mockExists = true;
jest.mock("expo-file-system", () => ({
  File: class {
    get exists() {
      return mockExists;
    }
  },
}));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
}));
jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async () => new Uint8Array(32)),
  randomUUID: () => "abc-123",
}));
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
  defaultDatabaseDirectory: "file:///db",
}));
const get = jest.mocked(SecureStore.getItemAsync);
const set = jest.mocked(SecureStore.setItemAsync);
const open = jest.mocked(SQLite.openDatabaseAsync);
const backup = () =>
  JSON.stringify({
    ...defaultState,
    formatVersion: 1,
    exportedAt: "2026-11-05T00:00:00Z",
  });
const connection = () => ({
  execAsync: jest.fn(async () => {}),
  runAsync: jest.fn(async () => ({})),
  closeAsync: jest.fn(async () => {}),
  getFirstAsync: jest.fn(async (sql: string) =>
    sql.includes("cipher_version")
      ? { cipher_version: "4" }
      : sql.includes("integrity")
        ? { integrity_check: "ok" }
        : { user_version: 1 },
  ),
  getAllAsync: jest.fn(async () => []),
});
beforeEach(() => {
  jest.clearAllMocks();
  mockExists = true;
  get.mockResolvedValue(null);
  set.mockResolvedValue();
});
test("existing database with a missing key never creates a replacement key or opens SQLite", async () => {
  await expect(openStore()).rejects.toThrow("encryption key");
  expect(set).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
});
test("fresh installation may generate a key", async () => {
  mockExists = false;
  open.mockResolvedValue(connection() as never);
  await openStore();
  expect(set).toHaveBeenCalledWith(
    "steadier.database.key",
    "0".repeat(64),
    expect.anything(),
  );
});
test("malformed or unsupported backup does not touch storage", async () => {
  for (const input of [
    "not json",
    "{}",
    JSON.stringify({ ...defaultState, formatVersion: 2, exportedAt: "today" }),
    JSON.stringify({
      ...defaultState,
      actions: [{}],
      formatVersion: 1,
      exportedAt: "today",
    }),
  ]) {
    await expect(restoreBackup(input)).rejects.toThrow();
  }
  expect(set).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
});
test("backup validates nested content and preserves meaningful zero values", () => {
  const state = {
    ...defaultState,
    checkins: [{ id: "c", date: "2026-11-05", mood: 0, sleepHours: 0 }],
  };
  expect(
    parseBackup(
      JSON.stringify({ ...state, formatVersion: 1, exportedAt: "today" }),
    ),
  ).toEqual(state);
  expect(() =>
    parseBackup(
      JSON.stringify({
        ...state,
        goals: [{ id: "x" }],
        formatVersion: 1,
        exportedAt: "today",
      }),
    ),
  ).toThrow();
});
test("failed recovery write does not activate the candidate or touch legacy key", async () => {
  get.mockResolvedValue("0".repeat(64));
  const db = connection();
  db.runAsync.mockRejectedValueOnce(new Error("disk full"));
  open.mockResolvedValue(db as never);
  await expect(restoreBackup(backup())).rejects.toThrow("disk full");
  expect(set.mock.calls.map((c) => c[0])).toEqual([
    "steadier.key.steadier-recovery-abc-123.db",
  ]);
  expect(db.closeAsync).toHaveBeenCalled();
});
test("successful recovery reopens before activation and subsequent startup uses the new database", async () => {
  const keys = new Map<string, string>();
  get.mockImplementation(async (k) => keys.get(k) || null);
  set.mockImplementation(async (k, v) => {
    keys.set(k, v);
  });
  open.mockImplementation(async () => connection() as never);
  await restoreBackup(backup());
  expect(open).toHaveBeenCalledTimes(2);
  expect(keys.get("steadier.database.active")).toBe(
    "steadier-recovery-abc-123.db",
  );
  expect(keys.has("steadier.database.key")).toBe(false);
  await openStore();
  expect(open).toHaveBeenLastCalledWith("steadier-recovery-abc-123.db");
});
test("reopen failure leaves active selection unchanged", async () => {
  get.mockResolvedValue("0".repeat(64));
  open
    .mockResolvedValueOnce(connection() as never)
    .mockRejectedValueOnce(new Error("reopen failed"));
  await expect(restoreBackup(backup())).rejects.toThrow("reopen failed");
  expect(set).not.toHaveBeenCalledWith(
    "steadier.database.active",
    expect.anything(),
    expect.anything(),
  );
});
