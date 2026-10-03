import { useRef, useState } from "react";
import type { Mode } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";
import { Buddy } from "../buddy/Buddy";
import type { FaceName } from "../buddy/faces";
import { QuickActions } from "./QuickActions";
import { WidgetContent } from "./WidgetContent";
import "./widget.css";

const FACE_FOR_MODE: Record<Mode, FaceName> = {
  loading: "sleeping",
  idle: "idle",
  recording: "listening",
  transcribing: "thinking",
  thinking: "thinking",
  speaking: "speaking",
  done: "done",
  error: "error",
  paused: "sleeping",
  stopped: "stopped",
};

const POKE_FACES: FaceName[] = ["hehe", "love", "panic", "bruh"];
const DRAG_THRESHOLD = 4;
const DOUBLE_CLICK_MS = 230;

type WidgetProps = { mode: Mode; now: number; onDragStart: () => void };

export function Widget({ mode, now, onDragStart }: WidgetProps) {
  const { state, dispatch, open } = useKoe();
  const [poke, setPoke] = useState({ count: 0, face: "hehe" as FaceName, until: 0 });
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const clickTimer = useRef(0);

  const face = now < poke.until ? poke.face : state.errors.some((e) => e.kind === "gpu_fallback") && mode === "idle" ? "bruh" : FACE_FOR_MODE[mode];
  const showQuick = state.hovering && !["loading", "recording", "error"].includes(mode) && state.settings?.setupDone;
  const isCompact = !showQuick && isEmpty(mode, state.session, state.errors.length);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    press.current = { x: event.screenX, y: event.screenY, dragging: false };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const current = press.current;
    if (!current || current.dragging) return;
    const moved = Math.hypot(event.screenX - current.x, event.screenY - current.y);
    if (moved > DRAG_THRESHOLD) {
      current.dragging = true;
      onDragStart();
    }
  };

  const handleMouseUp = () => {
    const wasClick = press.current && !press.current.dragging;
    press.current = null;
    if (!wasClick) return;
    clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      open(state.panel === "activity" ? null : "activity");
    }, DOUBLE_CLICK_MS);
  };

  const handleDoubleClick = () => {
    clearTimeout(clickTimer.current);
    const pokeFace = POKE_FACES[Math.floor(Math.random() * POKE_FACES.length)];
    setPoke((previous) => ({ count: previous.count + 1, face: pokeFace, until: Date.now() + 1100 }));
  };

  return (
    <div
      className={`widget widget--${mode}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(event) => {
        event.preventDefault();
        open(state.panel === "menu" ? null : "menu");
      }}
      onMouseEnter={() => dispatch({ type: "hover", on: true })}
      onMouseLeave={() => dispatch({ type: "hover", on: false })}
    >
      <div className={`widget__glass ${isCompact ? "widget__glass--compact" : ""}`}>
        <Buddy face={face} size={30} alive squashKey={poke.count + state.stoppedAt} />
        {showQuick ? <QuickActions /> : <WidgetContent mode={mode} now={now} />}
      </div>
    </div>
  );
}

function isEmpty(mode: Mode, session: unknown, errorCount: number) {
  return mode === "idle" && session !== null && errorCount === 0;
}
