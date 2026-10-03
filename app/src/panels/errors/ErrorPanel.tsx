import { AlertTriangle, Cpu, MicOff, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../components/ui/controls";
import { Panel } from "../../components/panel/Panel";
import { openSoundSettings, restartEngine, sendToEngine } from "../../lib/bridge";
import type { KoeError } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";
import "./errors.css";

type ErrorCopy = { icon: ReactNode; tone: string; title: string; body: (error: KoeError) => string };

const COPY: Record<KoeError["kind"], ErrorCopy> = {
  no_session: {
    icon: <Terminal size={15} />,
    tone: "amber",
    title: "Can't find Claude Code",
    body: () => "Open Claude Code in a terminal or VS Code. Koe connects on its own as soon as a session starts.",
  },
  gpu_fallback: {
    icon: <Cpu size={15} />,
    tone: "amber",
    title: "Using the CPU instead",
    body: () => "Your GPU couldn't be used, so the voice will be slower. Updating the NVIDIA driver usually fixes it.",
  },
  download_failed: {
    icon: <AlertTriangle size={15} />,
    tone: "red",
    title: "Download failed",
    body: (error) => `The ${error.model ?? "voice"} model stopped downloading. It will resume where it left off.`,
  },
  mic_missing: {
    icon: <MicOff size={15} />,
    tone: "red",
    title: "No microphone",
    body: () => "Plug one in, or check that Windows lets apps use the microphone.",
  },
  engine_crashed: {
    icon: <AlertTriangle size={15} />,
    tone: "red",
    title: "Voice engine stopped",
    body: (error) => error.message || "Restart Koe to try again.",
  },
};

export function ErrorPanel({ error }: { error: KoeError }) {
  const { dispatch, open, updateSettings } = useKoe();
  const copy = COPY[error.kind];
  const dismiss = () => dispatch({ type: "dismissError", kind: error.kind });

  const actions: Record<KoeError["kind"], ReactNode> = {
    no_session: (
      <>
        <Button onClick={() => open("sessions")}>Pick session</Button>
        <Button kind="secondary" onClick={dismiss}>Dismiss</Button>
      </>
    ),
    gpu_fallback: (
      <>
        <Button onClick={() => { updateSettings({ device: "auto" }); dismiss(); }}>Try GPU again</Button>
        <Button kind="secondary" onClick={() => { updateSettings({ device: "cpu" }); dismiss(); }}>Keep CPU</Button>
      </>
    ),
    download_failed: (
      <>
        <Button onClick={() => { dismiss(); restartEngine(); }}>Retry</Button>
        <Button kind="secondary" onClick={dismiss}>Cancel</Button>
      </>
    ),
    mic_missing: (
      <>
        <Button onClick={() => openSoundSettings()}>Open sound settings</Button>
        <Button kind="secondary" onClick={() => sendToEngine("retry_mic")}>Retry</Button>
      </>
    ),
    engine_crashed: (
      <>
        <Button onClick={() => { dismiss(); restartEngine(); }}>Restart voice</Button>
        <Button kind="secondary" onClick={dismiss}>Dismiss</Button>
      </>
    ),
  };

  return (
    <Panel width={300}>
      <div className="error">
        <span className={`error__badge error__badge--${copy.tone}`}>{copy.icon}</span>
        <div className="error__text">
          <span className="error__title">{copy.title}</span>
          <span className="error__body">{copy.body(error)}</span>
        </div>
      </div>
      <div className="error__actions">{actions[error.kind]}</div>
    </Panel>
  );
}
