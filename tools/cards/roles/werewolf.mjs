// The Werewolf: a wolf howling at the full moon, its head across the moon's face.
import { BLUE, PAPER, PINK, F, smooth, tx, circleD, firs, carve, cutout } from '../kit.mjs';
import { WOLF, WOLF_EYE, WOLF_FUR } from '../figures.mjs';

export const seed = 41;

export default function draw({ lines, halftone, stars, R }) {
  const [mx, my, mr] = [304, 172, 98];
  const W = (p) => tx(p, 0.9, 0, -50);
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="werewolf-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${mx}" cy="${my}" r="${mr + 54}" fill="#000"/></mask>`;
  blue += `<path mask="url(#werewolf-sky)" fill="${PAPER}" d="${lines(52, 520, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - my) / 330) * 2.6)}"/>`;
  for (let i = 0; i < 6; i++) blue += `<circle cx="${mx}" cy="${my}" r="${mr + 10 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(3.2 - i * 0.45)}" stroke-dasharray="${F(30 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${PAPER}"/>`;
  for (const [cx, cy, r] of [[268, 144, 13], [336, 214, 18], [342, 130, 8], [282, 222, 7], [316, 168, 5]]) {
    blue += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-dasharray="${F(r * 2.4)} ${F(r * 1.2)}"/>`;
  }
  blue += `<path d="${stars(14, [60, 60, 440, 290], [[mx, my, mr + 70]])}" fill="${PAPER}"/>`;
  blue += `<path d="${firs([[402, 532, 140, 86], [452, 536, 186, 100], [358, 536, 104, 66], [90, 536, 118, 74], [500, 536, 140, 80]])}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>`;
  blue += `<path d="M30,526C150,516 330,520 470,512L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path d="${lines(534, 552, 6, () => 1.4, 40, 460)}" fill="${PAPER}"/>`;
  const wolf = smooth(W(WOLF));
  blue += cutout(wolf);
  blue += `<clipPath id="werewolf-body"><path d="${wolf}"/></clipPath><g clip-path="url(#werewolf-body)">${carve(WOLF_FUR.map(W), 3)}</g>`;
  blue += `<path d="${smooth(W(WOLF_EYE))}" fill="${PAPER}"/>`;

  let pink = `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - mx, y - my) / 230))}"/>`;
  pink += `<path d="${smooth(W(WOLF_EYE))}" fill="${PINK}"/>`;
  void circleD;
  return { blue, pink };
}
