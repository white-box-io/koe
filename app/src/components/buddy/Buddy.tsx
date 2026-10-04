import gsap from "gsap";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { currentLevel } from "../../lib/levels";
import { useKoe } from "../../state/KoeProvider";
import { characterById, type Character } from "./characters";
import type { FaceName } from "./faces";
import "./buddy.css";

type BuddyProps = {
  face: FaceName;
  size?: number;
  alive?: boolean;
  squashKey?: number;
  characterId?: string;
};

/** Shows the chosen character. Remounts on a character change so its animation origins reset. */
export function Buddy(props: BuddyProps) {
  const { state } = useKoe();
  const character = characterById(props.characterId ?? state.settings?.character);
  return <CharacterView key={character.id} character={character} {...props} />;
}

function CharacterView({ face, size = 30, alive = false, squashKey = 0, character }: BuddyProps & { character: Character }) {
  const id = useId().replace(/:/g, "");
  const root = useRef<SVGGElement>(null);
  const squashLayer = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const mouth = useRef<SVGGElement>(null);
  const { eyes: eyeShapes, mouth: mouthShape, extras } = character.faces[face];
  const { origins, Base } = character;

  useFixedOrigins(root, squashLayer, origins);
  useBobAndBlink(root, eyes, alive, origins);
  useFaceChangePop(root, face, alive);
  useSquash(squashLayer, squashKey);
  useTalkingMouth(mouth, alive && face === "speaking", origins);
  useWanderingPupils(eyes, alive && face === "thinking");

  return (
    <svg className={`buddy buddy--${character.id}`} width={size} height={size * character.aspect} viewBox={character.viewBox} aria-hidden>
      <defs>
        <linearGradient id="yuki-iris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2040" />
          <stop offset="0.45" stopColor="#4B3A8A" />
          <stop offset="1" stopColor="#A88BFF" />
        </linearGradient>
        <linearGradient id={`${id}-skin`} x1="0.85" y1="0" x2="0.1" y2="1">
          <stop offset="0" stopColor="#F6F4F8" />
          <stop offset="1" stopColor="#CFCBD6" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.67" cy="0.24" r="0.3">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="buddy-iris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A1E2E" />
          <stop offset="0.5" stopColor="#3D2A55" />
          <stop offset="1" stopColor="#8E6BD8" />
        </linearGradient>
      </defs>
      <g ref={squashLayer}>
        <g ref={root}>
          <Base gradientId={id} />
          <g ref={eyes}>{eyeShapes}</g>
          <g ref={mouth}>{mouthShape}</g>
          {extras}
        </g>
      </g>
    </svg>
  );
}

type GroupRef = React.RefObject<SVGGElement | null>;
type Origins = Character["origins"];

/** Origins are set once, before any tween, so GSAP never shifts her to compensate. */
function useFixedOrigins(root: GroupRef, squashLayer: GroupRef, origins: Origins) {
  useLayoutEffect(() => {
    gsap.set(root.current, { svgOrigin: origins.pop });
    gsap.set(squashLayer.current, { svgOrigin: origins.squash });
  }, [root, squashLayer, origins]);
}

function useBobAndBlink(root: GroupRef, eyes: GroupRef, alive: boolean, origins: Origins) {
  useEffect(() => {
    if (!alive) return;
    const bob = gsap.fromTo(root.current, { y: 2 }, { y: -2, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    let blinkTimer = 0;
    const blink = () => {
      gsap.fromTo(eyes.current, { scaleY: 1 }, { scaleY: 0.08, svgOrigin: origins.blink, duration: 0.07, yoyo: true, repeat: 1 });
      blinkTimer = window.setTimeout(blink, 2500 + Math.random() * 3000);
    };
    blinkTimer = window.setTimeout(blink, 1500);
    return () => {
      bob.kill();
      clearTimeout(blinkTimer);
    };
  }, [root, eyes, alive, origins]);
}

function useFaceChangePop(root: GroupRef, face: FaceName, alive: boolean) {
  useEffect(() => {
    if (!alive) return;
    gsap.fromTo(root.current, { scale: 0.88 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
  }, [root, face, alive]);
}

function useSquash(root: GroupRef, squashKey: number) {
  useEffect(() => {
    if (!squashKey) return;
    gsap
      .timeline()
      .to(root.current, { scaleX: 1.16, scaleY: 0.82, duration: 0.08, ease: "power2.out" })
      .to(root.current, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.2, 0.35)" });
  }, [root, squashKey]);
}

function useTalkingMouth(mouth: GroupRef, active: boolean, origins: Origins) {
  useEffect(() => {
    if (!active) {
      gsap.set(mouth.current, { scaleY: 1, svgOrigin: origins.mouth });
      return;
    }
    let frame = 0;
    const tick = () => {
      gsap.to(mouth.current, { scaleY: 0.45 + currentLevel("voice") * 1.4, svgOrigin: origins.mouth, duration: 0.08, overwrite: true });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mouth, active, origins]);
}

function useWanderingPupils(eyes: GroupRef, active: boolean) {
  useEffect(() => {
    if (!active || !eyes.current) return;
    const pupils = eyes.current.querySelectorAll(".buddy-pupil");
    const wander = gsap.to(pupils, { x: -6, y: -3, duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1, repeatDelay: 0.4 });
    return () => {
      wander.kill();
    };
  }, [eyes, active]);
}
