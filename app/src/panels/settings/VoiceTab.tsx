import { useState } from "react";
import { Choice, Row, Slider } from "../../components/ui/controls";
import { useKoe } from "../../state/KoeProvider";
import { ElevenLabsVoices } from "./ElevenLabsVoices";
import { VoiceList } from "./VoiceList";

const FILTERS = ["All", "US", "UK", "Female", "Male"] as const;
type Filter = (typeof FILTERS)[number];

function matches(filter: Filter, voice: { accent: string; gender: string }) {
  if (filter === "All") return true;
  if (filter === "US" || filter === "UK") return voice.accent === filter;
  return voice.gender === filter.toLowerCase();
}

export function VoiceTab() {
  const { state, updateSettings } = useKoe();
  const [filter, setFilter] = useState<Filter>("All");
  const voices = state.voices.filter((voice) => matches(filter, voice));

  const provider = state.settings!.voiceProvider;

  return (
    <>
      <Row label="Voice from">
        <Choice
          value={provider}
          options={[
            { value: "kokoro", label: "Kokoro · local" },
            { value: "elevenlabs", label: "ElevenLabs · your key" },
          ]}
          onChange={(voiceProvider) => updateSettings({ voiceProvider })}
        />
      </Row>
      {provider === "elevenlabs" ? (
        <ElevenLabsVoices />
      ) : (
        <>
          <div className="chips">
            {FILTERS.map((name) => (
              <button key={name} className={`chip ${filter === name ? "chip--on" : ""}`} onClick={() => setFilter(name)}>
                {name}
              </button>
            ))}
          </div>
          <div className="voices__scroll">
            <VoiceList voices={voices} />
          </div>
        </>
      )}
      <Row label="Speed">
        <Slider
          value={state.settings!.speed}
          min={0.8}
          max={1.5}
          step={0.05}
          format={(value) => `${value.toFixed(1)}×`}
          onChange={(speed) => updateSettings({ speed })}
        />
      </Row>
    </>
  );
}
