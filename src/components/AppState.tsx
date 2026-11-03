import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
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
  const current = useRef(defaultState),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setError("Opening encrypted storage is taking longer than expected. Close Steadier and reopen it with your iPhone unlocked. Your data has not been deleted.");
    }, 20000);
    openStore()
      .then((s) => {
        if (!active) return;
        clearTimeout(timeout);
        setError("");
        current.current = s;
        setState(s);
      })
      .catch((e) => {
        clearTimeout(timeout);
        if (active) setError(String(e));
      });
    return () => { active = false; clearTimeout(timeout); };
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
  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: "#F4F5EE", padding: 30, paddingTop: 80 }}>
        <Text accessibilityRole="header" style={{ color: "#19382D", fontSize: 24 }}>
          Steadier could not open secure storage
        </Text>
        <Text selectable style={{ color: "#19382D", marginTop: 20 }}>{error}</Text>
        <Text style={{ color: "#19382D", marginTop: 20 }}>
          Please share the error above. Your saved data has not been deleted.
        </Text>
      </View>
    );
  if (!state)
    return (
      <View style={{ flex: 1, backgroundColor: "#F4F5EE", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <ActivityIndicator
        color="#275F47"
        accessibilityLabel="Opening encrypted local data"
      />
      <Text style={{ color: "#19382D", fontSize: 18 }}>Opening Steadier…</Text>
      </View>
    );
  return (
    <Context.Provider value={{ state, update }}>{children}</Context.Provider>
  );
}
export const useStore = () => useContext(Context);
