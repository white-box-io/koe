import type { ReactNode } from "react";
import type { FaceName } from "../faces";

const INK = "#3A3040";
const MOUTH = "#7A3A4A";
const TONGUE = "#FF8FA3";
const LEFT = 146;
const RIGHT = 258;
const EYE_Y = 228;
const MOUTH_X = 202;
const MOUTH_Y = 274;

const Line = ({ d, width = 4 }: { d: string; width?: number }) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
);

const Sparkle = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <path
    d={`M${x},${y - size} Q${x},${y} ${x + size},${y} Q${x},${y} ${x},${y + size} Q${x},${y} ${x - size},${y} Q${x},${y} ${x},${y - size} Z`}
    fill="#fff"
  />
);

type EyeProps = { x: number; width?: number; height?: number; shiftY?: number; lid?: boolean };

const SparklyEye = ({ x, width = 15, height = 19, shiftY = 0, lid = true }: EyeProps) => {
  const y = EYE_Y + shiftY;
  return (
    <g className="buddy-pupil">
      <ellipse cx={x} cy={y} rx={width} ry={height} fill="url(#yuki-iris)" />
      <ellipse cx={x} cy={y + height * 0.35} rx={width * 0.55} ry={height * 0.35} fill="#C9B6FF" opacity={0.55} />
      <ellipse cx={x - width * 0.32} cy={y - height * 0.4} rx={width * 0.42} ry={height * 0.34} fill="#fff" />
      <circle cx={x + width * 0.4} cy={y + height * 0.38} r={width * 0.18} fill="#fff" />
      <Sparkle x={x + width * 0.45} y={y - height * 0.5} size={width * 0.22} />
      {lid && (
        <>
          <Line d={`M${x - width - 5},${y - height + 4} Q${x},${y - height - 6} ${x + width + 6},${y - height + 2}`} width={4.5} />
          <Line d={`M${x + width + 2},${y - height + 3} L${x + width + 9},${y - height - 2}`} width={3.5} />
        </>
      )}
    </g>
  );
};

const HappyEye = ({ x }: { x: number }) => <Line d={`M${x - 15},${EYE_Y + 5} Q${x},${EYE_Y - 12} ${x + 15},${EYE_Y + 5}`} width={5} />;

const ClosedEye = ({ x }: { x: number }) => <Line d={`M${x - 15},${EYE_Y} Q${x},${EYE_Y + 10} ${x + 15},${EYE_Y}`} width={4.5} />;

const HeartEye = ({ x }: { x: number }) => (
  <>
    <path
      d={`M${x},${EYE_Y + 15} C${x - 25},${EYE_Y + 1} ${x - 13},${EYE_Y - 18} ${x},${EYE_Y - 4} C${x + 13},${EYE_Y - 18} ${x + 25},${EYE_Y + 1} ${x},${EYE_Y + 15} Z`}
      fill="#FF4F86"
    />
    <Sparkle x={x - 7} y={EYE_Y - 4} size={4} />
  </>
);

const Tear = ({ x }: { x: number }) => (
  <path
    d={`M${x - 7},${EYE_Y + 12} C${x - 9},${EYE_Y + 32} ${x - 11},${EYE_Y + 50} ${x - 13},${EYE_Y + 64} L${x + 4},${EYE_Y + 64} C${x + 4},${EYE_Y + 50} ${x + 4},${EYE_Y + 32} ${x + 7},${EYE_Y + 12} Z`}
    fill="#8FD3FF"
    opacity={0.85}
  />
);

const CatMouth = ({ spread = 8 }: { spread?: number }) => (
  <Line
    d={`M${MOUTH_X - spread},${MOUTH_Y} Q${MOUTH_X - spread / 2},${MOUTH_Y + 5} ${MOUTH_X},${MOUTH_Y} Q${MOUTH_X + spread / 2},${MOUTH_Y + 5} ${MOUTH_X + spread},${MOUTH_Y}`}
    width={3}
  />
);

const OpenMouth = ({ size = 12 }: { size?: number }) => (
  <path
    d={`M${MOUTH_X - size},${MOUTH_Y - 4} Q${MOUTH_X},${MOUTH_Y - 7} ${MOUTH_X + size},${MOUTH_Y - 4} Q${MOUTH_X + size * 0.75},${MOUTH_Y + size + 4} ${MOUTH_X},${MOUTH_Y + size + 4} Q${MOUTH_X - size * 0.75},${MOUTH_Y + size + 4} ${MOUTH_X - size},${MOUTH_Y - 4} Z`}
    fill={MOUTH}
  />
);

