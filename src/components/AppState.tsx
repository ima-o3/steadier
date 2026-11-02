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
    openStore()
      .then((s) => {
        current.current = s;
        setState(s);
      })
      .catch((e) => setError(String(e)));
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
      <View style={{ padding: 30, marginTop: 60 }}>
        <Text accessibilityRole="header">
          Steadier could not open secure storage
        </Text>
        <Text>{error}</Text>
        <Text>
          Use an EAS native development build with SQLCipher. Restart after
          correcting the build configuration.
        </Text>
      </View>
    );
  if (!state)
    return (
      <ActivityIndicator
        accessibilityLabel="Opening encrypted local data"
        style={{ marginTop: 100 }}
      />
    );
  return (
    <Context.Provider value={{ state, update }}>{children}</Context.Provider>
  );
}
export const useStore = () => useContext(Context);
