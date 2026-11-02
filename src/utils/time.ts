import { Temporal } from "@js-temporal/polyfill";
export const localDate = (zone: string, instant = new Date().toISOString()) =>
  Temporal.Instant.from(instant)
    .toZonedDateTimeISO(zone)
    .toPlainDate()
    .toString();
export function fromLocal(date: string, time: string, zone: string) {
  return new Date(
    Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime(zone, {
      disambiguation: "reject",
    }).epochMilliseconds,
  ).toISOString();
}
export function at(date: string, hour: number, zone: string) {
  const total = Math.round(hour * 60);
  return new Date(
    Temporal.PlainDate.from(date).toZonedDateTime({
      timeZone: zone,
      plainTime: Temporal.PlainTime.from({
        hour: Math.floor(total / 60),
        minute: total % 60,
      }),
    }).epochMilliseconds,
  ).toISOString();
}
export const addMinutes = (instant: string, n: number) =>
  new Date(Date.parse(instant) + n * 60000).toISOString();
export const duration = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 60000;
export const nextDate = (date: string, n: number) =>
  Temporal.PlainDate.from(date).add({ days: n }).toString();
export const clock = (instant: string, zone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
