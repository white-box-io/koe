import type { KoeError, Mode } from "../lib/types";
import type { KoeState } from "./reducer";

const STOPPED_SHOWN_MS = 1200;
const DONE_SHOWN_MS = 4000;
const BLOCKING: KoeError["kind"][] = ["engine_crashed", "download_failed", "mic_missing"];

export const blockingError = (state: KoeState) => state.errors.find((e) => BLOCKING.includes(e.kind)) ?? null;

export function currentMode(state: KoeState, now: number): Mode {
  const blocking = blockingError(state);
  if (blocking && blocking.kind !== "mic_missing") return "error";
  if (!state.engineReady) return "loading";
  if (blocking) return "error";
  if (state.paused) return "paused";
  if (state.recording) return "recording";
  if (now - state.stoppedAt < STOPPED_SHOWN_MS) return "stopped";
  if (state.speaking) return "speaking";
  if (state.transcribing) return "transcribing";
  if (state.task && !state.task.finishedAt) return "thinking";
  if (state.doneAt && now - state.doneAt < DONE_SHOWN_MS) return "done";
  return "idle";
}

export const isTaskRunning = (state: KoeState) => Boolean(state.task && !state.task.finishedAt);
