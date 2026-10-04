import { Check, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/controls";
import { sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";
import "./eleven.css";

const FILTERS = ["All", "Female", "Male"] as const;
type Filter = (typeof FILTERS)[number];

/** The user's own ElevenLabs key and voices. The key stays on this computer. */
export function ElevenLabsVoices() {
  const { state, updateSettings } = useKoe();
  const settings = state.settings!;
  const [apiKey, setApiKey] = useState(settings.elevenApiKey);
  const loaded = state.elevenVoices;
  const [filter, setFilter] = useState<Filter>("All");
  const voices = (loaded?.voices ?? []).filter((voice) => filter === "All" || voice.gender === filter.toLowerCase());

  const loadVoices = () => {
    updateSettings({ elevenApiKey: apiKey.trim() });
    sendToEngine("list_eleven_voices", { api_key: apiKey.trim() });
  };

  return (
    <>
      <div className="eleven__key">
        <input
          className="eleven__input"
          type="password"
          placeholder="Paste your ElevenLabs API key"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <Button onClick={loadVoices} disabled={!apiKey.trim()}>
          Load voices
        </Button>
      </div>
      {loaded?.error && <div className="eleven__error">Couldn't load voices. Check the key.</div>}
      {voices.length > 0 || filter !== "All" ? (
        <div className="chips">
          {FILTERS.map((name) => (
            <button key={name} className={`chip ${filter === name ? "chip--on" : ""}`} onClick={() => setFilter(name)}>
              {name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="voices__scroll">
        <div className="voices">
          {voices.map((voice) => (
            <div
              key={voice.id}
              role="button"
              className={`voice ${voice.id === settings.elevenVoiceId ? "voice--on" : ""}`}
              onClick={() => updateSettings({ elevenVoiceId: voice.id })}
            >
              <button
                className="voice__play"
                onClick={(event) => {
                  event.stopPropagation();
                  sendToEngine("preview_voice", { voice: voice.id, provider: "elevenlabs" });
                }}
              >
                <Play size={11} fill="white" />
              </button>
              <span className="voice__text">
                <span className="voice__name">{voice.name}</span>
                <span className="voice__meta">{[voice.gender, voice.accent].filter(Boolean).join(" · ")}</span>
              </span>
              {voice.id === settings.elevenVoiceId && <Check size={14} className="voice__check" />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
