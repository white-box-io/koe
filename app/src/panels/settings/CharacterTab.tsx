import { Buddy } from "../../components/buddy/Buddy";
import { CHARACTERS, characterById } from "../../components/buddy/characters";
import type { FaceName } from "../../components/buddy/faces";
import { useKoe } from "../../state/KoeProvider";

const EXPRESSIONS: FaceName[] = ["idle", "listening", "thinking", "speaking", "done", "love"];

export function CharacterTab() {
  const { state, updateSettings } = useKoe();
  const active = characterById(state.settings?.character);

  return (
    <>
      <div className="character-preview">
        <Buddy face="hehe" size={56} alive />
        <div className="character-preview__info">
          <span className="character-preview__name">{active.name}</span>
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
        {CHARACTERS.map((character) => {
          const isActive = character.id === active.id;
          return (
            <button
              key={character.id}
              className={`character ${isActive ? "character--on" : ""}`}
              title={character.name}
              onClick={() => updateSettings({ character: character.id })}
            >
              <Buddy face="idle" size={36} characterId={character.id} />
              <span className={`character__label ${isActive ? "character__label--on" : ""}`}>
                {isActive ? "Active" : character.name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
