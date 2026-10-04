export type Settings = {
  setupDone: boolean;
  hotkey: string;
  micIndex: number | null;
  whisperModel: string;
  language: string;
  device: string;
  voice: string;
  speed: number;
  followSession: string;
  speakReplies: boolean;
  subtitles: boolean;
  taskAlerts: boolean;
  soundEffects: boolean;
  startWithWindows: boolean;
  character: string;
  position: [number, number] | null;
};

export type SessionInfo = {
  path: string;
  project: string;
  folder: string;
  title: string;
  modifiedSecsAgo: number;
};

export type Voice = {
  id: string;
  name: string;
  style: string;
  accent: string;
  gender: string;
};

export type InputDevice = { index: number; name: string; default: boolean };

export type FileAction = "read" | "edit" | "write" | "new";

export type TouchedFile = {
  path: string;
  action: FileAction;
  added: number;
  removed: number;
  snippet: string;
  at: number;
};

export type Task = {
  project: string;
  startedAt: number;
  finishedAt: number | null;
  files: TouchedFile[];
};

export type ErrorKind = "mic_missing" | "gpu_fallback" | "download_failed" | "engine_crashed" | "no_session" | "model_failed";

export type KoeError = { kind: ErrorKind; message: string; model?: string };

export type PanelName = "activity" | "settings" | "menu" | "sessions";

export type SettingsTab = "general" | "hearing" | "voice" | "character" | "about";

export type Mode =
  | "loading"
  | "idle"
  | "recording"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "done"
  | "error"
  | "paused"
  | "stopped";

export type EngineEvent = { event: string; [field: string]: unknown };

export type ClaudeEvent = { kind: string; [field: string]: unknown };
