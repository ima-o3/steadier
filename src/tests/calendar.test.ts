import { it, expect, vi } from "vitest";
import {
  collectPages,
  GoogleEvent,
  normalizeEvents,
} from "../integrations/googleCalendar/events";
import { at, duration, fromLocal } from "../utils/time";
it("rejects ambiguous or nonexistent manual times at DST transitions", () => {
  expect(() => fromLocal("2026-03-29", "01:30", "Europe/London")).toThrow();
  expect(() => fromLocal("2026-10-25", "01:30", "Europe/London")).toThrow();
  expect(fromLocal("2026-11-02", "10:30", "Europe/London")).toBe(
    "2026-11-02T10:30:00.000Z",
  );
});
import { freeWindows } from "../engines/capacityModel";
import { date, prefs } from "./fixtures";
const event: GoogleEvent = {
  id: "one",
  iCalUID: "same-event",
  start: { dateTime: "2026-11-02T14:00:00+00:00" },
  end: { dateTime: "2026-11-02T15:00:00Z" },
};
it("deduplicates across calendars but keeps recurring instances", () => {
  expect(
    normalizeEvents(
      [
        event,
        { ...event, id: "two" },
        {
          ...event,
          id: "three",
          start: { dateTime: "2026-11-03T14:00:00Z" },
          end: { dateTime: "2026-11-03T15:00:00Z" },
        },
      ],
      prefs.zone,
    ),
  ).toHaveLength(2);
});
it("ignores cancelled and self-declined appointments", () =>
  expect(
    normalizeEvents(
      [
        { ...event, status: "cancelled" },
        { ...event, attendees: [{ self: true, responseStatus: "declined" }] },
      ],
      prefs.zone,
    ),
  ).toEqual([]));
it("transparent events do not block availability", () => {
  const events = normalizeEvents(
    [{ ...event, transparency: "transparent" }],
    prefs.zone,
  );
  expect(events[0]?.busy).toBe(false);
  expect(freeWindows(date, prefs, events)).toEqual(
    freeWindows(date, prefs, []),
  );
});
it("all-day events have explicit default override", () => {
  const events = normalizeEvents(
    [{ id: "all", start: { date }, end: { date: "2026-11-03" } }],
    prefs.zone,
  );
  expect(events[0]?.allDay).toBe(true);
  expect(freeWindows(date, prefs, events)).toEqual(
    freeWindows(date, prefs, []),
  );
  expect(freeWindows(date, { ...prefs, allDayBusy: true }, events)).toEqual([]);
});
it("merges overlapping appointments into free windows", () => {
  const events = normalizeEvents(
    [
      event,
      {
        ...event,
        id: "two",
        iCalUID: "other",
        start: { dateTime: "2026-11-02T14:30:00Z" },
        end: { dateTime: "2026-11-02T16:00:00Z" },
      },
    ],
    prefs.zone,
  );
  expect(
    freeWindows(date, prefs, events).some(
      (w) => w.start === "2026-11-02T16:15:00.000Z",
    ),
  ).toBe(true);
});
it("handles Europe/London spring and autumn DST", () => {
  expect(
    duration(at("2026-03-29", 0, prefs.zone), at("2026-03-30", 0, prefs.zone)),
  ).toBe(23 * 60);
  expect(
    duration(at("2026-10-25", 0, prefs.zone), at("2026-10-26", 0, prefs.zone)),
  ).toBe(25 * 60);
});
it("uses selected timezone for working hours", () =>
  expect(at(date, 9, "America/New_York")).toBe("2026-11-02T14:00:00.000Z"));
it("paginates calendar responses", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ items: [1], nextPageToken: "next" })
    .mockResolvedValueOnce({ items: [2] });
  expect(await collectPages(fetch)).toEqual([1, 2]);
  expect(fetch).toHaveBeenLastCalledWith("next");
});
it("rejects failed sync without returning partial success", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ items: [1], nextPageToken: "next" })
    .mockRejectedValueOnce(new Error("offline"));
  await expect(collectPages(fetch)).rejects.toThrow("offline");
});
it("rejects repeated pagination tokens", async () =>
  await expect(
    collectPages(async () => ({ items: [], nextPageToken: "same" })),
  ).rejects.toThrow("repeated"));
it("rejects malformed event intervals", () =>
  expect(
    normalizeEvents([{ ...event, end: { dateTime: "bad" } }], prefs.zone),
  ).toEqual([]));
