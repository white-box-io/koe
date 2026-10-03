import { Buddy } from "../../components/buddy/Buddy";
import type { FaceName } from "../../components/buddy/faces";

const EXPRESSIONS: FaceName[] = ["idle", "listening", "thinking", "speaking", "done", "love"];
const COMING_SOON = ["Ribbon", "Cat ears", "Twin buns", "Star clip"];

export function CharacterTab() {
  return (
    <>
      <div className="character-preview">
        <Buddy face="hehe" size={56} alive />
        <div className="character-preview__info">
          <span className="character-preview__name">Anime Buddy</span>
          <div className="character-preview__faces">
            {EXPRESSIONS.map((face) => (
              <span key={face} className="character-preview__face" title={face}>
                <Buddy face={face} size={20} />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="characters">
        <div className="character character--on">
          <Buddy face="idle" size={36} />
          <span className="character__label character__label--on">Active</span>
        </div>
        {COMING_SOON.map((name) => (
          <div key={name} className="character" title={`${name} · coming soon`}>
            <span className="character__locked">
              <Buddy face="idle" size={36} />
            </span>
            <span className="character__label">Soon</span>
          </div>
        ))}
      </div>
    </>
  );
}
