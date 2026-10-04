import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ClaudeEvent, EngineEvent, SessionInfo, Settings } from "./types";

export const getSettings = () => invoke<Settings>("get_settings");

export const saveSettings = (settings: Settings) => invoke("save_settings", { settings });

export const sendToEngine = (cmd: string, fields: Record<string, unknown> = {}) =>
  invoke("engine_command", { command: { cmd, ...fields } });

export const restartEngine = () => invoke("restart_engine");

export const listSessions =() => invoke<SessionInfo[]>("list_sessions");

export const openFile = (path: string, snippet?: string) => invoke("open_file", { path, snippet });

export const backupFiles = (project: string, date: string, time: string, files: string[]) =>
  invoke<string>("backup_files", { project, date, time, files });

export const openFolder = (folder: string) => invoke("open_url", { url: folder });

export const openSoundSettings = () => invoke("open_sound_settings");

export const openUrl = (url: string) => invoke("open_url", { url });

export const quitApp = () => invoke("quit_app");

export const onEngineEvent = (handler: (event: EngineEvent) => void) =>
  listen<EngineEvent>("engine", (message) => handler(message.payload));

export const onClaudeEvent = (handler: (event: ClaudeEvent) => void) =>
  listen<ClaudeEvent>("claude", (message) => handler(message.payload));

export const onPointerOutside = (handler: () => void) => listen("pointer-outside", () => handler());
