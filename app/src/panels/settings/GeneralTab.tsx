import { Choice, Row, Toggle } from "../../components/ui/controls";
import { sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";
import { HOTKEYS } from "./hotkeys";

export function GeneralTab() {
  const { state, updateSettings, open } = useKoe();
  const settings = state.settings!;
  const sessionLabel = settings.followSession === "auto" ? "Auto" : (state.session?.project ?? "Pinned");

  return (
    <>
      <Row label="Talk key">
        <Choice value={settings.hotkey} options={HOTKEYS} onChange={(hotkey) => updateSettings({ hotkey })} />
      </Row>
      <Row label="Follow session">
        <button className="settings__link" onClick={() => open("sessions")}>
          {sessionLabel}
        </button>
      </Row>
      <Row label="Speak replies">
        <Toggle
          on={settings.speakReplies}
          onChange={(speakReplies) => {
            updateSettings({ speakReplies });
            if (!speakReplies) sendToEngine("stop");
          }}
        />
      </Row>
      <Row label="Live subtitles">
        <Toggle on={settings.subtitles} onChange={(subtitles) => updateSettings({ subtitles })} />
      </Row>
      <Row label="Task-done alerts">
        <Toggle on={settings.taskAlerts} onChange={(taskAlerts) => updateSettings({ taskAlerts })} />
      </Row>
      <Row label="Sound effects">
        <Toggle on={settings.soundEffects} onChange={(soundEffects) => updateSettings({ soundEffects })} />
      </Row>
      <Row label="Start with Windows">
        <Toggle on={settings.startWithWindows} onChange={(startWithWindows) => updateSettings({ startWithWindows })} />
      </Row>
    </>
  );
}
