// The back of every card: a print of moons and stars, and a medallion with the wolf before the moon.
// The whole card face (500 × 700), not just a block.
import { BLUE, PAPER, PINK, smooth, tx, circleD, star4 } from '../kit.mjs';
import { WOLF } from '../figures.mjs';

export const seed = 47;
export const whole = true;

export default function draw({ halftone }) {
  const [cx, cy] = [250, 316];
  let blue = `<defs><pattern id="back-pat" width="56" height="56" patternUnits="userSpaceOnUse"><path d="${circleD(14, 14, 8)}" fill="${BLUE}"/><path d="${circleD(18, 11, 7.5)}" fill="${PAPER}"/><path d="${star4(42, 42, 6)}" fill="${BLUE}"/><circle cx="42" cy="14" r="1.6" fill="${BLUE}"/><circle cx="14" cy="42" r="1.6" fill="${BLUE}"/></pattern></defs>`;
  blue += `<rect x="0" y="0" width="500" height="700" fill="url(#back-pat)"/>`;
  blue += `<circle cx="${cx}" cy="${cy}" r="168" fill="${PAPER}" stroke="${BLUE}" stroke-width="12"/><circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${BLUE}" stroke-width="3"/>`;
  // A ring where a printed motto would go: small dots and tiny stars by turns, no words, so no font
  // is needed.
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * 140, y = cy + Math.sin(a) * 140;
    blue += i % 2
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${BLUE}"/>`
      : `<path d="${star4(0, 0, 6)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})" fill="${BLUE}"/>`;
  }
  const wolf = smooth(tx(WOLF, 0.36, cx - 92, cy - 156));
  blue += `<clipPath id="back-medal"><circle cx="${cx}" cy="${cy}" r="128"/></clipPath><g clip-path="url(#back-medal)"><path d="${wolf}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/><path d="${wolf}" fill="${BLUE}"/></g>`;
  let pink = `<circle cx="${cx + 22}" cy="${cy - 18}" r="74" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 640], 8, (x, y) => (Math.hypot(x - cx, y - cy) > 172 ? 2.6 * Math.max(0, 1 - Math.abs(y - 330) / 330) : 0))}"/>`;
  return { blue, pink, block: [40, 40, 460, 640] };
}
