import { Info, Mic, Settings, Sparkles, Volume2, X } from "lucide-react";
import { Panel, PanelHeader } from "../../components/panel/Panel";
import type { SettingsTab } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";
import { AboutTab } from "./AboutTab";
import { CharacterTab } from "./CharacterTab";
import { GeneralTab } from "./GeneralTab";
import { HearingTab } from "./HearingTab";
import { VoiceTab } from "./VoiceTab";
import "./settings.css";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings size={14} /> },
  { id: "hearing", label: "Hearing", icon: <Mic size={14} /> },
  { id: "voice", label: "Voice", icon: <Volume2 size={14} /> },
  { id: "character", label: "Character", icon: <Sparkles size={14} /> },
  { id: "about", label: "About", icon: <Info size={14} /> },
];

const CONTENT: Record<SettingsTab, () => React.ReactNode> = {
  general: () => <GeneralTab />,
  hearing: () => <HearingTab />,
  voice: () => <VoiceTab />,
  character: () => <CharacterTab />,
  about: () => <AboutTab />,
};

export function SettingsPanel() {
  const { state, dispatch, open } = useKoe();
  if (!state.settings) return null;
  return (
    <Panel width={300}>
      <PanelHeader
        title="Settings"
        right={
          <button className="settings__close" title="Close" onClick={() => open(null)}>
            <X size={14} />
          </button>
        }
      />
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            title={tab.label}
            className={`tabs__tab ${state.settingsTab === tab.id ? "tabs__tab--on" : ""}`}
            onClick={() => dispatch({ type: "tab", tab: tab.id })}
          >
            {tab.icon}
          </button>
        ))}
      </div>
      <div className="settings__body">{CONTENT[state.settingsTab]()}</div>
    </Panel>
  );
}
