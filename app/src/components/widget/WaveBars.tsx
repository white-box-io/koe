import { useEffect, useRef } from "react";
import { currentLevel } from "../../lib/levels";
import "./wave.css";

const BAR_COUNT = 13;

type WaveBarsProps = { source: "mic" | "voice"; tone: "coral" | "blue" };

export function WaveBars({ source, tone }: WaveBarsProps) {
  const bars = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let smoothed = 0;
    const draw = (time: number) => {
      smoothed += (currentLevel(source) - smoothed) * 0.35;
      const children = bars.current?.children ?? [];
      for (let index = 0; index < children.length; index++) {
        const middleWeight = 1 - (Math.abs(index - BAR_COUNT / 2) / (BAR_COUNT / 2)) * 0.6;
        const ripple = 0.5 + 0.5 * Math.sin(time / 110 + index * 0.9);
        const height = Math.max(3, 22 * (0.12 + smoothed * 0.88) * ripple * middleWeight);
        (children[index] as HTMLElement).style.height = `${height}px`;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [source]);

  return (
    <div ref={bars} className={`wave wave--${tone}`}>
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span key={index} className="wave__bar" />
      ))}
    </div>
  );
}
