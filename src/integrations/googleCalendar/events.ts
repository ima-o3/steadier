import { Commitment } from "../../types";
import { at } from "../../utils/time";
export interface GoogleEvent {
  id: string;
  iCalUID?: string;
  summary?: string;
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
}
export function normalizeEvents(
  events: GoogleEvent[],
  zone: string,
): Commitment[] {
  const result = new Map<string, Commitment>();
  for (const e of events) {
    if (
      e.status === "cancelled" ||
      e.attendees?.some((a) => a.self && a.responseStatus === "declined")
    )
      continue;
    const allDay = !!e.start?.date;
    const start =
        e.start?.dateTime ||
        (e.start?.date ? at(e.start.date, 0, zone) : undefined),
      end =
        e.end?.dateTime || (e.end?.date ? at(e.end.date, 0, zone) : undefined);
    if (
      !start ||
      !end ||
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end)) ||
      Date.parse(end) <= Date.parse(start)
    )
      continue;
    const utcStart = new Date(start).toISOString(),
      utcEnd = new Date(end).toISOString();
    const key = `${e.iCalUID || e.id}:${utcStart}`;
    const item: Commitment = {
      id: `google-${key}`,
      title: e.summary || "Calendar commitment",
      start: utcStart,
      end: utcEnd,
      busy: e.transparency !== "transparent",
      source: "google",
      allDay,
      localStart: e.start?.date,
      localEnd: e.end?.date,
    };
    const prior = result.get(key);
    result.set(key, prior ? { ...item, busy: prior.busy || item.busy } : item);
  }
  return [...result.values()];
}
export async function collectPages<T>(
  fetchPage: (
    pageToken?: string,
  ) => Promise<{ items?: T[]; nextPageToken?: string }>,
) {
  const items: T[] = [];
  let token: string | undefined;
  const seen = new Set<string>();
  do {
    const page = await fetchPage(token);
    items.push(...(page.items || []));
    token = page.nextPageToken;
    if (token && seen.has(token))
      throw new Error("Calendar pagination repeated a token.");
    if (token) seen.add(token);
  } while (token);
  return items;
}
