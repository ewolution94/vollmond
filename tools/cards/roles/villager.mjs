// The Villager: a villager with a pitchfork holding a torch up before a row of half-timbered houses.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, almond, carve, cutout } from '../kit.mjs';

export const seed = 51;

const [HX, HY] = [372, 250]; // the raised fist
const [fx, fy] = [384, 166]; // the flame's foot
const [gx, gy] = [386, 118]; // the light's centre
const [hx, hy] = [240, 262]; // the head

const TORSO = [[118, 560, 1], [124, 470], [132, 404], [156, 374], [196, 358], [240, 354], [284, 358], [324, 374], [346, 404], [354, 470], [362, 560, 1]];
const COWL = [[150, 380], [190, 346], [240, 336], [290, 346], [330, 380], [318, 404], [302, 396], [286, 416], [270, 404], [254, 424], [240, 412, 1], [226, 424], [210, 404], [194, 416], [178, 396], [162, 404]];
const HEAD = [
  [hx, hy - 66], [hx + 48, hy - 50], [hx + 60, hy - 12], [hx + 56, hy + 4, 1], [hx + 64, hy + 8], [hx + 62, hy + 26], [hx + 50, hy + 30, 1],
  [hx + 40, hy + 54], [hx, hy + 70], [hx - 40, hy + 54], [hx - 50, hy + 30, 1], [hx - 62, hy + 26], [hx - 64, hy + 8], [hx - 56, hy + 4, 1], [hx - 60, hy - 12], [hx - 48, hy - 50],
];
const FACE = [[hx - 42, hy - 8, 1], [hx, hy - 16], [hx + 42, hy - 8, 1], [hx + 38, hy + 30], [hx + 22, hy + 56], [hx, hy + 64], [hx - 22, hy + 56], [hx - 38, hy + 30]];
const ARM = [[316, 404, 50], [330, 354, 46], [348, 310, 42], [360, 280, 36], [366, 262, 32]];
const ARM_L = [[170, 392, 46], [150, 424, 40], [132, 452, 34]];
const HAND_R = [[HX - 22, HY + 14], [HX - 24, HY - 10], [HX - 8, HY - 22], [HX + 16, HY - 20], [HX + 24, HY - 4], [HX + 20, HY + 16], [HX, HY + 22]];
const HAND_L = [[96, 448], [104, 430], [126, 424], [146, 432], [148, 454], [128, 464], [104, 462]];
const FORK = 118; // the pitchfork's shaft

// Houses: [left, right, eaves, ridge]; they stand on the ground at 560.
const HOUSES = [[100, 176, 420, 336], [24, 108, 392, 286], [338, 414, 418, 344], [404, 488, 396, 292]];

