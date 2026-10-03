/** Audio levels arrive ~30 times a second, so they live outside React state. */
export const levels = { mic: 0, voice: 0, updatedAt: 0 };

export function setLevels(mic: number, voice: number) {
  levels.mic = mic;
  levels.voice = voice;
  levels.updatedAt = performance.now();
}

export function currentLevel(source: "mic" | "voice") {
  const isStale = performance.now() - levels.updatedAt > 150;
  return isStale ? 0 : levels[source];
}
