import gsap from "gsap";
import { useEffect, useId, useRef } from "react";
import { currentLevel } from "../../lib/levels";
import { BODY_PATH } from "./bodyPath";
import { FACES, type FaceName } from "./faces";
import "./buddy.css";
type BuddyProps = {
  face: FaceName;
  size?: number;
  alive?: boolean;
  squashKey?: number;
};

export function Buddy({ face, size = 30, alive = false, squashKey = 0 }: BuddyProps) {
  const id = useId().replace(/:/g, "");
  const root = useRef<SVGGElement>(null);
  const squashLayer = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const mouth = useRef<SVGGElement>(null);
  const { eyes: eyeShapes, mouth: mouthShape, extras } = FACES[face];

  useBobAndBlink(root, eyes, alive);
  useFaceChangePop(root, face, alive);
  useSquash(squashLayer, squashKey);
  useTalkingMouth(mouth, alive && face === "speaking");
  useWanderingPupils(eyes, alive && face === "thinking");

  return (
    <svg className="buddy" width={size} height={(size * 200) / 240} viewBox="30 50 240 200" aria-hidden>
      <defs>
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
          <path d={BODY_PATH} fill={`url(#${id}-skin)`} />
          <path d={BODY_PATH} fill={`url(#${id}-shine)`} />
          <g ref={eyes}>{eyeShapes}</g>
          <g ref={mouth}>{mouthShape}</g>
          {extras}
        </g>
      </g>
    </svg>
  );
}

type GroupRef = React.RefObject<SVGGElement | null>;

function useBobAndBlink(root: GroupRef, eyes: GroupRef, alive: boolean) {
  useEffect(() => {
    if (!alive) return;
    const bob = gsap.fromTo(root.current, { y: 2 }, { y: -2, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    let blinkTimer = 0;
    const blink = () => {
      gsap.fromTo(eyes.current, { scaleY: 1 }, { scaleY: 0.08, svgOrigin: "150 146", duration: 0.07, yoyo: true, repeat: 1 });
      blinkTimer = window.setTimeout(blink, 2500 + Math.random() * 3000);
    };
    blinkTimer = window.setTimeout(blink, 1500);
    return () => {
      bob.kill();
      clearTimeout(blinkTimer);
    };
  }, [root, eyes, alive]);
}

function useFaceChangePop(root: GroupRef, face: FaceName, alive: boolean) {
  useEffect(() => {
    if (!alive) return;
    gsap.fromTo(root.current, { scale: 0.88 }, { scale: 1, svgOrigin: "150 150", duration: 0.45, ease: "back.out(3)" });
  }, [root, face, alive]);
}

function useSquash(root: GroupRef, squashKey: number) {
  useEffect(() => {
    if (!squashKey) return;
    gsap
      .timeline()
      .to(root.current, { scaleX: 1.16, scaleY: 0.82, svgOrigin: "150 238", duration: 0.08, ease: "power2.out" })
      .to(root.current, { scaleX: 1, scaleY: 1, svgOrigin: "150 238", duration: 0.6, ease: "elastic.out(1.2, 0.35)" });
  }, [root, squashKey]);
}

function useTalkingMouth(mouth: GroupRef, active: boolean) {
  useEffect(() => {
    if (!active) {
      gsap.set(mouth.current, { scaleY: 1, svgOrigin: "150 170" });
      return;
    }
    let frame = 0;
    const tick = () => {
      gsap.to(mouth.current, { scaleY: 0.45 + currentLevel("voice") * 1.4, svgOrigin: "150 170", duration: 0.08, overwrite: true });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mouth, active]);
}

function useWanderingPupils(eyes: GroupRef, active: boolean) {
  useEffect(() => {
    if (!active || !eyes.current) return;
    const pupils = eyes.current.querySelectorAll(".buddy-pupil");
    const wander = gsap.to(pupils, { x: -18, duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1, repeatDelay: 0.4 });
    return () => {
      wander.kill();
    };
  }, [eyes, active]);
}
