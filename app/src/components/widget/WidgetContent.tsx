import { Check, FilePlus, Eye, Pencil } from "lucide-react";
import type { Mode } from "../../lib/types";
import { blockingError } from "../../state/mode";
import { useKoe } from "../../state/KoeProvider";
import { fileName } from "../../state/task";
import { ThinkingDots } from "./ThinkingDots";
import { WaveBars } from "./WaveBars";

const ERROR_LABELS: Record<string, string> = {
  mic_missing: "Mic not found",
  download_failed: "Download failed",
  engine_crashed: "Voice engine stopped",
};

const FILE_ICONS = { read: Eye, edit: Pencil, write: Pencil, new: FilePlus };

function formatTimer(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WidgetContent({ mode, now }: { mode: Mode; now: number }) {
  const { state } = useKoe();

  switch (mode) {
    case "loading":
      return (
        <div className="widget__progress">
          <span className="widget__label widget__label--muted">Waking up… {Math.round(state.progress * 100)}%</span>
          <span className="widget__track">
            <span className="widget__fill" style={{ width: `${state.progress * 100}%` }} />
          </span>
        </div>
      );
    case "recording":
      return (
        <>
          <WaveBars source="mic" tone="coral" />
          <span className="widget__label widget__label--coral">{formatTimer(now - state.recordingStartedAt)}</span>
        </>
      );
    case "transcribing":
      return <ThinkingDots />;
    case "thinking": {
      const latest = state.task?.files[0];
      if (!latest) {
        return (
          <>
            <ThinkingDots />
            <span className="widget__label widget__label--violet">Thinking</span>
          </>
        );
      }
      const Icon = FILE_ICONS[latest.action];
      return (
        <>
          <Icon size={12} className={`widget__file-icon widget__file-icon--${latest.action}`} />
          <span className="widget__label widget__label--file">{fileName(latest.path)}</span>
          <span className="widget__count">{state.task?.files.length}</span>
        </>
      );
    }
    case "speaking":
      return <WaveBars source="voice" tone="blue" />;
    case "done": {
      const changed = state.task?.files.filter((f) => f.action !== "read").length ?? 0;
      return (
        <span className="widget__label widget__label--green">
          {changed ? `${changed} file${changed > 1 ? "s" : ""}` : "Done"} <Check size={12} />
        </span>
      );
    }
    case "error":
      return <span className="widget__label widget__label--red">{ERROR_LABELS[blockingError(state)?.kind ?? ""] ?? "Error"}</span>;
    case "paused":
      return <span className="widget__label widget__label--muted">Paused</span>;
    case "stopped":
      return <span className="widget__label widget__label--muted">Stopped</span>;
    case "idle":
      if (state.session === null) return <span className="widget__label widget__label--amber">No session</span>;
      if (state.errors.some((e) => e.kind === "gpu_fallback")) return <span className="widget__label widget__label--amber">On CPU</span>;
      return null;
  }
}
