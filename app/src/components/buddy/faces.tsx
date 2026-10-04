import type { ReactNode } from "react";

export type FaceName =
  | "idle"
  | "listening"
  | "thinking"
  | "blep"
  | "speaking"
  | "done"
  | "error"
  | "sleeping"
  | "stopped"
  | "bruh"
  | "hehe"
  | "love"
  | "panic";

const INK = "#2A1E2E";
const MOUTH = "#5A2A3A";

const Line = ({ d, width = 5 }: { d: string; width?: number }) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
);

const Blush = ({ strength = 0.55 }: { strength?: number }) => (
  <g className="buddy-blush" opacity={strength}>
    <ellipse cx="78" cy="176" rx="16" ry="8" fill="#FF9DB0" />
    <ellipse cx="222" cy="176" rx="16" ry="8" fill="#FF9DB0" />
  </g>
);

const BigEye = ({ x }: { x: number }) => (
  <>
    <ellipse cx={x} cy="146" rx="16" ry="30" fill="url(#buddy-iris)" />
    <ellipse cx={x - 5} cy="134" rx="6.5" ry="8.5" fill="#fff" />
    <circle cx={x + 6} cy="159" r="3.4" fill="#fff" />
  </>
);

const LookingUpEye = ({ x }: { x: number }) => (
  <g className="buddy-pupil">
    <ellipse cx={x} cy="146" rx="15" ry="22" fill="url(#buddy-iris)" />
    <ellipse cx={x + 4} cy="134" rx="5" ry="6" fill="#fff" />
  </g>
);

const Heart =({ x }: { x: number }) => (
  <path
    d={`M${x},158.8 C${x - 24.2},145.6 ${x - 11},128 ${x},141.2 C${x + 11},128 ${x + 24.2},145.6 ${x},158.8 Z`}
    fill="#FF4F86"
  />
);

type Face = { eyes: ReactNode; mouth: ReactNode; extras?: ReactNode };

