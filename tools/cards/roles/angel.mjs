// The Angel: an angel in a plain robe, hands folded in prayer, great wings raised behind; the halo glows.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 147;

const [hx, hy, hr] = [250, 150, 60]; // the halo
const [fx, fy] = [250, 168]; // the face's centre

const ROBE = [
  [96, 560, 1], [116, 470], [140, 380], [160, 300], [176, 254], [204, 236], [232, 228], [268, 228], [296, 236], [324, 254], [340, 300], [360, 380], [384, 470], [404, 560, 1],
];
const FACE = [[fx - 38, fy - 18], [fx - 30, fy - 44], [fx, fy - 52], [fx + 30, fy - 44], [fx + 38, fy - 18], [fx + 34, fy + 14], [fx + 18, fy + 36], [fx, fy + 42], [fx - 18, fy + 36], [fx - 34, fy + 14]];
// short curls: a cap of hair with a scalloped fringe
const HAIR = [
  [fx - 44, fy + 6, 1], [fx - 48, fy - 26], [fx - 34, fy - 54], [fx, fy - 64], [fx + 34, fy - 54], [fx + 48, fy - 26], [fx + 44, fy + 6, 1],
  [fx + 36, fy - 10], [fx + 32, fy - 26, 1], [fx + 20, fy - 22], [fx + 10, fy - 34, 1], [fx, fy - 26], [fx - 10, fy - 34, 1], [fx - 20, fy - 22], [fx - 32, fy - 26, 1], [fx - 36, fy - 10],
];
// the sleeves: wide, hanging from the forearms that meet at the hands
const SLEEVE = [[188, 256, 1], [218, 300], [240, 326], [246, 352], [228, 372, 1], [190, 384], [156, 392, 1], [168, 352], [176, 300]];
const HANDS = [[250, 256, 1], [262, 274], [268, 300], [271, 328], [264, 346], [250, 352], [236, 346], [229, 328], [232, 300], [238, 274]];

/** One wing (the left; the right is its mirror), raised: rows of feathers hanging from its arm. */
function wing(mirror) {
  const M = (x) => (mirror ? 500 - x : x);
  const [r0, r1] = [[206, 262], [64, 70]];
  const arm = (t) => [r0[0] + (r1[0] - r0[0]) * t + 22 * Math.sin(Math.PI * t), r0[1] + (r1[1] - r0[1]) * t - 16 * Math.sin(Math.PI * t)];
  let out = '';
  // [feathers, length at the root, length at the wrist, width, angle at the root, angle at the wrist]
  const rows = [
    [10, 150, 340, 34, 82, 104],
    [9, 96, 196, 32, 84, 100],
    [7, 50, 92, 30, 86, 96],
  ];
  for (const [n, l0, l1, w, a0, a1] of rows) {
    for (let i = 0; i < n; i++) {
      const t = 0.06 + (i / (n - 1)) * 0.9;
      const [ax, ay] = arm(t);
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const len = l0 + (l1 - l0) * t;
      const pts = [0, 0.3, 0.62, 0.86, 1].map((s, k) => {
        const px = ax + Math.cos(a) * len * s + Math.sin(a) * len * 0.06 * s * s;
        const py = ay + Math.sin(a) * len * s;
        return [M(px), py, [w * 0.7, w, w, w * 0.72, 3][k]];
      });
      out += `<path d="${limb(pts, true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4.5" stroke-linejoin="round"/>`;
      out += carve([pts.slice(1, 4)], 2);
    }
  }
  const band = [0, 0.25, 0.5, 0.75, 0.98].map((t, k) => [...arm(t), [42, 42, 36, 28, 10][k]]).map(([x, y, w]) => [M(x), y, w]);
  out += `<path d="${limb(band, true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5" stroke-linejoin="round"/>`;
  out += carve([[0.08, 0.3, 0.55, 0.8].map((t) => { const [x, y] = arm(t); return [M(x), y + 6]; })], 2.4);
  return out;
}