function house([x0, x1, ey, ry]) {
  const mx = (x0 + x1) / 2, o = 10;
  let out = `<path d="${polyD([[x0, 560], [x0, ey], [x0 - o, ey], [mx, ry], [x1 + o, ey], [x1, ey], [x1, 560]])}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>`;
  const fl = ey + 64; // the first floor's beam
  const cut = (d, w = 3.2) => `<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  out += cut(`M${x0 + 4},${ey + 8}H${x1 - 4}M${x0 + 4},${fl}H${x1 - 4}M${x0 + 9},${ey + 8}V560M${x1 - 9},${ey + 8}V560M${mx},${ey + 8}V${fl}`);
  out += cut(`M${x0 + 9},${fl - 4}L${(x0 + mx) / 2},${ey + 12}M${x1 - 9},${fl - 4}L${(x1 + mx) / 2},${ey + 12}M${x0 + 9},${fl + 54}L${x0 + 34},${fl + 4}M${x1 - 9},${fl + 54}L${x1 - 34},${fl + 4}`, 2.6);
  // a carved gable vent under the ridge
  out += `<circle cx="${mx}" cy="${F(ey - (ey - ry) * 0.36)}" r="6" fill="${PAPER}"/>`;
  return out;
}

// The lit windows: [x, y]
const WINDOWS = [[56, 428], [436, 432], [446, 500], [384, 474]];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="villager-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${gx}" cy="${gy}" r="104" fill="#000"/></mask>`;
  blue += `<path mask="url(#villager-sky)" fill="${PAPER}" d="${lines(52, 470, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - gy) / 300) * 2.6)}"/>`;
  for (let i = 0; i < 6; i++) blue += `<circle cx="${gx}" cy="${gy}" r="${50 + i * 10}" fill="none" stroke="${PAPER}" stroke-width="${F(3.2 - i * 0.42)}" stroke-dasharray="${F(26 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<path d="${stars(9, [56, 56, 300, 250], [[gx, gy, 150], [hx, hy, 90], [FORK, 130, 50]])}" fill="${PAPER}"/>`;

  for (const h of HOUSES) blue += house(h);
  for (const [x, y] of WINDOWS) blue += `<rect x="${x - 14}" y="${y - 18}" width="28" height="36" rx="2" fill="${PAPER}"/><path d="M${x},${y - 18}V${y + 18}M${x - 14},${y}H${x + 14}" stroke="${BLUE}" stroke-width="3.6"/>`;

  // the pitchfork, behind the body: a shaft and three tines
  const tines = `M${FORK - 34},${108}C${FORK - 36},${150} ${FORK - 30},${176} ${FORK},${180}C${FORK + 30},${176} ${FORK + 36},${150} ${FORK + 34},${108}`;
  blue += `<path d="${tines}M${FORK},${104}V${180}" fill="none" stroke="${PAPER}" stroke-width="18" stroke-linecap="round"/>`;
  blue += cutout(limb([[FORK, 178, 14], [FORK, 560, 16]]), 9);
  blue += `<path d="${tines}M${FORK},${104}V${180}" fill="none" stroke="${BLUE}" stroke-width="8" stroke-linecap="round"/>`;

  const torso = smooth(TORSO);
  blue += cutout(torso);
  blue += `<clipPath id="villager-body"><path d="${torso}"/></clipPath><g clip-path="url(#villager-body)">`;
  blue += carve([[[200, 506], [192, 532], [182, 560]], [[280, 506], [288, 532], [298, 560]], [[240, 508], [240, 560]]], 3);
  blue += carve([[[178, 430], [184, 470]], [[302, 430], [296, 470]]], 2.6);
  blue += `<path d="M120,488C180,500 300,500 360,488" fill="none" stroke="${PAPER}" stroke-width="9"/><path d="M120,488C180,500 300,500 360,488" fill="none" stroke="${BLUE}" stroke-width="3.4"/>`;
  blue += `</g>`;
  blue += cutout(smooth(COWL), 6);
  blue += carve([[[200, 362], [222, 380], [246, 384], [270, 380], [292, 362]]], 2.6);

  const head = smooth(HEAD);
  blue += cutout(head, 8);
  blue += `<clipPath id="villager-hair"><path d="${head}"/></clipPath><g clip-path="url(#villager-hair)">`;
  blue += carve([-40, -22, -6, 8, 24, 40].map((dx) => [[hx + dx * 0.4, hy - 64], [hx + dx * 0.9, hy - 36], [hx + dx, hy - 14]]), 2.4);
  blue += `</g>`;
  blue += `<path d="${smooth(FACE)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  for (const ex of [hx - 19, hx + 19]) blue += `<path d="${almond(ex, hy + 12, 9, 3.2)}" fill="${PAPER}"/>`;
  blue += carve([[[hx + 2, hy + 14], [hx + 8, hy + 32], [hx - 2, hy + 36]], [[hx - 12, hy + 46], [hx, hy + 49], [hx + 12, hy + 46]]], 2.8);

  blue += cutout(limb(ARM_L), 8);
  blue += cutout(smooth(HAND_L), 7);
  blue += carve([[[110, 436], [126, 440], [140, 438]], [[108, 450], [126, 454], [140, 452]]], 2.4);

  blue += cutout(limb(ARM), 9);
  blue += carve([[[322, 356], [334, 316], [346, 284]]], 2.6);
  blue += carve([[[346, 268], [362, 274], [380, 268]]], 3);
  // the torch: a stick in the fist, a wrapped head, the flame
  blue += cutout(limb([[HX - 4, HY + 40, 12], [fx - 2, fy + 40, 13]]), 8);
  blue += cutout(smooth(HAND_R), 7);
  blue += carve([[[HX - 20, HY - 8], [HX, HY - 4], [HX + 20, HY - 6]], [[HX - 20, HY + 4], [HX, HY + 8], [HX + 20, HY + 6]]], 2.4);
  const wrap = polyD([[fx - 15, fy + 42], [fx + 15, fy + 42], [fx + 21, fy + 2], [fx - 21, fy + 2]]);
  blue += cutout(wrap, 8);
  blue += carve([[[fx - 18, fy + 30], [fx + 16, fy + 16]], [[fx - 18, fy + 16], [fx + 18, fy + 4]], [[fx - 16, fy + 42], [fx + 16, fy + 28]]], 2.6);
  const flame = smooth([
    [fx - 24, fy, 1], [fx - 40, fy - 22], [fx - 40, fy - 52], [fx - 26, fy - 74], [fx - 36, fy - 104, 1], [fx - 10, fy - 84], [fx - 2, fy - 98],
    [fx - 4, fy - 124, 1], [fx + 18, fy - 100], [fx + 22, fy - 80], [fx + 44, fy - 100, 1], [fx + 44, fy - 64], [fx + 40, fy - 30], [fx + 24, fy, 1],
  ]);
  const core = smooth([[fx - 12, fy - 6, 1], [fx - 20, fy - 28], [fx - 10, fy - 52], [fx + 2, fy - 76, 1], [fx + 12, fy - 50], [fx + 22, fy - 28], [fx + 12, fy - 6, 1]]);
  blue += `<path d="${flame}" fill="${PAPER}"/>`;
  const sparks = [[fx - 58, fy - 96, 5], [fx + 62, fy - 112, 4.5], [fx + 28, fy - 120, 3.5], [fx - 46, fy - 126, 3.5]];
  for (const [x, y, r] of sparks) blue += `<path d="${polyD([[x, y - r], [x + r * 0.7, y], [x, y + r], [x - r * 0.7, y]])}" fill="${PAPER}"/>`;

  let pink = `<path d="${flame}${core}" fill="${PINK}" fill-rule="evenodd"/>`;
  for (const [x, y, r] of sparks) pink += `<path d="${polyD([[x, y - r], [x + r * 0.7, y], [x, y + r], [x - r * 0.7, y]])}" fill="${PINK}"/>`;
  pink += `<mask id="villager-flame"><rect width="500" height="700" fill="#fff"/><path d="${flame}" fill="#000"/></mask>`;
  pink += `<path mask="url(#villager-flame)" fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - gx, y - gy) / 230))}"/>`;
  for (const [x, y] of WINDOWS) pink += `<rect x="${x - 14}" y="${y - 18}" width="28" height="36" fill="${PINK}"/>`;
  return { blue, pink };
}
