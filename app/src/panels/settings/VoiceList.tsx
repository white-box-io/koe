import { Check, Pause, Play } from "lucide-react";
import { useState } from "react";
import { sendToEngine } from "../../lib/bridge";
import type { Voice } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";

type VoiceListProps = { voices: Voice[]; limit?: number };

/** Tap the play button to hear a voice; tap the row to choose it. */
export function VoiceList({ voices, limit }: VoiceListProps) {
  const { state, updateSettings } = useKoe();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const selected = state.settings?.voice;
  const isPlaying = (id: string) => previewing === id && state.speaking;

  const preview = (id: string) => {
    if (isPlaying(id)) {
      sendToEngine("stop");
      setPreviewing(null);
      return;
    }
    setPreviewing(id);
    sendToEngine("preview_voice", { voice: id });
  };

  return (
    <div className="voices">
      {voices.slice(0, limit).map((voice) => (
        <div
          key={voice.id}
          role="button"
          className={`voice ${voice.id === selected ? "voice--on" : ""}`}
          onClick={() => updateSettings({ voice: voice.id })}
        >
          <button
            className={`voice__play ${voice.id === selected || isPlaying(voice.id) ? "voice__play--on" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              preview(voice.id);
            }}
          >
            {isPlaying(voice.id) ? <Pause size={11} fill="white" /> : <Play size={11} fill="white" />}
          </button>
          <span className="voice__text">
            <span className="voice__name">{voice.name}</span>
            <span className="voice__meta">
              {voice.style} · {voice.accent}
            </span>
          </span>
          {voice.id === selected && <Check size={14} className="voice__check" />}
        </div>
      ))}
    </div>
  );
}
