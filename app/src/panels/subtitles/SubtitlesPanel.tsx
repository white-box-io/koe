import { Panel } from "../../components/panel/Panel";
import { useKoe } from "../../state/KoeProvider";
import "./subtitles.css";

export function SubtitlesPanel({ fading }: { fading: boolean }) {
  const { state } = useKoe();
  return (
    <Panel width={340} fading={fading}>
      {state.heard && (
        <div className="subtitle">
          <span className="subtitle__who subtitle__who--you">You</span>
          <span className="subtitle__text subtitle__text--you">{state.heard.text}</span>
        </div>
      )}
      {state.heard && state.sentence && <div className="subtitle__divider" />}
      {state.sentence && (
        <div className="subtitle">
          <span className="subtitle__who subtitle__who--claude">Claude</span>
          <span key={state.sentence.at} className="subtitle__text subtitle__text--claude">
            {state.sentence.text}
          </span>
        </div>
      )}
    </Panel>
  );
}
