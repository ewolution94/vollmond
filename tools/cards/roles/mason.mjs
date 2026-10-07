// The Mason: a stonemason in his apron before the wall he's raising, trowel held high; over the
// wall, the square and compasses of his brotherhood shine.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 159;

const [sx, sy] = [250, 136]; // the symbol's centre
const [hx, hy] = [214, 290]; // his face

// the wall's top: stepped, still being built
const WALL_TOP = [[30, 300], [96, 300], [96, 276], [180, 276], [180, 252], [330, 252], [330, 276], [400, 276], [400, 300], [470, 300]];
const BODY = [[70, 560, 1], [78, 470], [96, 410], [130, 372], [176, 352], [214, 348], [254, 352], [298, 372], [330, 410], [348, 470], [356, 560, 1]];
const APRON = [[140, 560, 1], [146, 470], [150, 410], [178, 394], [250, 394], [278, 410], [282, 470], [288, 560, 1]];
const FACE = [[hx - 36, hy - 24], [hx - 24, hy - 44], [hx, hy - 50], [hx + 24, hy - 44], [hx + 36, hy - 24], [hx + 38, hy + 4], [hx + 32, hy + 24], [hx - 32, hy + 24], [hx - 38, hy + 4]];
const BEARD = [[hx - 38, hy + 2], [hx - 30, hy + 24], [hx - 14, hy + 30], [hx, hy + 26, 1], [hx + 14, hy + 30], [hx + 30, hy + 24], [hx + 38, hy + 2], [hx + 40, hy + 34], [hx + 26, hy + 62], [hx, hy + 74, 1], [hx - 26, hy + 62], [hx - 40, hy + 34]];
const CAP = [[hx - 44, hy - 26, 1], [hx - 40, hy - 52], [hx - 12, hy - 70], [hx + 22, hy - 70], [hx + 46, hy - 52], [hx + 52, hy - 30], [hx + 72, hy - 22, 1], [hx + 40, hy - 18], [hx, hy - 24]];
const ARM_UP = [[300, 388, 46], [342, 412, 40], [370, 384, 34], [378, 344, 30], [376, 318, 28]];
const HAND_UP = [[360, 330], [358, 308], [372, 296], [390, 300], [396, 318], [388, 334], [372, 338]];
const ARM_IN = [[124, 392, 44], [106, 438, 38], [98, 480, 32], [100, 496, 28]];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="mason-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${sx}" cy="${sy}" r="104" fill="#000"/></mask>`;
  blue += `<path mask="url(#mason-sky)" fill="${PAPER}" d="${lines(52, 300, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - sy) / 260) * 2.4)}"/>`;
  for (let i = 0; i < 5; i++) blue += `<circle cx="${sx}" cy="${sy}" r="${94 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.5)}" stroke-dasharray="${F(24 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<path d="${stars(8, [56, 52, 444, 240], [[sx, sy, 150]])}" fill="${PAPER}"/>`;

  // the wall: rows of bricks, their joints carved
  const wall = polyD([...WALL_TOP, [470, 560], [30, 560]]);
  blue += `<path d="${wall}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<clipPath id="mason-wall"><path d="${wall}"/></clipPath><g clip-path="url(#mason-wall)">`;
  let joints = '';
  for (let y = 252, row = 0; y < 560; y += 24, row++) {
    joints += `M30,${y}H470`;
    for (let x = 40 + (row % 2) * 28 + R() * 4; x < 470; x += 56) joints += `M${F(x)},${y}V${y + 24}`;
  }
  blue += `<path d="${joints}" stroke="${PAPER}" stroke-width="3" fill="none"/>`;
  blue += `</g>`;
  // a brick laid on top, mortar oozing
  blue += cutout(`M330,252H386V230H330Z`, 5);
  blue += carve([[[334, 254], [344, 260], [354, 254], [366, 260], [380, 254]]], 2.4);

  // the mason: shirt, apron, beard, cap
  const body = smooth(BODY);
  blue += cutout(body);
  blue += carve([[[110, 440], [104, 500], [102, 560]], [[318, 440], [326, 500], [330, 560]]], 3);
  const apron = smooth(APRON, true, 0.16);
  blue += `<path d="${apron}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="M178,394L196,360M250,394L232,360" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="M178,450H250V492H178Z" fill="none" stroke="${PAPER}" stroke-width="3"/><path d="M214,450V492" stroke="${PAPER}" stroke-width="2.4"/>`;
  blue += carve([[[166, 510], [164, 560]], [[264, 510], [268, 560]]], 2.6);
  blue += `<path d="${limb([[hx, hy + 30, 30], [hx, hy + 62, 34]], true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="${smooth(FACE)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  const beard = smooth(BEARD, true, 0.18);
  blue += cutout(beard, 5);
  blue += carve([[[hx - 24, hy + 34], [hx - 18, hy + 52]], [[hx - 8, hy + 38], [hx - 4, hy + 60]], [[hx + 8, hy + 38], [hx + 6, hy + 60]], [[hx + 24, hy + 34], [hx + 18, hy + 52]]], 2.2);
  blue += `<path d="M${hx - 22},${hy + 22}C${hx - 10},${hy + 14} ${hx + 10},${hy + 14} ${hx + 22},${hy + 22}" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;
  for (const ex of [hx - 15, hx + 15]) blue += `<path d="M${ex - 8},${hy - 6}Q${ex},${hy - 11} ${ex + 8},${hy - 6}Q${ex},${hy - 2} ${ex - 8},${hy - 6}Z" fill="${PAPER}"/>`;
  blue += carve([[[hx - 26, hy - 18], [hx - 14, hy - 22], [hx - 4, hy - 18]], [[hx + 4, hy - 18], [hx + 14, hy - 22], [hx + 26, hy - 18]]], 3.6);
  blue += carve([[[hx + 2, hy - 2], [hx + 5, hy + 8], [hx - 1, hy + 11]]], 2.6);
  blue += cutout(smooth(CAP, true, 0.18), 6);
  blue += carve([[[hx - 40, hy - 34], [hx, hy - 40], [hx + 46, hy - 32]]], 2.4);

  // the near arm, a brick in his hand
  blue += cutout(limb(ARM_IN, true), 8);
  blue += cutout(`M70,500H132V534H70Z`, 6);
  blue += carve([[[74, 517], [128, 517]], [[101, 502], [101, 516]]], 2.4);
  blue += cutout(smooth([[86, 508], [84, 488], [98, 478], [114, 484], [118, 504], [104, 514]]), 5);
  blue += carve([[[90, 494], [104, 490], [114, 494]]], 2.2);

  // the raised arm and the trowel
  blue += cutout(limb(ARM_UP, true), 8);
  blue += carve([[[316, 400], [346, 410], [364, 390]], [[362, 350], [384, 356]]], 2.6);
  const blade = polyD([[372, 290], [348, 236], [372, 172], [398, 236]]);
  blue += cutout(limb([[376, 300, 9], [376, 272, 8]]), 6);
  blue += cutout(blade, 7);
  blue += carve([[[372, 282], [372, 236], [372, 190]]], 2.4);
  blue += cutout(smooth(HAND_UP), 6);
  blue += carve([[[362, 312], [376, 308], [390, 312]], [[362, 324], [376, 320], [390, 324]]], 2.2);

  // the square and compasses: a carpenter's square, corner down; the compasses astride it
  const square = polyD([[sx, sy + 70], [sx - 84, sy - 14], [sx - 70, sy - 28], [sx, sy + 42], [sx + 70, sy - 28], [sx + 84, sy - 14]]);
  const legs = limb([[sx - 4, sy - 66, 12], [sx - 40, sy + 4, 11], [sx - 70, sy + 62, 3]]) + limb([[sx + 4, sy - 66, 12], [sx + 40, sy + 4, 11], [sx + 70, sy + 62, 3]]);
  const hinge = `M${sx - 13},${sy - 70}a13,13 0 1 0 26,0a13,13 0 1 0 -26,0Z`;
  const symbol = square + legs + hinge;
  blue += `<path d="${symbol}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/>`;
  blue += `<path d="${square}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;
  blue += `<path d="${legs}${hinge}" fill="${PAPER}" stroke="${PAPER}" stroke-width="7" stroke-linejoin="round"/><path d="${legs}${hinge}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;
  let ticks = '';
  for (let i = 1; i < 6; i++) ticks += `M${F(sx - 12 * i - 2)},${F(sy + 54 - 12 * i)}l${F(5)},${F(5)}M${F(sx + 12 * i + 2)},${F(sy + 54 - 12 * i)}l${F(-5)},${F(5)}`;
  blue += `<path d="${ticks}" stroke="${BLUE}" stroke-width="2.2"/>`;
  blue += `<circle cx="${sx}" cy="${sy - 70}" r="4" fill="${BLUE}"/>`;

  let pink = `<path d="${symbol}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - sx, y - sy) / 200))}"/>`;
  return { blue, pink };
}
