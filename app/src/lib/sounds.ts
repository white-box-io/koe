let audio: AudioContext | null = null;

const BLIPS = {
  recordStart: [660, 880],
  recordEnd: [880, 660],
  done: [660, 880, 1100],
  error: [440, 330],
} as const;

export type BlipName = keyof typeof BLIPS;

export function playBlip(name: BlipName) {
  audio ??= new AudioContext();
  const start = audio.currentTime;
  BLIPS[name].forEach((frequency, index) => {
    const oscillator = audio!.createOscillator();
    const gain = audio!.createGain();
    const at = start + index * 0.07;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.06, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    oscillator.connect(gain).connect(audio!.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.1);
  });
}
