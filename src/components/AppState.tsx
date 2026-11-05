import { File } from "expo-file-system";
import { parseBackup } from "../database/repositories/backup";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Alert,
  Text,
  View,
  AppState as NativeAppState,
} from "react-native";
import { State } from "../types";
import {
  defaultState,
  openStore,
  saveState,
  restoreBackup,
} from "../database/repositories/store";
interface Store {
  state: State;
  update: (fn: (state: State) => State) => Promise<void>;
}
const Context = createContext<Store>({
  state: defaultState,
  update: async () => {},
});
export function AppState({ children }: { children: React.ReactNode }) {
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const tick = () => setClockTick((value) => value + 1);
    const timer = setInterval(tick, 60000);
    const subscription = NativeAppState.addEventListener("change", (status) => {
      if (status === "active") tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const [state, setState] = useState<State>(),
    [error, setError] = useState("");
  const [opening, setOpening] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const recoveryBusy = useRef(false);
  const current = useRef(defaultState),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active)
        setError(
          "Opening encrypted storage is taking longer than expected. Close Steadier and reopen it with your iPhone unlocked. Your data has not been deleted.",
        );
    }, 20000);
    openStore()
      .then((s) => {
        if (!active) return;
        clearTimeout(timeout);
        setError("");
        current.current = s;
        setState(s);
        setOpening(false);
      })
      .catch((e) => {
        clearTimeout(timeout);
        if (active) {
          setError(String(e));
          setOpening(false);
        }
      });
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);
  const update = (fn: (s: State) => State) => {
    const next = queue.current.then(async () => {
      const value = fn(current.current);
      await saveState(value);
      current.current = value;
      setState(value);
    });
    queue.current = next.catch((e) => {
      Alert.alert(
        "Could not save",
        `${String(e)} Your previous saved data is intact.`,
      );
    });
    return next;
  };
  async function chooseBackup() {
    if (opening || recoveryBusy.current) return;
    recoveryBusy.current = true;
    setRestoring(true);
    try {
      const picked = await File.pickFileAsync({
        mimeTypes: ["application/json"],
      });
      if (picked.canceled) return;
      if (picked.result.size > 20 * 1024 * 1024)
        throw new Error("Backup is too large (maximum 20 MB).");
      const text = await picked.result.text();
      const backup = parseBackup(text);
      const confirmed = await new Promise<boolean>((resolve) =>
        Alert.alert(
          "Restore saved backup?",
          `${backup.goals.length} goals, ${backup.actions.length} actions and ${backup.checkins.length} check-ins. This restores the data as it was when exported. Your existing database and original export will be kept.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Restore backup", onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        ),
      );
      if (!confirmed) return;
      const restored = await restoreBackup(text);
      current.current = restored;
      setState(restored);
      setError("");
    } catch {
      Alert.alert(
        "Restore did not finish",
        "The file may be incomplete or storage may be unavailable. Your original database and export have been kept. Please keep both and contact support.",
      );
    } finally {
      recoveryBusy.current = false;
      setRestoring(false);
    }
  }
  if (error)
    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#F7F5F2",
          padding: 30,
          paddingTop: 80,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: "#34302D", fontSize: 24 }}
        >
          Steadier could not open secure storage
        </Text>
        <Text selectable style={{ color: "#34302D", marginTop: 20 }}>
          {error}
        </Text>
        <Text style={{ color: "#34302D", marginTop: 20 }}>
          Your existing database has been kept. You can restore a Steadier JSON
          export saved in Files into a separate encrypted database.
        </Text>
        <Button
          title={restoring ? "Restoring�" : "Restore saved backup"}
          disabled={opening || restoring}
          onPress={() => void chooseBackup()}
        />
      </ScrollView>
    );
  if (!state)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F7F5F2",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <ActivityIndicator
          color="#75434E"
          accessibilityLabel="Opening encrypted local data"
        />
        <Text style={{ color: "#34302D", fontSize: 18 }}>
          Opening Steadier…
        </Text>
      </View>
    );
  return (
    <Context.Provider value={{ state, update }}>{children}</Context.Provider>
  );
}
export const useStore = () => useContext(Context);
