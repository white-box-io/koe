import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import * as bridge from "../lib/bridge";
import { setLevels } from "../lib/levels";
import { playBlip } from "../lib/sounds";
import type { PanelName, Settings, SettingsTab } from "../lib/types";
import { initialState, reducer, type Action, type KoeState } from "./reducer";

type KoeContextValue = {
  state: KoeState;
  dispatch: (action: Action) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  open: (panel: PanelName | null, tab?: SettingsTab) => void;
};

const KoeContext = createContext<KoeContextValue | null>(null);

export function useKoe() {
  const value = useContext(KoeContext);
  if (!value) throw new Error("useKoe must be used inside KoeProvider");
  return value;
}

export function KoeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    bridge.getSettings().then((settings) => dispatch({ type: "settings", settings }));
  }, []);

  useEffect(() => {
    const stopEngine = bridge.onEngineEvent((event) => {
      if (event.event === "level") {
        setLevels(event.mic as number, event.voice as number);
        return;
      }
      if (event.event === "ready") {
        bridge.sendToEngine("list_voices");
        bridge.sendToEngine("list_devices");
      }
      dispatch({ type: "engine", event });
    });
    const stopClaude = bridge.onClaudeEvent((event) => dispatch({ type: "claude", event }));
    return () => {
      stopEngine.then((unlisten) => unlisten());
      stopClaude.then((unlisten) => unlisten());
    };
  }, []);

  useSoundEffects(state);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      if (!state.settings) return;
      const settings = { ...state.settings, ...patch };
      dispatch({ type: "settings", settings });
      bridge.saveSettings(settings);
    },
    [state.settings],
  );

  const open = useCallback((panel: PanelName | null, tab?: SettingsTab) => dispatch({ type: "open", panel, tab }), []);

  const value = useMemo(() => ({ state, dispatch, updateSettings, open }), [state, updateSettings, open]);
  return <KoeContext.Provider value={value}>{children}</KoeContext.Provider>;
}

function useSoundEffects(state: KoeState) {
  const enabled = state.settings?.soundEffects ?? false;
  useEffect(() => {
    if (enabled && state.recording) playBlip("recordStart");
  }, [enabled, state.recording]);
  useEffect(() => {
    if (enabled && state.doneAt) playBlip("done");
  }, [enabled, state.doneAt]);
  useEffect(() => {
    if (enabled && state.errors.length) playBlip("error");
  }, [enabled, state.errors.length]);
}
