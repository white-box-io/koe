import type {
  InputDevice,
  KoeError,
  PanelName,
  SessionInfo,
  Settings,
  SettingsTab,
  Task,
  TouchedFile,
  Voice,
} from "../lib/types";
import { addFile, finishTask, startTask } from "./task";

export type KoeState = {
  settings: Settings | null;
  engineReady: boolean;
  progress: number;
  stage: string;
  device: string | null;
  gpu: string | null;
  downloads: Record<string, number>;
  recording: boolean;
  recordingStartedAt: number;
  transcribing: boolean;
  speaking: boolean;
  paused: boolean;
  stoppedAt: number;
  devices: InputDevice[];
  voices: Voice[];
  errors: KoeError[];
  session: SessionInfo | null | undefined;
  heard: { text: string; at: number } | null;
  sentence: { text: string; at: number } | null;
  task: Task | null;
  doneAt: number;
  panel: PanelName | null;
  settingsTab: SettingsTab;
  hovering: boolean;
};

export const initialState: KoeState = {
  settings: null,
  engineReady: false,
  progress: 0,
  stage: "starting",
  device: null,
  gpu: null,
  downloads: {},
  recording: false,
  recordingStartedAt: 0,
  transcribing: false,
  speaking: false,
  paused: false,
  stoppedAt: 0,
  devices: [],
  voices: [],
  errors: [],
  session: undefined,
  heard: null,
  sentence: null,
  task: null,
  doneAt: 0,
  panel: null,
  settingsTab: "general",
  hovering: false,
};

export type Action =
  | { type: "settings"; settings: Settings }
  | { type: "engine"; event: Record<string, unknown> }
  | { type: "claude"; event: Record<string, unknown> }
  | { type: "open"; panel: PanelName | null; tab?: SettingsTab }
  | { type: "tab"; tab: SettingsTab }
  | { type: "dismissError"; kind: KoeError["kind"] }
  | { type: "hover"; on: boolean };

function withError(errors: KoeError[], error: KoeError) {
  return [...errors.filter((e) => e.kind !== error.kind), error];
}

function engineReducer(state: KoeState, event: Record<string, unknown>): KoeState {
  switch (event.event) {
    case "loading":
      return { ...state, engineReady: false, progress: event.progress as number, stage: event.stage as string };
    case "device":
      return { ...state, device: event.device as string, gpu: (event.gpu as string) ?? null };
    case "download":
      return { ...state, downloads: { ...state.downloads, [event.model as string]: event.progress as number } };
    case "ready":
      return {
        ...state,
        engineReady: true,
        progress: 1,
        errors: state.errors.filter((e) => e.kind !== "download_failed" && e.kind !== "engine_crashed"),
      };
    case "recording":
      return event.on
        ? { ...state, recording: true, recordingStartedAt: Date.now(), panel: null }
        : { ...state, recording: false };
    case "transcribing":
      return { ...state, transcribing: true };
    case "heard":
      return { ...state, transcribing: false, heard: event.text ? { text: event.text as string, at: Date.now() } : state.heard };
    case "speaking":
      return { ...state, speaking: Boolean(event.on) };
    case "sentence":
      return { ...state, sentence: { text: event.text as string, at: Date.now() } };
    case "stopped":
      return { ...state, speaking: false, stoppedAt: Date.now() };
    case "paused":
      return { ...state, paused: Boolean(event.on) };
    case "devices":
      return { ...state, devices: event.inputs as InputDevice[] };
    case "voices":
      return { ...state, voices: event.voices as Voice[] };
    case "mic_ok":
      return { ...state, errors: state.errors.filter((e) => e.kind !== "mic_missing") };
    case "error":
      return {
        ...state,
        errors: withError(state.errors, {
          kind: event.kind as KoeError["kind"],
          message: event.message as string,
          model: event.model as string | undefined,
        }),
      };
    default:
      return state;
  }
}

function claudeReducer(state: KoeState, event: Record<string, unknown>): KoeState {
  switch (event.kind) {
    case "following": {
      const session = (event.session as SessionInfo | null) ?? null;
      const errors = session
        ? state.errors.filter((e) => e.kind !== "no_session")
        : withError(state.errors, { kind: "no_session", message: "No Claude Code session found." });
      return { ...state, session, errors };
    }
    case "prompt":
      return { ...state, task: startTask(state.session?.project ?? "Claude Code"), doneAt: 0 };
    case "file": {
      const task = state.task && !state.task.finishedAt ? state.task : startTask(state.session?.project ?? "Claude Code");
      return { ...state, task: addFile(task, event as unknown as Omit<TouchedFile, "at">) };
    }
    case "done":
      return state.task && !state.task.finishedAt
        ? { ...state, task: finishTask(state.task), doneAt: Date.now() }
        : { ...state, doneAt: Date.now() };
    default:
      return state;
  }
}

export function reducer(state: KoeState, action: Action): KoeState {
  switch (action.type) {
    case "settings":
      return { ...state, settings: action.settings };
    case "engine":
      return engineReducer(state, action.event);
    case "claude":
      return claudeReducer(state, action.event);
    case "open":
      return { ...state, panel: action.panel, settingsTab: action.tab ?? state.settingsTab };
    case "tab":
      return { ...state, settingsTab: action.tab };
    case "dismissError":
      return { ...state, errors: state.errors.filter((e) => e.kind !== action.kind) };
    case "hover":
      return { ...state, hovering: action.on };
  }
}
