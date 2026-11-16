import React, { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import { requireOptionalNativeModule, requireNativeView } from "expo";
import { Button, Card, Copy, Heading } from "./ui";
type ScreenTimeModule = {
  authorizationStatus(): Promise<string>;
  requestAuthorization(): Promise<string>;
};
const native =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<ScreenTimeModule>("SteadierScreenTime")
    : null;
const Report = native ? requireNativeView("SteadierScreenTime") : null;
export function ScreenTime({ refreshable = false }: { refreshable?: boolean }) {
  const [reportKey, setReportKey] = useState(0);
  const [status, setStatus] = useState("loading"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const refresh = () => {
    if (!native) {
      setStatus("unavailable");
      return;
    }
    native
      .authorizationStatus()
      .then(setStatus)
      .catch(() => setError("Screen Time authorization could not be checked."));
  };
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        setReportKey((k) => k + 1);
        refresh();
      }
    });
    return () => sub.remove();
  }, []);
  async function connect() {
    if (!native || busy) return;
    setBusy(true);
    setError("");
    try {
      setStatus(await native.requestAuthorization());
    } catch {
      setError(
        "Screen Time access was not granted. You can keep entering minutes manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Heading>Screen Time</Heading>
      <Copy small>
        Your iPhone’s usage report stays on this device. Manual screen minutes
        are separate and remain available for your steadiness score.
      </Copy>
      {status === "approved" && Report ? (
        <View style={{ height: 190 }}>
          <Report key={reportKey} style={{ flex: 1 }} />
        </View>
      ) : (
        <Copy small>
          {status === "unavailable"
            ? "Automatic Screen Time needs a supported iPhone build."
            : status === "denied"
              ? "Screen Time access is off. You can review Steadier’s access in iPhone Settings."
              : "Allow access to display today’s actual iPhone Screen Time."}
        </Copy>
      )}
      {native && status !== "approved" && (
        <Button
          title={busy ? "Requesting access…" : "Connect Screen Time"}
          disabled={busy}
          onPress={() => void connect()}
        />
      )}
      {refreshable && native && status === "approved" && (
        <Button
          title="Refresh Screen Time report"
          onPress={() => {
            setReportKey((k) => k + 1);
            refresh();
          }}
        />
      )}
      {!!error && <Copy small>{error}</Copy>}
      <Copy small>
        Reports may be delayed. No report does not mean zero usage.
      </Copy>
    </Card>
  );
}
