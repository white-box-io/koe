import type { Task } from "../lib/types";
import { initialState, type KoeState } from "../state/reducer";

const minutesAgo = (minutes: number) => Date.now() - minutes * 60_000;

export const FAKE_TASK_LIVE: Task = {
  project: "Noki",
  startedAt: minutesAgo(0.7),
  finishedAt: null,
  files: [
    { path: "F:/koe/src/koe/ui/companion_window.py", action: "edit", added: 18, removed: 6, snippet: "", at: 0 },
    { path: "F:/koe/src/koe/app.py", action: "read", added: 0, removed: 0, snippet: "", at: 0 },
    { path: "F:/koe/src/koe/hotkey.py", action: "new", added: 15, removed: 0, snippet: "", at: 0 },
    { path: "F:/koe/settings.toml", action: "read", added: 0, removed: 0, snippet: "", at: 0 },
  ],
};

export const FAKE_TASK_DONE: Task = {
  ...FAKE_TASK_LIVE,
  startedAt: minutesAgo(2.2),
  finishedAt: Date.now(),
  files: [
    ...FAKE_TASK_LIVE.files,
    { path: "F:/koe/pyproject.toml", action: "edit", added: 2, removed: 1, snippet: "", at: 0 },
    { path: "F:/koe/src/koe/speaker.py", action: "read", added: 0, removed: 0, snippet: "", at: 0 },
  ],
};

export const FAKE_STATE: KoeState = {
  ...initialState,
  settings: {
    setupDone: true,
    hotkey: "right ctrl",
    micIndex: null,
    whisperModel: "small.en",
    language: "en",
    device: "auto",
    voice: "af_heart",
    speed: 1.1,
    followSession: "auto",
    voiceProvider: "kokoro",
    elevenApiKey: "",
    elevenVoiceId: "",
    speakReplies: true,
    autoSend: true,
    subtitles: true,
    taskAlerts: true,
    soundEffects: false,
    startWithWindows: true,
    character: "anime-buddy",
    position: null,
  },
  engineReady: true,
  progress: 1,
  device: "cuda",
  gpu: "NVIDIA GeForce GTX 1650",
  session: { path: "x", project: "Noki", folder: "f:/mcp-tools/Noki", title: "Koe voice app", modifiedSecsAgo: 3 },
  devices: [
    { index: 1, name: "Microphone (COMET 7.1)", default: true },
    { index: 2, name: "Microphone (Realtek(R) Audio)", default: false },
  ],
  voices: [
    { id: "af_heart", name: "Heart", style: "Warm", accent: "US", gender: "female" },
    { id: "af_bella", name: "Bella", style: "Playful", accent: "US", gender: "female" },
    { id: "bf_emma", name: "Emma", style: "Calm", accent: "UK", gender: "female" },
    { id: "am_michael", name: "Michael", style: "Deep", accent: "US", gender: "male" },
  ],
  heard: { text: "Can you make the save button a bit bigger?", at: Date.now() },
  sentence: { text: "Sure! Making the save button twenty percent larger and keeping it centred.", seconds: 4, at: Date.now() },
};
