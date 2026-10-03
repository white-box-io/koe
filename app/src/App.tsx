import { useCallback, useEffect } from "react";
import { Widget } from "./components/widget/Widget";
import { useNow } from "./hooks/useNow";
import { usePopups, type Popup } from "./hooks/usePopups";
import { useWindowLayout } from "./hooks/useWindowLayout";
import { onPointerOutside } from "./lib/bridge";
import type { PanelName } from "./lib/types";
import { ActivityPanel, TaskSummary } from "./panels/activity/ActivityPanel";
import { ErrorPanel } from "./panels/errors/ErrorPanel";
import { ContextMenu } from "./panels/menu/ContextMenu";
import { SessionsPanel } from "./panels/sessions/SessionsPanel";
import { SettingsPanel } from "./panels/settings/SettingsPanel";
import { SetupPanel } from "./panels/setup/SetupPanel";
import { SubtitlesPanel } from "./panels/subtitles/SubtitlesPanel";
import { useKoe } from "./state/KoeProvider";
import { currentMode } from "./state/mode";

const OPENED_PANELS: Record<PanelName, () => React.ReactNode> = {
  activity: () => <ActivityPanel />,
  settings: () => <SettingsPanel />,
  menu: () => <ContextMenu />,
  sessions: () => <SessionsPanel />,
};

export default function App() {
  const { state, open, updateSettings } = useKoe();
  const now = useNow();
  const mode = currentMode(state, now);
  const { popup, fading, setHolding } = usePopups(state, now);

  const savePosition = useCallback((position: [number, number]) => updateSettings({ position }), [updateSettings]);
  const layout = useWindowLayout({ savedPosition: state.settings?.position, onPositionSaved: savePosition });

  useCloseOnOutsideClickAndEscape(state.panel !== null, () => open(null));

  const startDrag = () => {
    open(null);
    layout.startDrag();
  };

  return (
    <div ref={layout.stage} className={`stage ${layout.opensUp ? "stage--up" : ""} ${layout.opensLeft ? "stage--right" : "stage--left"}`}>
      <div ref={layout.widget}>
        <Widget mode={mode} now={now} onDragStart={startDrag} />
      </div>
      {state.panel ? (
        OPENED_PANELS[state.panel]()
      ) : (
        <div onMouseEnter={() => setHolding(true)} onMouseLeave={() => setHolding(false)}>
          <PopupView popup={popup} fading={fading} />
        </div>
      )}
    </div>
  );
}

function PopupView({ popup, fading }: { popup: Popup; fading: boolean }) {
  const { state } = useKoe();
  if (!popup) return null;
  switch (popup.kind) {
    case "setup":
      return <SetupPanel />;
    case "error":
      return <ErrorPanel error={popup.error} />;
    case "done":
      return state.task ? <TaskSummary task={state.task} /> : null;
    case "subtitles":
      return <SubtitlesPanel fading={fading} />;
  }
}

function useCloseOnOutsideClickAndEscape(isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const stopListening = onPointerOutside(close);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopListening.then((unlisten) => unlisten());
    };
  }, [isOpen, close]);
}
