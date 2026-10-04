import { Mic } from "lucide-react";
import { useEffect } from "react";
import { Choice, LevelMeter, Row } from "../../components/ui/controls";
import { useLiveLevel } from "../../hooks/useLiveLevel";
import { sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";

const MODELS = [
  { value: "base.en", label: "Base · fastest" },
  { value: "small.en", label: "Small · balanced" },
  { value: "medium.en", label: "Medium · most accurate" },
  { value: "whistle", label: "Whistle · tiny, experimental" },
];

export function HearingTab() {
  const { state, updateSettings } = useKoe();
  const settings = state.settings!;
  const level = useLiveLevel("mic");

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
  const deviceOptions = [
    { value: "auto", label: state.gpu ? `GPU · ${state.gpu.replace("NVIDIA GeForce ", "")}` : "GPU when available" },
    { value: "cpu", label: "CPU only" },
  ];

  return (
    <>
      <Choice wide icon={<Mic size={14} />} value={settings.micIndex} options={microphones} onChange={(micIndex) => updateSettings({ micIndex })} />
      <LevelMeter level={level} />
      <Row label="Speech model">
        <Choice value={settings.whisperModel} options={MODELS} onChange={(whisperModel) => updateSettings({ whisperModel })} />
      </Row>
      <Row label="Run on">
        <Choice value={settings.device} options={deviceOptions} onChange={(device) => updateSettings({ device })} />
      </Row>
      <span className="settings__note">Bigger models hear better but load slower. GPU changes apply after a restart.</span>
    </>
  );
}
