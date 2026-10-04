import { Check, Mic } from "lucide-react";
import { useEffect } from "react";
import { Buddy } from "../../components/buddy/Buddy";
import { Choice, Keycap, LevelMeter } from "../../components/ui/controls";
import { useLiveLevel } from "../../hooks/useLiveLevel";
import { sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";
import { HOTKEYS, hotkeyLabel } from "../settings/hotkeys";
import { VoiceList } from "../settings/VoiceList";

export function WelcomeStep() {
  return (
    <div className="setup__hero">
      <Buddy face="hehe" size={72} alive />
      <span className="setup__hero-title">Hi, I'm Koe</span>
      <span className="setup__hero-body">Hold a key, talk to Claude Code, and hear it talk back. Takes a minute to set up.</span>
    </div>
  );
}

export function MicStep() {
  const { state, updateSettings } = useKoe();
  const level = useLiveLevel("mic");
  const hearsYou = level > 0.15;

  useEffect(() => {
    sendToEngine("list_devices");
    sendToEngine("mic_test", { on: true });
    return () => {
      sendToEngine("mic_test", { on: false });
    };
  }, []);

  const microphones = [
    { value: null as number | null, label: "Windows default" },
    ...state.devices.map((device) => ({ value: device.index as number | null, label: device.name })),
  ];

  return (
    <>
      <Choice wide icon={<Mic size={14} />} value={state.settings?.micIndex ?? null} options={microphones} onChange={(micIndex) => updateSettings({ micIndex })} />
      <LevelMeter level={level} />
      <span className={`setup__status ${hearsYou ? "setup__status--good" : ""}`}>
        {hearsYou ? (
          <>
            <Check size={13} /> Hearing you clearly
          </>
        ) : state.engineReady ? (
          "Say something. The bar should move."
        ) : (
          "The microphone test starts once Koe has woken up."
        )}
      </span>
    </>
  );
}

export function KeyStep() {
  const { state, updateSettings } = useKoe();
  const hotkey = state.settings?.hotkey ?? "right ctrl";
  return (
    <>
      <span className="setup__hint">Hold it to speak, let go to send. Tap it to stop Koe talking.</span>
      <div className="setup__big-key">
        <span className="setup__big-keycap">{hotkeyLabel(hotkey)}</span>
      </div>
      <div className="setup__keys">
        <span className="setup__or">or</span>
        {HOTKEYS.filter((key) => key.value !== hotkey)
          .slice(0, 3)
          .map((key) => (
            <Keycap key={key.value} label={key.label} onClick={() => updateSettings({ hotkey: key.value })} />
          ))}
      </div>
    </>
  );
}

export function VoiceStep() {
  const { state } = useKoe();
  useEffect(() => {
    sendToEngine("list_voices");
  }, []);
  const favourites = ["af_heart", "af_bella", "bf_emma"];
  const voices = favourites.map((id) => state.voices.find((voice) => voice.id === id)).filter((voice) => voice !== undefined);
  return (
    <>
      {voices.length ? <VoiceList voices={voices} /> : <span className="setup__hint">Voices appear once Koe has woken up.</span>}
      <span className="setup__hint">More voices in Settings.</span>
    </>
  );
}

export function DownloadStep() {
  const { state } = useKoe();
  const items = [
    { name: "Whisper · hearing", key: "whisper" },
    { name: "Kokoro · voice", key: "kokoro" },
  ];
  const install = state.install;
  return (
    <>
      {install && (
        <div className="setup__download">
          <div className="setup__download-top">
            <span>Voice engine · one-time, ~3 GB</span>
            {install.progress >= 1 ? (
              <span className="setup__done">
                <Check size={12} /> Ready
              </span>
            ) : (
              <span className="setup__percent">{Math.round(install.progress * 100)}%</span>
            )}
          </div>
          <span className="setup__track">
            <span className="setup__fill" style={{ width: `${install.progress * 100}%` }} />
          </span>
        </div>
      )}
      {items.map((item) => {
        const progress = state.engineReady ? 1 : (state.downloads[item.key] ?? (state.progress > 0.55 ? 1 : 0));
        return (
          <div key={item.key} className="setup__download">
            <div className="setup__download-top">
              <span>{item.name}</span>
              {progress >= 1 ? (
                <span className="setup__done">
                  <Check size={12} /> Ready
                </span>
              ) : (
                <span className="setup__percent">{progress > 0 ? `${Math.round(progress * 100)}%` : "Waiting"}</span>
              )}
            </div>
            <span className="setup__track">
              <span className="setup__fill" style={{ width: `${progress * 100}%` }} />
            </span>
          </div>
        );
      })}
      <span className="setup__hint">
        {state.engineReady ? "All set. Hold your talk key and say hi!" : `${state.stage}… one-time download, runs on your GPU after this.`}
      </span>
    </>
  );
}
