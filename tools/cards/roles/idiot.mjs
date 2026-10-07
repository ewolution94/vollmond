// The Village Idiot: a grinning fool in a three-pointed cap with bells, a harlequin collar.
import { BLUE, PAPER, PINK, F, smooth, polyD, carve, cutout } from '../kit.mjs';

export const seed = 71;

const [fx, fy] = [250, 318]; // the face's centre
const BELLS = [[90, 302, 24], [358, 76, 24], [412, 302, 24]];

const SHOULDERS = [[36, 560, 1], [48, 500], [86, 458], [168, 428], [212, 412], [250, 408], [288, 412], [332, 428], [414, 458], [452, 500], [464, 560, 1]];
// the cap: the band over the brow and three floppy points
const CAP = [
  [fx - 84, fy - 30, 1], [fx - 104, fy - 78], [140, 196], [98, 230], [84, 280, 1], [114, 252], [150, 236], [fx - 64, fy - 92],
  [fx - 44, fy - 150], [fx - 6, 140], [240, 104], [290, 72], [342, 66, 1], [306, 94], [276, 126], [fx + 20, fy - 150], [fx + 56, fy - 98],
  [352, 236], [388, 252], [418, 280, 1], [404, 230], [360, 196], [fx + 104, fy - 78], [fx + 84, fy - 30, 1],
];
const FACE = [[fx - 70, fy - 36, 1], [fx, fy - 46], [fx + 70, fy - 36, 1], [fx + 74, fy + 10], [fx + 58, fy + 56], [fx + 26, fy + 84], [fx, fy + 90], [fx - 26, fy + 84], [fx - 58, fy + 56], [fx - 74, fy + 10]];