const Sunglasses = () => (
  <>
    <rect x={LEFT - 28} y={EYE_Y - 12} width={RIGHT - LEFT + 56} height={7} fill="#151218" />
    <path d={`M${LEFT - 24},${EYE_Y - 7} h46 v9 h-7 v7 h-32 v-7 h-7 Z`} fill="#151218" />
    <path d={`M${RIGHT - 22},${EYE_Y - 7} h46 v9 h-7 v7 h-32 v-7 h-7 Z`} fill="#151218" />
    <rect x={LEFT - 15} y={EYE_Y - 4} width={7} height={6} fill="#fff" />
    <rect x={RIGHT - 13} y={EYE_Y - 4} width={7} height={6} fill="#fff" />
  </>
);

type Face = { eyes: ReactNode; mouth: ReactNode; extras?: ReactNode };

export const YUKI_FACES: Record<FaceName, Face> = {
  idle: {
    eyes: (
      <>
        <SparklyEye x={LEFT} />
        <SparklyEye x={RIGHT} />
      </>
    ),
    mouth: <CatMouth />,
  },
  listening: {
    eyes: (
      <>
        <SparklyEye x={LEFT} width={17} height={22} />
        <SparklyEye x={RIGHT} width={17} height={22} />
      </>
    ),
    mouth: <ellipse cx={MOUTH_X} cy={MOUTH_Y + 3} rx={5} ry={6} fill={MOUTH} />,
  },
  thinking: {
    eyes: (
      <>
        <SparklyEye x={LEFT} width={14} height={18} shiftY={-3} />
        <SparklyEye x={RIGHT} width={14} height={18} shiftY={-3} />
        <Line d={`M${LEFT - 16},${EYE_Y - 30} Q${LEFT},${EYE_Y - 38} ${LEFT + 16},${EYE_Y - 32}`} width={3.5} />
        <Line d={`M${RIGHT - 16},${EYE_Y - 34} Q${RIGHT},${EYE_Y - 40} ${RIGHT + 16},${EYE_Y - 33}`} width={3.5} />
      </>
    ),
    mouth: (
      <Line
        d={`M${MOUTH_X - 4},${MOUTH_Y - 4} Q${MOUTH_X + 2},${MOUTH_Y - 7} ${MOUTH_X + 2},${MOUTH_Y - 1} Q${MOUTH_X + 2},${MOUTH_Y + 5} ${MOUTH_X - 4},${MOUTH_Y + 5} M${MOUTH_X + 2},${MOUTH_Y - 1} Q${MOUTH_X + 8},${MOUTH_Y - 5} ${MOUTH_X + 8},${MOUTH_Y + 1}`}
        width={3}
      />
    ),
  },
  speaking: {
    eyes: (
      <>
        <Line d={`M${LEFT - 14},${EYE_Y - 10} L${LEFT + 9},${EYE_Y} L${LEFT - 14},${EYE_Y + 10}`} width={5} />
        <Line d={`M${RIGHT + 14},${EYE_Y - 10} L${RIGHT - 9},${EYE_Y} L${RIGHT + 14},${EYE_Y + 10}`} width={5} />
      </>
    ),
    mouth: (
      <>
        <OpenMouth />
        <ellipse cx={MOUTH_X} cy={MOUTH_Y + 10} rx={6} ry={4} fill={TONGUE} />
      </>
    ),
  },
  done: {
    eyes: <Sunglasses />,
    mouth: <Line d={`M${MOUTH_X - 9},${MOUTH_Y} Q${MOUTH_X},${MOUTH_Y + 7} ${MOUTH_X + 10},${MOUTH_Y - 3}`} width={3} />,
  },
  error: {
    eyes: (
      <>
        <SparklyEye x={LEFT} height={17} lid={false} />
        <SparklyEye x={RIGHT} height={17} lid={false} />
        <Line d={`M${LEFT - 16},${EYE_Y - 22} Q${LEFT},${EYE_Y - 30} ${LEFT + 14},${EYE_Y - 20}`} width={3.5} />
        <Line d={`M${RIGHT - 14},${EYE_Y - 20} Q${RIGHT},${EYE_Y - 30} ${RIGHT + 16},${EYE_Y - 22}`} width={3.5} />
      </>
    ),
    mouth: (
      <path
        d={`M${MOUTH_X - 10},${MOUTH_Y + 6} Q${MOUTH_X},${MOUTH_Y - 6} ${MOUTH_X + 10},${MOUTH_Y + 6} Q${MOUTH_X},${MOUTH_Y + 2} ${MOUTH_X - 10},${MOUTH_Y + 6} Z`}
        fill={MOUTH}
      />
    ),
    extras: (
      <>
        <Tear x={LEFT} />
        <Tear x={RIGHT} />
      </>
    ),
  },
  sleeping: {
    eyes: (
      <>
        <ClosedEye x={LEFT} />
        <ClosedEye x={RIGHT} />
      </>
    ),
    mouth: <Line d={`M${MOUTH_X - 5},${MOUTH_Y + 1} Q${MOUTH_X},${MOUTH_Y - 3} ${MOUTH_X + 5},${MOUTH_Y + 1}`} width={3} />,
  },
  stopped: {
    eyes: (
      <>
        <circle cx={LEFT} cy={EYE_Y} r={9} fill={INK} />
        <circle cx={RIGHT} cy={EYE_Y} r={9} fill={INK} />
        <circle cx={LEFT - 3} cy={EYE_Y - 3} r={3} fill="#fff" />
        <circle cx={RIGHT - 3} cy={EYE_Y - 3} r={3} fill="#fff" />
      </>
    ),
    mouth: <ellipse cx={MOUTH_X} cy={MOUTH_Y + 3} rx={7} ry={6} fill={MOUTH} />,
  },
  blep: {
    eyes: (
      <>
        <HappyEye x={LEFT} />
        <SparklyEye x={RIGHT} />
      </>
    ),
    mouth: (
      <>
        <path
          d={`M${MOUTH_X},${MOUTH_Y + 2} Q${MOUTH_X},${MOUTH_Y + 13} ${MOUTH_X + 5},${MOUTH_Y + 13} Q${MOUTH_X + 10},${MOUTH_Y + 13} ${MOUTH_X + 9},${MOUTH_Y + 1} Z`}
          fill={TONGUE}
        />
        <Line d={`M${MOUTH_X - 9},${MOUTH_Y} Q${MOUTH_X},${MOUTH_Y + 5} ${MOUTH_X + 9},${MOUTH_Y}`} width={3} />
      </>
    ),
  },
  hehe: {
    eyes: (
      <>
        <HappyEye x={LEFT} />
        <HappyEye x={RIGHT} />
      </>
    ),
    mouth: <CatMouth spread={11} />,
  },
  love: {
    eyes: (
      <>
        <HeartEye x={LEFT} />
        <HeartEye x={RIGHT} />
      </>
    ),
    mouth: <CatMouth />,
  },
  panic: {
    eyes: (
      <>
        <ellipse cx={LEFT} cy={EYE_Y} rx={15} ry={18} fill="#fff" stroke={INK} strokeWidth={3.5} />
        <ellipse cx={RIGHT} cy={EYE_Y} rx={15} ry={18} fill="#fff" stroke={INK} strokeWidth={3.5} />
        <circle cx={LEFT} cy={EYE_Y} r={3.5} fill={INK} />
        <circle cx={RIGHT} cy={EYE_Y} r={3.5} fill={INK} />
      </>
    ),
    mouth: <OpenMouth size={14} />,
  },
  bruh: {
    eyes: (
      <>
        <Line d={`M${LEFT - 15},${EYE_Y - 3} L${LEFT + 15},${EYE_Y - 3}`} width={4.5} />
        <Line d={`M${RIGHT - 15},${EYE_Y - 3} L${RIGHT + 15},${EYE_Y - 3}`} width={4.5} />
        <path d={`M${LEFT - 13},${EYE_Y - 2} Q${LEFT},${EYE_Y + 12} ${LEFT + 13},${EYE_Y - 2} Z`} fill="url(#yuki-iris)" />
        <path d={`M${RIGHT - 13},${EYE_Y - 2} Q${RIGHT},${EYE_Y + 12} ${RIGHT + 13},${EYE_Y - 2} Z`} fill="url(#yuki-iris)" />
      </>
    ),
    mouth: <Line d={`M${MOUTH_X - 8},${MOUTH_Y + 1} L${MOUTH_X + 8},${MOUTH_Y + 1}`} width={3} />,
  },
};
