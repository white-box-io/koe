import { BellOff, Bell, ChevronRight, Files, Layers, PauseCircle, PlayCircle, Power, Settings, Sparkles, Square, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "../../components/panel/Panel";
import { quitApp, sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";
import "./menu.css";

type ItemProps = { icon: ReactNode; label: string; hint?: ReactNode; danger?: boolean; onClick: () => void };

function Item({ icon, label, hint, danger, onClick }: ItemProps) {
  return (
    <button className={`menu-item ${danger ? "menu-item--danger" : ""}`} onClick={onClick}>
      {icon}
      <span className="menu-item__label">{label}</span>
      {hint && <span className="menu-item__hint">{hint}</span>}
    </button>
  );
}

const Separator = () => <div className="menu-separator" />;

export function ContextMenu() {
  const { state, open, updateSettings } = useKoe();
  const close = () => open(null);
  const soundsOn = state.settings?.soundEffects ?? false;
  const following = state.session ? `Following ${state.session.project}` : "No Claude session";

  return (
    <Panel width={240} tight>
      <div className="menu-header">
        <div className="menu-header__titles">
          <span className="menu-header__title">Koe</span>
          <span className="menu-header__subtitle">{following}</span>
        </div>
        <span className={`menu-header__dot ${state.session ? "" : "menu-header__dot--off"}`} />
      </div>
      <Separator />
      <Item
        icon={state.paused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
        label={state.paused ? "Resume listening" : "Pause listening"}
        onClick={() => {
          sendToEngine("pause", { on: !state.paused });
          close();
        }}
      />
      <Item icon={<Square size={13} />} label="Stop speaking" onClick={() => { sendToEngine("stop"); close(); }} />
      <Item icon={<Files size={14} />} label="Last task files" onClick={() => open("activity")} />
      <Separator />
      <Item icon={<Layers size={14} />} label="Follow session" hint={<ChevronRight size={13} />} onClick={() => open("sessions")} />
      <Item icon={<Volume2 size={14} />} label="Voice" hint={<ChevronRight size={13} />} onClick={() => open("settings", "voice")} />
      <Item icon={<Sparkles size={14} />} label="Character" hint={<ChevronRight size={13} />} onClick={() => open("settings", "character")} />
      <Item
        icon={soundsOn ? <BellOff size={14} /> : <Bell size={14} />}
        label={soundsOn ? "Mute sounds" : "Turn on sounds"}
        onClick={() => updateSettings({ soundEffects: !soundsOn })}
      />
      <Separator />
      <Item icon={<Settings size={14} />} label="Settings" onClick={() => open("settings", "general")} />
      <Item icon={<Power size={14} />} label="Quit Koe" danger onClick={() => quitApp()} />
    </Panel>
  );
}
