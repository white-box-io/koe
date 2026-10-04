import { mockIPC } from "@tauri-apps/api/mocks";
import ReactDOM from "react-dom/client";
import { Widget } from "../components/widget/Widget";
import { setLevels } from "../lib/levels";
import type { Mode, SettingsTab } from "../lib/types";
import { ActivityPanel, TaskSummary } from "../panels/activity/ActivityPanel";
import { ErrorPanel } from "../panels/errors/ErrorPanel";
import { ContextMenu } from "../panels/menu/ContextMenu";
import { SessionsPanel } from "../panels/sessions/SessionsPanel";
import { SettingsPanel } from "../panels/settings/SettingsPanel";
import { SetupPanel } from "../panels/setup/SetupPanel";
import { SubtitlesPanel } from "../panels/subtitles/SubtitlesPanel";
import { KoeContext } from "../state/KoeProvider";
import type { KoeState } from "../state/reducer";
import { FAKE_STATE, FAKE_TASK_DONE, FAKE_TASK_LIVE } from "./fakeState";
import "../styles/tokens.css";
import "../styles/base.css";
import "./preview.css";

mockIPC(() => []);
setInterval(() => setLevels(0.4 + Math.random() * 0.5, 0.4 + Math.random() * 0.5), 60);

function Fake({ patch = {}, children }: { patch?: Partial<KoeState>; children: React.ReactNode }) {
  const state = { ...FAKE_STATE, ...patch };
  const value = { state, dispatch: () => {}, updateSettings: () => {}, open: () => {} };
  return <KoeContext.Provider value={value}>{children}</KoeContext.Provider>;
}

function Tile({ title, children, patch }: { title: string; children: React.ReactNode; patch?: Partial<KoeState> }) {
  return (
    <Fake patch={patch}>
      <figure className="tile">
        <figcaption>{title}</figcaption>
        <div className="stage">{children}</div>
      </figure>
    </Fake>
  );
}

const now = Date.now();
const MODES: { mode: Mode; patch?: Partial<KoeState> }[] = [
  { mode: "idle" },
  { mode: "loading", patch: { engineReady: false, progress: 0.42 } },
  { mode: "recording", patch: { recordingStartedAt: now - 4000 } },
  { mode: "thinking", patch: { task: { ...FAKE_TASK_LIVE, files: [] } } },
  { mode: "thinking", patch: { task: FAKE_TASK_LIVE } },
  { mode: "speaking" },
  { mode: "done", patch: { task: FAKE_TASK_DONE } },
  { mode: "error", patch: { errors: [{ kind: "mic_missing", message: "" }] } },
  { mode: "paused" },
  { mode: "stopped" },
];

const TABS: SettingsTab[] = ["general", "hearing", "voice", "character", "about"];

function Gallery() {
  return (
    <div className="gallery">
      <Tile title="Yuki · widget" patch={{ settings: { ...FAKE_STATE.settings!, character: "yuki" } }}>
        <Widget mode="speaking" now={now} onDragStart={() => {}} />
        <Widget mode="idle" now={now} onDragStart={() => {}} />
      </Tile>
      <Tile title="Yuki · settings" patch={{ settings: { ...FAKE_STATE.settings!, character: "yuki" }, settingsTab: "character", panel: "settings" }}>
        <SettingsPanel />
      </Tile>
      {MODES.map(({ mode, patch }, index) => (
        <Tile key={index} title={`Widget · ${mode}`} patch={patch}>
          <Widget mode={mode} now={now} onDragStart={() => {}} />
        </Tile>
      ))}
      <Tile title="Hover · quick actions" patch={{ hovering: true }}>
        <Widget mode="idle" now={now} onDragStart={() => {}} />
      </Tile>
      <Tile title="Activity · empty" patch={{ task: null }}><ActivityPanel /></Tile>
      <Tile title="Activity · live" patch={{ task: FAKE_TASK_LIVE }}><ActivityPanel /></Tile>
      <Tile title="Activity · summary" patch={{ task: FAKE_TASK_DONE }}><TaskSummary task={FAKE_TASK_DONE} /></Tile>
      <Tile title="Right-click menu"><ContextMenu /></Tile>
      <Tile title="Sessions"><SessionsPanel /></Tile>
      <Tile title="Subtitles"><SubtitlesPanel fading={false} /></Tile>
      {TABS.map((tab) => (
        <Tile key={tab} title={`Settings · ${tab}`} patch={{ settingsTab: tab }}><SettingsPanel /></Tile>
      ))}
      <Tile title="Setup" patch={{ settings: { ...FAKE_STATE.settings!, setupDone: false } }}><SetupPanel /></Tile>
      <Tile title="Error · no session"><ErrorPanel error={{ kind: "no_session", message: "" }} /></Tile>
      <Tile title="Error · GPU"><ErrorPanel error={{ kind: "gpu_fallback", message: "" }} /></Tile>
      <Tile title="Error · download"><ErrorPanel error={{ kind: "download_failed", message: "", model: "kokoro" }} /></Tile>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Gallery />);
