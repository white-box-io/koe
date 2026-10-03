import { useEffect, useRef, useState } from "react";
import type { KoeError } from "../lib/types";
import { blockingError } from "../state/mode";
import type { KoeState } from "../state/reducer";

const DONE_POPUP_MS = 8000;
const SUBTITLE_LINGER_MS = 4000;
const NOTICE_MS = 7000;
const FADE_MS = 500;

export type Popup =
  | { kind: "setup" }
  | { kind: "error"; error: KoeError }
  | { kind: "done" }
  | { kind: "subtitles" }
  | null;

/**
 * Picks the popup that shows by itself (no click). Done, subtitles and notices
 * fade out after a while; hovering a popup keeps it open.
 */
export function usePopups(state: KoeState, now: number) {
  const [holding, setHolding] = useState(false);
  const holdUntil = useRef(0);
  const noticeSeen = useRef<Record<string, number>>({});

  useEffect(() => {
    if (holding) holdUntil.current = Date.now() + 1500;
  }, [holding, now]);

  for (const error of state.errors) {
    if (!(error.kind in noticeSeen.current)) noticeSeen.current[error.kind] = Date.now();
  }

  const settings = state.settings;
  const held = (until: number) => Math.max(until, holdUntil.current);

  const pick = (): { popup: Popup; until: number } => {
    if (!settings) return { popup: null, until: 0 };
    if (!settings.setupDone) return { popup: { kind: "setup" }, until: Infinity };
    const blocking = blockingError(state);
    if (blocking) return { popup: { kind: "error", error: blocking }, until: Infinity };
    if (settings.taskAlerts && state.doneAt && state.task?.finishedAt) {
      const until = held(state.doneAt + DONE_POPUP_MS);
      if (now < until) return { popup: { kind: "done" }, until };
    }
    if (settings.subtitles && (state.heard || state.sentence)) {
      const lastSpoken = Math.max(state.heard?.at ?? 0, state.sentence?.at ?? 0);
      const until = state.speaking || state.transcribing ? Infinity : held(lastSpoken + SUBTITLE_LINGER_MS);
      if (now < until) return { popup: { kind: "subtitles" }, until };
    }
    const notice = state.errors.find((e) => e.kind === "gpu_fallback" || e.kind === "no_session");
    if (notice) {
      const until = held(noticeSeen.current[notice.kind] + NOTICE_MS);
      if (now < until) return { popup: { kind: "error", error: notice }, until };
    }
    return { popup: null, until: 0 };
  };

  const { popup, until } = pick();
  const fading = until !== Infinity && until - now < FADE_MS;
  return { popup, fading, setHolding };
}
