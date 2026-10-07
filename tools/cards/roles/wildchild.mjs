// The Wild Child: a feral child with spiky hair crouched among ferns; behind, a great wolf against the moon.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 102;

const [mx, my, mr] = [318, 164, 96]; // the moon
const [hx, hy] = [196, 330]; // the child's face

// the wolf's head and neck, looking down at the child from behind
const WOLF = [
  [470, 560, 1], [462, 470], [446, 380], [424, 300], [404, 244],
  [400, 196], [408, 150], [412, 92, 1], [386, 118], [368, 132, 1], [356, 78, 1], [334, 116], [318, 136],
  [290, 144], [262, 156], [232, 170], [206, 182], [190, 190, 1], [188, 204], [198, 212, 1], [228, 220], [254, 232], [274, 248], [286, 264],
  [280, 292, 1], [296, 300, 1], [290, 326, 1], [306, 334, 1], [300, 362, 1], [314, 372, 1], [312, 420], [314, 480], [318, 560, 1],
];
const WOLF_EYE = [[290, 170, 1], [306, 160], [322, 160, 1], [308, 172]];
const WOLF_FUR = [
  [[350, 170], [372, 210], [384, 260]], [[330, 200], [350, 240], [362, 290]], [[388, 300], [404, 360], [414, 420]],
  [[344, 320], [360, 380], [366, 440]], [[400, 460], [410, 510], [414, 560]], [[236, 200], [258, 206], [280, 216]],
];

const TORSO = [[136, 402], [154, 376], [196, 366], [240, 376], [258, 402], [262, 452], [246, 500], [196, 512], [148, 500], [132, 452]];
const LEG_L = [[160, 478, 46], [124, 420, 40], [104, 452, 36], [100, 526, 30]];
const LEG_R = [[234, 478, 46], [270, 420, 40], [290, 452, 36], [294, 526, 30]];
const ARM_L = [[158, 388, 32], [156, 450, 28], [166, 512, 24]];
const ARM_R = [[236, 388, 32], [238, 450, 28], [228, 512, 24]];
const paw = (x, y, s) => smooth([[x - 18 * s, y + 14], [x - 16 * s, y - 2], [x, y - 10], [x + 16 * s, y - 4], [x + 22 * s, y + 10], [x + 18 * s, y + 18, 1], [x - 16 * s, y + 18, 1]]);
const foot = (x, y, s) => smooth([[x - 16 * s, y - 8], [x + 4 * s, y - 14], [x + 34 * s, y + 4], [x + 36 * s, y + 18, 1], [x - 18 * s, y + 18, 1]]);

