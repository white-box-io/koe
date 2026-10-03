import { MicOff, Mic, Settings, Square } from "lucide-react";
import { sendToEngine } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";

export function QuickActions() {
  const { state, open } = useKoe();
  const actions = [
    {
      label: state.paused ? "Unmute mic" : "Mute mic",
      icon: state.paused ? <Mic size={14} /> : <MicOff size={14} />,
      run: () => sendToEngine("pause", { on: !state.paused }),
    },
    { label: "Stop speaking", icon: <Square size={13} />, run: () => sendToEngine("stop") },
    { label: "Settings", icon: <Settings size={14} />, run: () => open("settings", "general") },
  ];

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <button
          key={action.label}
          className="quick-actions__button"
          title={action.label}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            action.run();
          }}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