export const FACES: Record<FaceName, Face> = {
  idle: {
    eyes: (
      <>
        <Line d="M92,142 Q110,148 128,142" />
        <Line d="M172,142 Q190,148 208,142" />
        <path d="M96,144 Q110,162 124,144 Z" fill="url(#buddy-iris)" />
        <path d="M176,144 Q190,162 204,144 Z" fill="url(#buddy-iris)" />
      </>
    ),
    mouth: <Line d="M140,176 Q145,183 150,176 Q155,183 160,176" width={3.5} />,
    extras: <Blush />,
  },
  listening: {
    eyes: (
      <>
        <BigEye x={110} />
        <BigEye x={190} />
      </>
    ),
    mouth: <circle cx="150" cy="182" r="5" fill={MOUTH} />,
    extras: <Blush />,
  },
  thinking: {
    eyes: (
      <>
        <LookingUpEye x={116} />
        <LookingUpEye x={196} />
        <Line d="M96,116 Q110,108 126,114" width={4} />
        <Line d="M176,112 Q190,106 206,112" width={4} />
      </>
    ),
    mouth: <Line d="M144,174 Q150,170 150,176 Q150,182 144,182 M150,176 Q156,172 156,178" width={3.5} />,
    extras: <Blush strength={0.6} />,
  },
  blep: {
    eyes: (
      <>
        <Line d="M94,148 Q110,138 126,148" />
        <LookingUpEye x={190} />
      </>
    ),
    mouth: (
      <>
        <path d="M150,179 Q150,194 157,194 Q164,194 162,178 Z" fill="#FF8FA3" />
        <Line d="M140,176 Q150,182 160,176" width={3.5} />
      </>
    ),
    extras: <Blush strength={0.7} />,
  },
  speaking: {
    eyes: (
      <>
        <Line d="M94,136 L120,148 L94,160" width={6} />
        <Line d="M206,136 L180,148 L206,160" width={6} />
      </>
    ),
    mouth: (
      <>
        <path d="M134,170 Q150,166 166,170 Q162,198 150,198 Q138,198 134,170 Z" fill={MOUTH} />
        <ellipse cx="150" cy="190" rx="8" ry="5" fill="#FF8FA3" />
      </>
    ),
    extras: <Blush strength={0.7} />,
  },
  done: {
    eyes: (
      <>
        <rect x="80" y="132" width="140" height="8" fill="#111" />
        <path d="M86,138 h44 v8 h-8 v8 h-28 v-8 h-8 Z" fill="#111" />
        <path d="M170,138 h44 v8 h-8 v8 h-28 v-8 h-8 Z" fill="#111" />
        <rect x="92" y="140" width="6" height="6" fill="#fff" />
        <rect x="176" y="140" width="6" height="6" fill="#fff" />
      </>
    ),
    mouth: <Line d="M138,178 Q150,188 164,174" width={3.5} />,
    extras: <Blush strength={0.4} />,
  },
  error: {
    eyes: (
      <>
        <Line d="M92,144 Q110,132 128,144" />
        <Line d="M172,144 Q190,132 208,144" />
        <path d="M102,148 C100,180 98,206 96,228 L118,228 C118,206 118,180 118,148 Z" fill="#8FD3FF" opacity="0.85" />
        <path d="M198,148 C200,180 202,206 204,228 L182,228 C182,206 182,180 182,148 Z" fill="#8FD3FF" opacity="0.85" />
      </>
    ),
    mouth: <path d="M136,186 Q150,170 164,186 Q150,180 136,186 Z" fill={MOUTH} />,
    extras: <Blush strength={0.7} />,
  },
  sleeping: {
    eyes: (
      <>
        <Line d="M94,148 Q110,158 126,148" />
        <Line d="M174,148 Q190,158 206,148" />
      </>
    ),
    mouth: <ellipse cx="148" cy="180" rx="5" ry="4" fill={MOUTH} />,
    extras: (
      <>
        <circle className="buddy-bubble" cx="170" cy="168" r="16" fill="#BFE6FF" opacity="0.6" stroke="#fff" strokeWidth="2" />
        <Blush strength={0.4} />
      </>
    ),
  },
  stopped: {
    eyes: (
      <>
        <circle cx="110" cy="146" r="9" fill={INK} />
        <circle cx="190" cy="146" r="9" fill={INK} />
        <circle cx="107" cy="143" r="3" fill="#fff" />
        <circle cx="187" cy="143" r="3" fill="#fff" />
      </>
    ),
    mouth: <ellipse cx="150" cy="184" rx="10" ry="8" fill={MOUTH} />,
  },
  bruh: {
    eyes: (
      <>
        <Line d="M92,146 L128,146" />
        <Line d="M172,146 L208,146" />
        <path d="M94,146 Q110,158 126,146 Z" fill="url(#buddy-iris)" />
        <path d="M174,146 Q190,158 206,146 Z" fill="url(#buddy-iris)" />
      </>
    ),
    mouth: <Line d="M140,180 L160,180" width={3.5} />,
    extras: <path d="M76,116 C68,128 68,136 76,138 C84,136 84,128 76,116 Z" fill="#8FD3FF" stroke="#fff" strokeWidth="1.5" />,
  },
  hehe: {
    eyes: (
      <>
        <Line d="M92,152 Q110,136 128,152" />
        <Line d="M172,152 Q190,136 208,152" />
      </>
    ),
    mouth: <Line d="M134,174 Q142,182 150,174 Q158,182 166,174" width={3.5} />,
    extras: <Blush strength={0.8} />,
  },
  love: {
    eyes: (
      <>
        <Heart x={110} />
        <Heart x={190} />
      </>
    ),
    mouth: <Line d="M140,178 Q145,185 150,178 Q155,185 160,178" width={3.5} />,
    extras: <Blush strength={0.85} />,
  },
  panic: {
    eyes: (
      <>
        <ellipse cx="110" cy="142" rx="17" ry="20" fill="#fff" stroke={INK} strokeWidth="3" />
        <ellipse cx="190" cy="142" rx="17" ry="20" fill="#fff" stroke={INK} strokeWidth="3" />
      </>
    ),
    mouth: <path d="M124,166 Q150,160 176,166 Q170,210 150,210 Q130,210 124,166 Z" fill={MOUTH} />,
  },
};
