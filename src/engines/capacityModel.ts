import { Commitment, Preferences } from "../types";
import { at, addMinutes, duration } from "../utils/time";
export interface Window {
  start: string;
  end: string;
}
export function freeWindows(
  date: string,
  p: Preferences,
  commitments: Commitment[],
): Window[] {
  const start = at(date, p.startHour, p.zone),
    end = at(date, p.endHour, p.zone);
  const blocks = [
    ...commitments
      .filter((c) => c.busy && (!c.allDay || p.allDayBusy))
      .map((c) => ({
        start: addMinutes(c.start, -p.buffer),
        end: addMinutes(c.end, p.buffer),
      })),
    { start: at(date, p.restStart, p.zone), end: at(date, p.restEnd, p.zone) },
  ]
    .filter((c) => c.start < end && c.end > start)
    .sort((a, b) => a.start.localeCompare(b.start));
  let cursor = start;
  const windows: Window[] = [];
  for (const b of blocks) {
    if (b.start > cursor)
      windows.push({ start: cursor, end: b.start < end ? b.start : end });
    if (b.end > cursor) cursor = b.end;
    if (cursor >= end) break;
  }
  if (cursor < end) windows.push({ start: cursor, end });
  return windows;
}
export const freeMinutes = (windows: Window[]) =>
  windows.reduce((n, w) => n + duration(w.start, w.end), 0);