/** A fern frond: a curling stem with leaflets either side, as one path. */
function fern(x, y, len, a0, curl, n = 11) {
  let stem = [], leaves = '';
  let a = a0, px = x, py = y;
  const step = len / n;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    stem.push([px, py, 9 - t * 6]);
    if (i > 0 && i < n) {
      const dx = Math.cos(a), dy = Math.sin(a), L = 34 * (1 - t * 0.75), w = step * 0.62;
      for (const s of [-1, 1]) {
        const nx = -dy * s, ny = dx * s;
        const tip = [px + nx * L + dx * L * 0.42, py + ny * L + dy * L * 0.42];
        leaves += smooth([[px - dx * w / 2, py - dy * w / 2, 1], [px + nx * L * 0.5 - dx * w * 0.3, py + ny * L * 0.5 - dy * w * 0.3], [...tip, 1], [px + nx * L * 0.5 + dx * w * 0.7, py + ny * L * 0.5 + dy * w * 0.7], [px + dx * w / 2, py + dy * w / 2, 1]]);
      }
    }
    px += Math.cos(a) * step;
    py += Math.sin(a) * step;
    a += curl * (0.5 + t);
  }
  return { d: limb(stem, true) + leaves, rib: stem.map(([sx, sy]) => [sx, sy]) };
}

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="wildchild-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${mx}" cy="${my}" r="${mr + 52}" fill="#000"/></mask>`;
  blue += `<path mask="url(#wildchild-sky)" fill="${PAPER}" d="${lines(52, 520, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - my) / 330) * 2.6)}"/>`;
  for (let i = 0; i < 5; i++) blue += `<circle cx="${mx}" cy="${my}" r="${mr + 10 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.45)}" stroke-dasharray="${F(30 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${PAPER}"/>`;
  for (const [cx, cy, r] of [[362, 120, 12], [376, 218, 16], [286, 112, 7]]) blue += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-dasharray="${F(r * 2.4)} ${F(r * 1.2)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 440, 300], [[mx, my, mr + 66], [hx, hy, 110]])}" fill="${PAPER}"/>`;

  // the wolf, standing over the child
  const wolf = smooth(WOLF);
  blue += cutout(wolf);
  blue += `<clipPath id="wildchild-wolf"><path d="${wolf}"/></clipPath><g clip-path="url(#wildchild-wolf)">${carve(WOLF_FUR, 3)}</g>`;
  blue += `<path d="${smooth(WOLF_EYE)}" fill="${PAPER}"/>`;
  blue += carve([[[372, 118], [380, 134]], [[352, 102], [348, 126]]], 2.6);
  blue += `<circle cx="196" cy="196" r="5" fill="${PAPER}"/>`;

  // the ground
  blue += `<path d="M30,530C140,522 330,526 470,518L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;

  // the child, crouched like a wolf cub: legs folded, hands on the ground between the knees
  const torso = smooth(TORSO);
  blue += cutout(torso, 8);
  blue += `<clipPath id="wildchild-torso"><path d="${torso}"/></clipPath><g clip-path="url(#wildchild-torso)">`;
  blue += carve([[[150, 420], [172, 440], [196, 446], [222, 440], [244, 420]]], 2.6);
  blue += `</g>`;
  for (const leg of [LEG_L, LEG_R]) blue += cutout(limb(leg, true), 8);
  blue += cutout(foot(98, 520, -1) + foot(296, 520, 1), 6);
  blue += carve([[[118, 434], [108, 470], [106, 500]], [[276, 434], [286, 470], [288, 500]]], 2.6);
  for (const arm of [ARM_L, ARM_R]) blue += cutout(limb(arm, true), 7);
  blue += cutout(paw(168, 516, 1) + paw(228, 516, -1), 6);
  blue += carve([[[160, 512], [160, 528]], [[170, 510], [170, 528]], [[226, 510], [226, 528]], [[236, 512], [236, 528]]], 2);

  // the head: a wild mane of spikes round a dark face
  const mane = [];
  const n = 17;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (0.86 + (1.28 * i) / n);
    const rr = i % 2 ? 50 : 84 + R() * 14;
    mane.push([hx + Math.cos(a) * rr * 1.04, hy - 10 + Math.sin(a) * rr, 1]);
  }
  mane.push([hx + 34, hy + 30], [hx - 34, hy + 30]);
  const hair = smooth(mane, true, 0.12);
  blue += cutout(hair, 8);
  blue += carve(Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI * (0.98 + (1.04 * i) / 7);
    return [[hx + Math.cos(a) * 42, hy - 10 + Math.sin(a) * 40], [hx + Math.cos(a) * 64, hy - 10 + Math.sin(a) * 62]];
  }), 2.6);
  const FACE = [[hx - 36, hy - 22], [hx, hy - 30], [hx + 36, hy - 22], [hx + 38, hy + 10], [hx + 24, hy + 38], [hx, hy + 48], [hx - 24, hy + 38], [hx - 38, hy + 10]];
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  // spiky bangs over the brow
  const bangs = `M${hx - 40},${hy - 18}L${hx - 30},${hy - 2}L${hx - 22},${hy - 16}L${hx - 8},${hy}L${hx - 2},${hy - 16}L${hx + 12},${hy - 2}L${hx + 16},${hy - 18}L${hx + 30},${hy - 4}L${hx + 40},${hy - 20}`;
  blue += `<path d="${bangs}L${hx + 40},${hy - 40}L${hx - 40},${hy - 40}Z" fill="${BLUE}"/><path d="${bangs}" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  // slanted eyes, glowing; a snarl with a fang
  const eye = (x, y, s) => `M${x - 14 * s},${y - 4}Q${x},${y - 8} ${x + 13 * s},${y + 4}Q${x - 2 * s},${y + 8} ${x - 14 * s},${y - 4}Z`;
  const eyes = eye(hx - 17, hy + 8, 1.15) + eye(hx + 17, hy + 8, -1.15);
  blue += `<path d="${eyes}" fill="${PAPER}"/>`;
  blue += `<path d="M${hx - 17},${hy + 2}V${hy + 12}M${hx + 17},${hy + 2}V${hy + 12}" stroke="${BLUE}" stroke-width="3.2" stroke-linecap="round"/>`;
  blue += `<path d="M${hx - 14},${hy + 30}Q${hx},${hy + 24} ${hx + 14},${hy + 30}" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>`;
  blue += `<path d="M${hx + 5},${hy + 27}L${hx + 9},${hy + 36}L${hx + 11},${hy + 27}Z" fill="${PAPER}"/>`;
  blue += carve([[[hx - 4, hy + 12], [hx + 2, hy + 20]]], 2.4);

  // ferns in front
  const ferns = [fern(52, 560, 170, -1.36, 0.06), fern(92, 560, 120, -1.0, 0.1, 9), fern(30, 520, 110, -0.7, 0.12, 8), fern(430, 560, 190, -1.8, -0.06), fern(376, 560, 130, -1.98, -0.1, 9), fern(470, 520, 120, -2.4, -0.1, 8)];
  for (const f of ferns) {
    blue += cutout(f.d, 5);
    blue += carve([f.rib.slice(1, -2)], 1.8);
  }

  let pink = `<circle cx="${mx}" cy="${my}" r="${mr}" fill="${PINK}"/>`;
  pink += `<path d="${eyes}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => (Math.hypot(x - mx, y - my) < mr - 4 ? 0 : Math.max(3.6 * Math.max(0, 1 - Math.hypot(x - mx, y - my) / 210), 3 * Math.max(0, 1 - Math.hypot((x - hx) * 0.7, y - hy - 6) / 70))))}"/>`;
  return { blue, pink };
}