export default function draw({ halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // a harlequin lattice cut into the sky
  let lat = '';
  for (let k = -560; k < 560; k += 52) {
    lat += `M${k},40L${k + 520},560M${k + 520},40L${k},560`;
  }
  blue += `<path d="${lat}" stroke="${PAPER}" stroke-width="1.6" fill="none"/>`;
  blue += `<path d="${stars(8, [56, 56, 444, 380], [[fx, fy - 60, 170], ...BELLS.map(([x, y]) => [x, y, 50])])}" fill="${PAPER}"/>`;

  const sh = smooth(SHOULDERS);
  blue += cutout(sh);
  // the collar: a ruff of points round the neck, a diamond cut into each
  const [kx, ky, n] = [250, 404, 11];
  const ring = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (0.03 + (0.94 * i) / n);
    ring.push([kx + Math.cos(a) * 150, ky + Math.sin(a) * 56, 1]);
    if (i < n) {
      const b = Math.PI * (0.03 + (0.94 * (i + 0.5)) / n);
      ring.push([kx + Math.cos(b) * 204, ky + Math.sin(b) * 100, 1]);
    }
  }
  const collar = smooth([[kx - 150, ky + 4], [kx - 90, ky - 16], [kx, ky - 24], [kx + 90, ky - 16], ...ring], true, 0.16);
  blue += cutout(collar, 7);
  // every other point cut away to paper (pink in print), the others carved with a line: motley
  const diamonds = [];
  for (let i = 0; i < n; i++) {
    const v1 = ring[2 * i], t = ring[2 * i + 1], v2 = ring[2 * i + 2];
    const inner = [kx + (v1[0] + v2[0] - 2 * kx) * 0.36, ky - 6 + (v1[1] + v2[1] - 2 * ky) * 0.2];
    const c = [(v1[0] + v2[0] + t[0] + inner[0]) / 4, (v1[1] + v2[1] + t[1] + inner[1]) / 4];
    const k = (p, f) => [c[0] + (p[0] - c[0]) * f, c[1] + (p[1] - c[1]) * f];
    if (i % 2 === 0) diamonds.push(polyD([k(inner, 0.74), k(v1, 0.74), k(t, 0.74), k(v2, 0.74)]));
    else blue += carve([[k(inner, 0.6), c, k(t, 0.7)]], 2.4);
  }
  blue += `<path d="${diamonds.join('')}" fill="${PAPER}"/>`;

  // the cap's points, the bells hanging from their tips
  const cap = smooth(CAP, true, 0.18);
  blue += cutout(cap, 9);
  blue += `<clipPath id="idiot-cap"><path d="${cap}"/></clipPath><g clip-path="url(#idiot-cap)">`;
  // the right half striped, the left plain: motley in one ink
  let stripes = '';
  for (let k = 0; k < 400; k += 12) stripes += `M${fx + 4 + k},40L${fx + 4 + k - 220},440`;
  blue += `<clipPath id="idiot-half"><path d="M${fx + 2},0H500V700H${fx + 2}Z"/></clipPath><path clip-path="url(#idiot-half)" d="${stripes}" stroke="${PAPER}" stroke-width="3" fill="none"/>`;
  blue += `<path d="M${fx},${fy - 40}C${fx - 6},${fy - 110} ${fx - 10},170 ${fx + 4},100" fill="none" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `</g>`;
  // the band over the brow
  const band = `M${fx - 86},${fy - 30}C${fx - 40},${fy - 54} ${fx + 40},${fy - 54} ${fx + 86},${fy - 30}L${fx + 80},${fy - 10}C${fx + 40},${fy - 32} ${fx - 40},${fy - 32} ${fx - 80},${fy - 10}Z`;
  blue += cutout(band, 6);
  for (let i = -3; i <= 3; i++) blue += `<circle cx="${fx + i * 22}" cy="${F(fy - 30 - (9 - i * i) * 1.2)}" r="3.6" fill="${PAPER}"/>`;

  // the face: squeezed-shut eyes, a round nose, a huge grin
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  blue += carve([[[fx - 46, fy + 4], [fx - 32, fy - 10], [fx - 16, fy + 4]], [[fx + 16, fy + 4], [fx + 32, fy - 10], [fx + 46, fy + 4]]], 4);
  blue += carve([[[fx - 52, fy - 16], [fx - 34, fy - 26], [fx - 16, fy - 20]], [[fx + 16, fy - 20], [fx + 34, fy - 26], [fx + 52, fy - 16]]], 2.6);
  blue += `<circle cx="${fx}" cy="${fy + 20}" r="13" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  const grin = `M${fx - 52},${fy + 38}C${fx - 30},${fy + 50} ${fx + 30},${fy + 50} ${fx + 52},${fy + 38}C${fx + 44},${fy + 84} ${fx - 44},${fy + 84} ${fx - 52},${fy + 38}Z`;
  blue += `<path d="${grin}" fill="${PAPER}"/>`;
  blue += `<path d="M${fx - 44},${fy + 52}C${fx - 20},${fy + 58} ${fx + 20},${fy + 58} ${fx + 44},${fy + 52}" fill="none" stroke="${BLUE}" stroke-width="2.6"/>`;
  for (const x of [-26, -10, 8, 24]) blue += `<path d="M${fx + x},${fy + 46}V${fy + 56}" stroke="${BLUE}" stroke-width="2.4"/>`;
  for (const s of [-1, 1]) blue += `<path d="M${fx + s * 56},${fy + 34}q${s * 8},4 ${s * 6},14" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>`;
  for (const s of [-1, 1]) blue += `<circle cx="${fx + s * 48}" cy="${fy + 26}" r="9" fill="none" stroke="${PAPER}" stroke-width="2" stroke-dasharray="3 3"/>`;

  // the bells
  let bells = '';
  for (const [x, y, r] of BELLS) bells += `M${x - r},${y}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0Z`;
  blue += `<path d="${bells}" fill="${PAPER}" stroke="${PAPER}" stroke-width="8"/><path d="${bells}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4"/>`;
  for (const [x, y, r] of BELLS) blue += `<path d="M${x - r + 3},${y}H${x + r - 3}" stroke="${BLUE}" stroke-width="3"/><circle cx="${x}" cy="${y + r * 0.45}" r="4" fill="${BLUE}"/><path d="M${x - r * 0.5},${y - r * 0.55}a${r * 0.6},${r * 0.6} 0 0 1 ${r * 0.5},-${r * 0.25}" fill="none" stroke="${BLUE}" stroke-width="2"/>`;

  let pink = `<path d="${bells}" fill="${PINK}"/><path d="${diamonds.join('')}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => {
    let v = 0;
    for (const [bx, by] of BELLS) v = Math.max(v, 3.6 * Math.max(0, 1 - Math.hypot(x - bx, y - by) / 130));
    return v;
  })}"/>`;
  return { blue, pink };
}
