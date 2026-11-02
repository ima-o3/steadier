import { beforeEach, it, expect, vi } from "vitest";
const native = vi.hoisted(() => ({
  configure: vi.fn(),
  signIn: vi.fn(),
  signInSilently: vi.fn(),
  getTokens: vi.fn(async () => ({ accessToken: "test-token" })),
  clearCachedAccessToken: vi.fn(),
  revokeAccess: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: native,
  isSuccessResponse: (r: { type: string }) => r.type === "success",
}));
import {
  connect,
  listCalendars,
  syncCalendars,
  disconnect,
} from "../integrations/googleCalendar/client";
beforeEach(() => {
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-client";
  vi.stubGlobal("fetch", vi.fn());
  vi.clearAllMocks();
});
it("requests read-only calendar scopes only", async () => {
  native.signIn.mockResolvedValueOnce({ type: "success" });
  await connect();
  const options = native.configure.mock.calls[0]![0] as { scopes: string[] };
  expect(options.scopes).toEqual([
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  ]);
});
it("retries expired access tokens once", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: "cal", summary: "Calendar" }] }),
    } as Response);
  expect(await listCalendars()).toHaveLength(1);
  expect(native.clearCachedAccessToken).toHaveBeenCalledWith("test-token");
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("does not loop on repeated unauthorized responses", async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
  await expect(listCalendars()).rejects.toThrow("401");
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("fails offline without claiming a successful sync", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  await expect(
    syncCalendars(["cal"], "2026-11-02", "Europe/London"),
  ).rejects.toThrow("offline");
});
it("merges selected calendars and expands recurrences using read-only GET requests", async () => {
  const event = {
    id: "event",
    iCalUID: "shared",
    start: { dateTime: "2026-11-02T14:00:00Z" },
    end: { dateTime: "2026-11-02T15:00:00Z" },
  };
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ items: [event] }),
  } as Response);
  expect(
    await syncCalendars(["one", "two"], "2026-11-02", "Europe/London"),
  ).toHaveLength(1);
  expect(fetch).toHaveBeenCalledTimes(2);
  for (const [url, options] of vi.mocked(fetch).mock.calls) {
    expect(String(url)).toContain("singleEvents=true");
    expect(options?.method).toBeUndefined();
  }
});
it("revokes access and signs out on disconnect", async () => {
  await disconnect();
  expect(native.revokeAccess).toHaveBeenCalled();
  expect(native.signOut).toHaveBeenCalled();
});