export default function draw({ rays, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path d="${rays(hx, hy, hr + 20, 620, 52, 2.2)}" fill="${PAPER}"/>`;
  for (let i = 0; i < 3; i++) blue += `<circle cx="${hx}" cy="${hy}" r="${hr + 14 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(2.8 - i * 0.7)}"/>`;
  blue += `<path d="${stars(5, [140, 46, 360, 92], [[hx, hy, hr + 30]])}" fill="${PAPER}"/>`;
  blue += wing(false) + wing(true);

  const robe = smooth(ROBE);
  blue += cutout(robe);
  blue += `<clipPath id="angel-robe"><path d="${robe}"/></clipPath><g clip-path="url(#angel-robe)">`;
  blue += carve([[[250, 380], [248, 470], [250, 560]], [[214, 396], [204, 480], [196, 560]], [[286, 396], [296, 480], [304, 560]], [[176, 420], [160, 490], [146, 560]], [[324, 420], [340, 490], [354, 560]]], 3.2);
  blue += carve([[[218, 236], [250, 256], [282, 236]]], 3);
  blue += `</g>`;

  // the face, calm, eyes closed
  const hair = smooth(HAIR, true, 0.18);
  const face = smooth(FACE);
  blue += `<path d="${limb([[fx, fy + 30, 30], [fx, fy + 66, 34]], true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  blue += cutout(hair, 6);
  blue += `<clipPath id="angel-hair"><path d="${hair}"/></clipPath><g clip-path="url(#angel-hair)">`;
  for (const [x, y] of [[fx - 30, fy - 42], [fx - 8, fy - 52], [fx + 16, fy - 50], [fx + 34, fy - 36], [fx - 40, fy - 16], [fx + 40, fy - 14]]) blue += `<path d="M${x - 7},${y + 3}a7,7 0 1 1 12,4" fill="none" stroke="${PAPER}" stroke-width="2.4" stroke-linecap="round"/>`;
  blue += `</g>`;
  blue += carve([[[fx - 26, fy + 2], [fx - 16, fy + 8], [fx - 6, fy + 2]], [[fx + 6, fy + 2], [fx + 16, fy + 8], [fx + 26, fy + 2]]], 3);
  blue += carve([[[fx + 2, fy + 8], [fx + 4, fy + 20], [fx - 2, fy + 22]], [[fx - 8, fy + 30], [fx, fy + 32], [fx + 8, fy + 30]]], 2.6);

  // the arms in their sleeves, the hands folded
  const sleeves = smooth(SLEEVE) + smooth(SLEEVE.map(([x, y, c]) => [500 - x, y, c]));
  blue += cutout(sleeves, 8);
  blue += carve([[[180, 300], [200, 340], [214, 366]], [[320, 300], [300, 340], [286, 366]]], 2.6);
  const hands = smooth(HANDS);
  blue += `<path d="${hands}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${hands}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += carve([[[250, 266], [250, 296], [250, 318]], [[244, 346], [242, 330], [246, 316]], [[256, 346], [258, 330], [254, 316]], [[236, 288], [244, 284]], [[233, 304], [243, 300]], [[264, 288], [256, 284]], [[267, 304], [257, 300]]], 2.4, BLUE);

  // the halo: a ring of light behind the head
  const halo = `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="none" stroke-width="15"`;
  blue += `<mask id="angel-halo"><rect width="500" height="700" fill="#fff"/><path d="${hair}" fill="#000" stroke="#000" stroke-width="12"/></mask>`;
  blue += `<g mask="url(#angel-halo)">${halo} stroke="${PAPER}"/></g>`;

  let pink = `<mask id="angel-halo-p"><rect width="500" height="700" fill="#fff"/><path d="${hair}" fill="#000" stroke="#000" stroke-width="12"/></mask>`;
  pink += `<g mask="url(#angel-halo-p)">${halo} stroke="${PINK}"/></g>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.abs(Math.hypot(x - hx, y - hy) - hr) / 110))}"/>`;
  return { blue, pink };
}
