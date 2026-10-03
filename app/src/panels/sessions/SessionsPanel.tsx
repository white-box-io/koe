import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, SectionLabel } from "../../components/panel/Panel";
import { listSessions } from "../../lib/bridge";
import type { SessionInfo } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";
import "./sessions.css";

function timeAgo(seconds: number) {
  if (seconds < 60) return "active now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} d ago`;
}

function statusTone(seconds: number) {
  if (seconds < 120) return "green";
  if (seconds < 3600) return "amber";
  return "grey";
}

export function SessionsPanel() {
  const { state, updateSettings, open } = useKoe();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const choice = state.settings?.followSession ?? "auto";

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  const choose = (value: string) => {
    updateSettings({ followSession: value });
    open(null);
  };

  return (
    <Panel width={320} tight>
      <div className="sessions__label">
        <SectionLabel>Follow Claude session</SectionLabel>
      </div>
      <button className={`session ${choice === "auto" ? "session--on" : ""}`} onClick={() => choose("auto")}>
        <span className="session__dot session__dot--violet" />
        <span className="session__text">
          <span className="session__name">Auto · most recent</span>
          <span className="session__meta">Switches to whichever session you used last</span>
        </span>
        {choice === "auto" && <Check size={14} className="session__check" />}
      </button>
      {sessions.map((session) => (
        <button key={session.path} className={`session ${choice === session.path ? "session--on" : ""}`} onClick={() => choose(session.path)}>
          <span className={`session__dot session__dot--${statusTone(session.modifiedSecsAgo)}`} />
          <span className="session__text">
            <span className="session__name">{session.project}</span>
            <span className="session__meta">
              {session.title || session.folder} · {timeAgo(session.modifiedSecsAgo)}
            </span>
          </span>
          {choice === session.path && <Check size={14} className="session__check" />}
        </button>
      ))}
    </Panel>
  );
}
