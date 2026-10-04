import type { ReactNode } from "react";
import { BODY_PATH } from "./bodyPath";
import { FACES, type FaceName } from "./faces";
import yukiBase from "./yuki/yuki-base.svg";
import { YUKI_FACES } from "./yuki/yukiFaces";

type Face = { eyes: ReactNode; mouth: ReactNode; extras?: ReactNode };

/** Points (in the character's own SVG units) that each animation scales around. */
type Origins = { blink: string; mouth: string; pop: string; squash: string };

export type Character = {
  id: string;
  name: string;
  viewBox: string;
  aspect: number;
  faces: Record<FaceName, Face>;
  origins: Origins;
  Base: (props: { gradientId: string }) => ReactNode;
};

const AnimeBuddyBody = ({ gradientId }: { gradientId: string }) => (
  <>
    <path d={BODY_PATH} fill={`url(#${gradientId}-skin)`} />
    <path d={BODY_PATH} fill={`url(#${gradientId}-shine)`} />
  </>
);

const YukiHead = () => <image href={yukiBase} x={0} y={0} width={400} height={380} />;

export const CHARACTERS: Character[] = [
  {
    id: "anime-buddy",
    name: "Anime Buddy",
    viewBox: "30 50 240 200",
    aspect: 200 / 240,
    faces: FACES,
    origins: { blink: "150 146", mouth: "150 170", pop: "150 150", squash: "150 238" },
    Base: AnimeBuddyBody,
  },
  {
    id: "yuki",
    name: "Yuki",
    viewBox: "92 108 220 183",
    aspect: 183 / 220,
    faces: YUKI_FACES,
    origins: { blink: "202 228", mouth: "202 274", pop: "202 210", squash: "202 300" },
    Base: YukiHead,
  },
];

export function characterById(id: string | undefined): Character {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}
