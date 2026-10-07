// Cupid: a heart pierced by an arrow, with two spread wings.
import { BLUE, PAPER, PINK, F, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 59;

const [hx, hy, hr] = [250, 316, 104]; // the heart

/** A full heart, its point at the bottom. */
const fullHeart = (x, y, r) => `M${F(x)},${F(y + 0.98 * r)}C${F(x - 0.24 * r)},${F(y + 0.72 * r)} ${F(x - 1.06 * r)},${F(y + 0.24 * r)} ${F(x - r)},${F(y - 0.32 * r)}C${F(x - 0.94 * r)},${F(y - 0.9 * r)} ${F(x - 0.24 * r)},${F(y - 1.04 * r)} ${F(x)},${F(y - 0.52 * r)}C${F(x + 0.24 * r)},${F(y - 1.04 * r)} ${F(x + 0.94 * r)},${F(y - 0.9 * r)} ${F(x + r)},${F(y - 0.32 * r)}C${F(x + 1.06 * r)},${F(y + 0.24 * r)} ${F(x + 0.24 * r)},${F(y + 0.72 * r)} ${F(x)},${F(y + 0.98 * r)}Z`;

/** One wing (the left; the right is its mirror): rows of feathers hanging from the wing's arm. */
function wing(mirror) {
  const M = (x) => (mirror ? 500 - x : x);
  // the arm: from the root behind the heart up to the wrist in the top corner
  const arm = (t) => [206 - 156 * t + 30 * Math.sin(Math.PI * t), 262 - 178 * t - 14 * Math.sin(Math.PI * t)];
  let out = '';
  const rows = [
    // [feathers, length at the root, length at the wrist, width, angle at the root, angle at the wrist]
    [9, 120, 196, 30, 92, 172],
    [8, 80, 120, 30, 96, 160],
    [7, 46, 64, 28, 100, 150],
  ];
  for (const [n, l0, l1, w, a0, a1] of rows) {
    for (let i = n - 1; i >= 0; i--) {
      const t = 0.04 + (i / (n - 1)) * 0.9;
      const [ax, ay] = arm(t);
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const len = l0 + (l1 - l0) * t;
      const pts = [0, 0.3, 0.62, 0.86, 1].map((s, k) => {
        const px = ax + Math.cos(a) * len * s - Math.sin(a) * len * 0.1 * s * s;
        const py = ay + Math.sin(a) * len * s + Math.cos(a) * len * 0.1 * s * s;
        return [M(px), py, [w * 0.7, w, w, w * 0.72, 3][k]];
      });
      out += `<path d="${limb(pts, true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4.5" stroke-linejoin="round"/>`;
      out += carve([pts.slice(1, 4)], 2);
    }
  }
  const band = [0, 0.25, 0.5, 0.75, 0.97].map((t, k) => [...arm(t), [40, 40, 34, 26, 8][k]]).map(([x, y, w]) => [M(x), y, w]);
  out += `<path d="${limb(band, true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5" stroke-linejoin="round"/>`;
  out += carve([[0.08, 0.3, 0.55, 0.8].map((t) => { const [x, y] = arm(t); return [M(x), y + 4]; })], 2.4);
  return out;
}

export default function draw({ rays, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path d="${rays(hx, hy - 20, hr + 10, 560, 48, 2.2)}" fill="${PAPER}"/>`;
  blue += `<path d="${stars(14, [56, 56, 444, 540], [[hx, hy, 170], [100, 200, 90], [400, 200, 90]])}" fill="${PAPER}"/>`;
  blue += wing(false) + wing(true);

  // the arrow: through the heart from lower left to upper right
  const [t0, t1] = [[96, 506], [418, 150]];
  const ang = Math.atan2(t1[1] - t0[1], t1[0] - t0[0]);
  const along = (s, o) => [t0[0] + Math.cos(ang) * s - Math.sin(ang) * o, t0[1] + Math.sin(ang) * s + Math.cos(ang) * o];
  const L = Math.hypot(t1[0] - t0[0], t1[1] - t0[1]);
  const shaft = polyD([along(-10, -5.5), along(L - 30, -5.5), along(L - 30, 5.5), along(-10, 5.5)]);
  blue += cutout(shaft, 8);
  const head = polyD([along(L - 44, -22), along(L + 8, 0), along(L - 44, 22), along(L - 32, 0)]);
  blue += `<path d="${head}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${head}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4" stroke-linejoin="round"/>`;
  blue += `<path d="M${along(L - 34, 0).map(F)}L${along(L - 2, 0).map(F)}" stroke="${BLUE}" stroke-width="2.6"/>`;
  let fletch = '';
  for (const s of [0, 22, 44]) fletch += polyD([along(s, -4), along(s + 34, -4), along(s + 18, -22), along(s - 12, -22)]) + polyD([along(s, 4), along(s + 34, 4), along(s + 18, 22), along(s - 12, 22)]);
  blue += `<path d="${fletch}" fill="${PAPER}" stroke="${PAPER}" stroke-width="8" stroke-linejoin="round"/><path d="${fletch}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;

  const h = fullHeart(hx, hy, hr);
  blue += `<path d="${h}" fill="${PAPER}" stroke="${PAPER}" stroke-width="12"/><path d="${h}" fill="${PAPER}" stroke="${BLUE}" stroke-width="5"/>`;
  // shading: the heart's outline repeated inward on its lower right, as on the seer's ball
  blue += `<clipPath id="cupid-shade"><path d="M${hx - 140},${hy + 40}L${hx + 60},${hy - 160}L${hx + 200},${hy - 160}L${hx + 200},${hy + 200}L${hx - 140},${hy + 200}Z"/></clipPath><g clip-path="url(#cupid-shade)">`;
  for (let i = 0; i < 8; i++) blue += `<path d="${fullHeart(hx - i * 1.2, hy - i * 2.2, hr - 9 - i * 4.2)}" fill="none" stroke="${BLUE}" stroke-width="${F(2.6 - i * 0.22)}"/>`;
  blue += `</g>`;

  const shine = `M${hx - 74},${hy - 26}C${hx - 80},${hy - 66} ${hx - 52},${hy - 84} ${hx - 26},${hy - 70}C${hx - 50},${hy - 66} ${hx - 64},${hy - 50} ${hx - 74},${hy - 26}Z`;
  let pink = `<path d="${h}${shine}" fill="${PINK}" fill-rule="evenodd"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - hx, y - hy) / 230))}"/>`;
  return { blue, pink };
}
