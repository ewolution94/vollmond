// The Seer: a hooded figure holding a crystal ball, an eye inside it, rays carved all around.
import { BLUE, PAPER, PINK, F, smooth, tx, almond, carve, cutout } from '../kit.mjs';
import { SEER, FINGERS } from '../figures.mjs';

export const seed = 43;

export default function draw({ halftone, rays, stars }) {
  const S = (p) => tx(p, 0.84, 40, -28);
  const at = (x, y) => [x * 0.84 + 40, y * 0.84 - 28];
  const [nx, ny] = at(SEER.nimbus[0], SEER.nimbus[1]);
  const nr = SEER.nimbus[2] * 0.84;
  const [bx, by] = at(SEER.ball[0], SEER.ball[1]);
  const br = SEER.ball[2] * 0.84;
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path d="${rays(bx, by, br + 14, 520, 40, 2.2)}" fill="${PAPER}"/>`;
  for (let i = 0; i < 5; i++) blue += `<circle cx="${F(nx)}" cy="${F(ny)}" r="${F(nr - i * 10)}" fill="none" stroke="${PAPER}" stroke-width="${F(3.4 - i * 0.4)}"/>`;
  blue += `<circle cx="${F(nx)}" cy="${F(ny)}" r="${F(nr - 52)}" fill="${BLUE}"/>`;
  blue += `<path d="${stars(12, [60, 56, 440, 256], [[nx, ny, nr + 10]])}" fill="${PAPER}"/>`;
  const hood = smooth(S(SEER.hood));
  blue += cutout(hood);
  blue += `<clipPath id="seer-hood"><path d="${hood}"/></clipPath><g clip-path="url(#seer-hood)">${carve(SEER.folds.map(S), 4)}${carve(SEER.folds.map((f) => S(f.map(([x, y]) => [x + 16, y + 8]))), 2)}</g>`;
  blue += `<path d="${smooth(S(SEER.face))}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  for (const [ex, ey] of SEER.eyes) blue += `<path d="${almond(...at(ex, ey), 9, 3.6)}" fill="${PAPER}"/>`;
  for (const h of [SEER.handL, SEER.handR]) blue += `<path d="${smooth(S(h))}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.5"/>`;
  blue += carve(FINGERS.map(S), 2.6, BLUE);
  blue += `<circle cx="${F(bx)}" cy="${F(by)}" r="${F(br)}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4"/>`;
  for (let i = 0; i < 9; i++) {
    const r = br - 6 - i * 3.2;
    blue += `<path d="M${F(bx + r * Math.cos(0.2))},${F(by + r * Math.sin(0.2))}A${F(r)},${F(r)} 0 0 1 ${F(bx + r * Math.cos(1.9))},${F(by + r * Math.sin(1.9))}" fill="none" stroke="${BLUE}" stroke-width="${F(2.6 - i * 0.22)}" stroke-linecap="round"/>`;
  }
  blue += `<path d="${almond(bx, by, 46, 16)}" fill="none" stroke="${BLUE}" stroke-width="4"/><circle cx="${F(bx)}" cy="${F(by)}" r="15" fill="${BLUE}"/><circle cx="${F(bx - 4)}" cy="${F(by - 4)}" r="4" fill="${PAPER}"/>`;

  let pink = `<path fill="${PINK}" d="${halftone([bx - br, by - br, bx + br, by + br], 6, (x, y) => (Math.hypot(x - bx, y - by) < br - 3 ? 3.4 * (1 - Math.hypot(x - bx + 20, y - by + 20) / (br * 1.6)) : 0))}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.4 * Math.max(0, 1 - Math.hypot(x - nx, y - ny) / 190))}"/>`;
  for (const [ex, ey] of SEER.eyes) pink += `<path d="${almond(...at(ex, ey), 9, 3.6)}" fill="${PINK}"/>`;
  return { blue, pink };
}
