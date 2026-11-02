import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { collectPages, GoogleEvent, normalizeEvents } from "./events";
import { at, nextDate } from "../../utils/time";
const scopes = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];
let configured = false;
function configure() {
  if (configured) return;
  if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
    throw new Error(
      "Configure the Google iOS OAuth client and URL scheme, then rebuild the app.",
    );
  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes,
  });
  configured = true;
}
// Native Google SDK owns credentials in Keychain. Tokens are held in memory only.
export async function connect() {
  configure();
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result))
    throw new Error("Google connection was cancelled.");
}
async function get<T>(path: string, retry = true): Promise<T> {
  configure();
  await GoogleSignin.signInSilently();
  const { accessToken } = await GoogleSignin.getTokens();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/${path}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (response.status === 401 && retry) {
    await GoogleSignin.clearCachedAccessToken(accessToken);
    return get(path, false);
  }
  if (!response.ok)
    throw new Error(
      `Calendar sync failed (${response.status}). Cached availability may be incomplete.`,
    );
  return response.json() as Promise<T>;
}
export interface CalendarEntry {
  id: string;
  summary: string;
}
export const listCalendars = () =>
  collectPages<CalendarEntry>((token) =>
    get(
      `users/me/calendarList?maxResults=100${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`,
    ),
  );
export async function syncCalendars(ids: string[], date: string, zone: string) {
  const events: GoogleEvent[] = [];
  for (const id of ids) {
    const params = new URLSearchParams({
      timeMin: at(date, 0, zone),
      timeMax: at(nextDate(date, 91), 0, zone),
      singleEvents: "true",
      showDeleted: "false",
      maxResults: "2500",
      timeZone: zone,
    });
    events.push(
      ...(await collectPages<GoogleEvent>((token) =>
        get(
          `calendars/${encodeURIComponent(id)}/events?${params}${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`,
        ),
      )),
    );
  }
  return normalizeEvents(events, zone);
}
export async function disconnect() {
  configure();
  await GoogleSignin.revokeAccess();
  await GoogleSignin.signOut();
}
