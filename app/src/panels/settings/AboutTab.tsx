import { ExternalLink, GitFork, Info } from "lucide-react";
import { Buddy } from "../../components/buddy/Buddy";
import { openUrl } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";

const REPOSITORY = "https://github.com/white-box-io/koe";
const CREDITS = "https://github.com/hexgrad/kokoro";

export function AboutTab() {
  const { state } = useKoe();
  return (
    <>
      <div className="about">
        <Buddy face="hehe" size={52} alive />
        <span className="about__name">Koe</span>
        <span className="about__version">Version 0.1.0 · running on {state.device === "cuda" ? "GPU" : "CPU"}</span>
      </div>
      <button className="about__link" onClick={() => openUrl(REPOSITORY)}>
        <GitFork size={14} />
        <span>Source on GitHub</span>
        <ExternalLink size={13} />
      </button>
      <button className="about__link" onClick={() => openUrl(CREDITS)}>
        <Info size={14} />
        <span>Credits & licences</span>
        <ExternalLink size={13} />
      </button>
      <span className="settings__note settings__note--center">Voice by Kokoro · Hearing by Whisper</span>
    </>
  );
}
