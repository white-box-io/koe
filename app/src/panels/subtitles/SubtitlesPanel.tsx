import { Panel } from "../../components/panel/Panel";
import { useKoe } from "../../state/KoeProvider";
import "./subtitles.css";

/** Each word lights up when the voice should reach it, guessed from its position in the text. */
function wordTimings(text: string, seconds: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const totalLetters = words.join("").length || 1;
  let lettersBefore = 0;
  return words.map((word) => {
    const delay = (lettersBefore / totalLetters) * seconds;
    lettersBefore += word.length;
    return { word, delay };
  });
}

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
            {wordTimings(state.sentence.text, state.sentence.seconds).map(({ word, delay }, index) => (
              <span key={index} className="subtitle__word" style={{ animationDelay: `${delay}s` }}>
                {word}{" "}
              </span>
            ))}
          </span>
        </div>
      )}
    </Panel>
  );
}
