/** Mochi-style squircle body: a superellipse centred on (150, 150). */
function superellipse(centerX: number, centerY: number, radiusX: number, radiusY: number) {
  const steps = 96;
  const exponent = 2 / 2.7;
  const points: string[] = [];
  for (let step = 0; step < steps; step++) {
    const angle = (step / steps) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = centerX + radiusX * Math.sign(cos) * Math.abs(cos) ** exponent;
    const y = centerY + radiusY * Math.sign(sin) * Math.abs(sin) ** exponent;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join(" L")} Z`;
}

export const BODY_PATH = superellipse(150, 150, 114, 88);
