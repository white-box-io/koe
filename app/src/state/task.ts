import type { FileAction, Task, TouchedFile } from "../lib/types";

export function startTask(project: string): Task {
  return { project, startedAt: Date.now(), finishedAt: null, files: [] };
}

function mergedAction(previous: FileAction | undefined, next: FileAction): FileAction {
  if (next === "read") return previous ?? "read";
  if (next === "write") return previous === "read" || previous === "edit" ? "edit" : "new";
  if (previous === "new") return "new";
  return "edit";
}

/** Newest file first; a file touched twice keeps one row with summed line counts. */
export function addFile(task: Task, file: Omit<TouchedFile, "at">): Task {
  const existing = task.files.find((f) => f.path === file.path);
  const merged: TouchedFile = {
    path: file.path,
    action: mergedAction(existing?.action, file.action),
    added: (existing?.added ?? 0) + file.added,
    removed: (existing?.removed ?? 0) + file.removed,
    snippet: file.snippet || existing?.snippet || "",
    at: Date.now(),
  };
  const others = task.files.filter((f) => f.path !== file.path);
  return { ...task, files: [merged, ...others] };
}

export function finishTask(task: Task): Task {
  return { ...task, finishedAt: Date.now() };
}

export const changedFiles = (task: Task) => task.files.filter((f) => f.action !== "read");

export const readOnlyFiles = (task: Task) => task.files.filter((f) => f.action === "read");

export function fileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

export function parentFolder(path: string) {
  const parts = path.split(/[\\/]/);
  return parts.slice(-3, -1).join("/");
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
