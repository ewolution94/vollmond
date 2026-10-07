// The Three Brothers: three brothers shoulder to shoulder in matching caps, the eldest's arms round the other two,
// a banner across all three.
import { BLUE, PAPER, PINK, F, smooth, limb, almond, star4, carve, cutout } from '../kit.mjs';

export const seed = 104;

// [x, y of the face's centre, shoulder line]
const BROS = [[122, 262, 352], [378, 262, 352], [250, 226, 318]];
const [gx, gy] = [250, 458]; // the banner's middle

function bust(cx, sy) {
  return smooth([
    [cx - 100, 560, 1], [cx - 98, 440], [cx - 88, sy + 30], [cx - 60, sy + 6], [cx - 22, sy - 4], [cx, sy - 6], [cx + 22, sy - 4], [cx + 60, sy + 6], [cx + 88, sy + 30], [cx + 98, 440], [cx + 100, 560, 1],
  ]);
}

function head(hx, hy, i) {
  let out = '';
  out += cutout(limb([[hx, hy + 30, 34], [hx, hy + 70, 38]], false), 7);
  // ears
  out += cutout(`M${hx - 40},${hy - 4}a10,13 0 1 0 2,26ZM${hx + 40},${hy - 4}a10,13 0 1 1 -2,26Z`, 6);
  const face = smooth([[hx - 40, hy - 28], [hx, hy - 38], [hx + 40, hy - 28], [hx + 42, hy + 8], [hx + 32, hy + 38], [hx, hy + 52], [hx - 32, hy + 38], [hx - 42, hy + 8]]);
  out += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4.4"/>`;
  for (const ex of [hx - 17, hx + 17]) out += `<path d="${almond(ex, hy + 2, 8.5, 3.2)}" fill="${PAPER}"/>`;
  out += carve([[[hx - 28, hy - 12], [hx - 17, hy - 16], [hx - 6, hy - 12]], [[hx + 6, hy - 12], [hx + 17, hy - 16], [hx + 28, hy - 12]]], 2.8);
  out += carve([[[hx + 2, hy + 4], [hx + 7, hy + 20], [hx - 2, hy + 23]]], 2.6);
  if (i === 0) {
    // the bearded one
    out += `<path d="M${hx - 38},${hy + 14}C${hx - 34},${hy + 56} ${hx - 14},${hy + 70} ${hx},${hy + 72}C${hx + 14},${hy + 70} ${hx + 34},${hy + 56} ${hx + 38},${hy + 14}C${hx + 26},${hy + 30} ${hx + 14},${hy + 30} ${hx},${hy + 30}C${hx - 14},${hy + 30} ${hx - 26},${hy + 30} ${hx - 38},${hy + 14}Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.4"/>`;
    out += carve([[[hx - 22, hy + 38], [hx - 18, hy + 52]], [[hx - 8, hy + 42], [hx - 6, hy + 58]], [[hx + 8, hy + 42], [hx + 6, hy + 58]], [[hx + 22, hy + 38], [hx + 18, hy + 52]]], 2.2);
    out += carve([[[hx - 9, hy + 34], [hx, hy + 37], [hx + 9, hy + 34]]], 2.6);
  } else if (i === 1) {
    // the one with the moustache
    out += `<path d="M${hx},${hy + 26}C${hx - 10},${hy + 22} ${hx - 26},${hy + 24} ${hx - 32},${hy + 38}C${hx - 20},${hy + 32} ${hx - 10},${hy + 34} ${hx},${hy + 32}C${hx + 10},${hy + 34} ${hx + 20},${hy + 32} ${hx + 32},${hy + 38}C${hx + 26},${hy + 24} ${hx + 10},${hy + 22} ${hx},${hy + 26}Z" fill="${PAPER}"/>`;
    out += carve([[[hx - 7, hy + 42], [hx, hy + 44], [hx + 7, hy + 42]]], 2.6);
  } else {
    // the eldest, grinning
    out += `<path d="M${hx - 20},${hy + 28}C${hx - 8},${hy + 34} ${hx + 8},${hy + 34} ${hx + 20},${hy + 28}C${hx + 14},${hy + 44} ${hx - 14},${hy + 44} ${hx - 20},${hy + 28}Z" fill="${PAPER}"/>`;
    out += carve([[[hx - 30, hy + 20], [hx - 26, hy + 30]], [[hx + 30, hy + 20], [hx + 26, hy + 30]]], 2.4);
  }
  // the cap: a soft cone flopping over to one side, a rolled band, a badge
  const L = i === 0 ? -1 : 1, X = (dx) => hx + dx * L;
  const crown = smooth([[X(-46), hy - 26, 1], [X(-48), hy - 58], [X(-32), hy - 88], [X(-2), hy - 102], [X(30), hy - 100], [X(56), hy - 86], [X(72), hy - 62], [X(74), hy - 34, 1], [X(62), hy - 50], [X(50), hy - 58], [X(46), hy - 26, 1]]);
  out += cutout(crown, 7);
  out += carve([[[X(-30), hy - 44], [X(-20), hy - 72], [X(0), hy - 90]], [[X(-6), hy - 44], [X(10), hy - 70], [X(34), hy - 86]], [[X(20), hy - 46], [X(40), hy - 64], [X(58), hy - 74]]], 2.4);
  const band = `M${hx - 50},${hy - 36}C${hx - 20},${hy - 46} ${hx + 20},${hy - 46} ${hx + 50},${hy - 36}L${hx + 50},${hy - 18}C${hx + 20},${hy - 28} ${hx - 20},${hy - 28} ${hx - 50},${hy - 18}Z`;
  out += cutout(band, 6);
  out += carve([[[hx - 44, hy - 27], [hx, hy - 35], [hx + 44, hy - 27]]], 2);
  const [bx, by] = [X(-24), hy - 32];
  out += `<circle cx="${bx}" cy="${by}" r="10" fill="${PAPER}"/><path d="${star4(bx, by, 7)}" fill="${BLUE}"/>`;
  return out;
}

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(52, 420, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 330) / 300) * 2.4)}"/>`;
  // a low sun of rings behind the eldest
  for (let i = 0; i < 6; i++) blue += `<circle cx="250" cy="226" r="${110 + i * 11}" fill="none" stroke="${PAPER}" stroke-width="${F(3.2 - i * 0.45)}" stroke-dasharray="${F(30 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 444, 240], [[250, 226, 190]])}" fill="${PAPER}"/>`;

  const [left, right, mid] = BROS;
  blue += cutout(bust(mid[0], mid[2]), 10);
  for (const [cx, , sy] of [left, right]) {
    const b = bust(cx, sy);
    blue += cutout(b, 10);
    const id = `brother-b${cx}`;
    blue += `<clipPath id="${id}"><path d="${b}"/></clipPath><g clip-path="url(#${id})">${carve([[[cx - 60, 420], [cx - 70, 490], [cx - 74, 560]], [[cx + 60, 420], [cx + 70, 490], [cx + 74, 560]], [[cx - 20, sy + 10], [cx, sy + 40], [cx + 20, sy + 10]]], 3)}</g>`;
  }
  blue += `<clipPath id="brother-mid"><path d="${bust(mid[0], mid[2])}"/></clipPath><g clip-path="url(#brother-mid)">${carve([[[226, 330], [250, 372], [274, 330]], [[250, 372], [250, 430]]], 3)}</g>`;
  for (const [x, y] of [[250, 392], [250, 412]]) blue += `<circle cx="${x}" cy="${y}" r="4" fill="${PAPER}"/>`;

  // the eldest's arms round his brothers' shoulders
  const armL = [[208, 336, 34], [172, 352, 31], [124, 352, 29], [80, 362, 28], [62, 374, 26]];
  const armR = armL.map(([x, y, w]) => [500 - x, y, w]);
  for (const a of [armL, armR]) blue += cutout(limb(a, true), 8);
  blue += carve([[[204, 346], [176, 360], [150, 362]], [[296, 346], [324, 360], [350, 362]]], 2.4);
  for (const s of [-1, 1]) {
    const hx = 250 + s * 194;
    blue += cutout(smooth([[hx - 12 * s, 364], [hx + 4 * s, 360], [hx + 16 * s, 372], [hx + 16 * s, 398], [hx + 6 * s, 410], [hx - 8 * s, 404], [hx - 14 * s, 384]]), 6);
    blue += carve([[[hx - 4 * s, 376], [hx, 400]], [[hx + 6 * s, 374], [hx + 10 * s, 398]]], 2);
  }

  blue += head(left[0], left[1], 0) + head(right[0], right[1], 1) + head(mid[0], mid[1], 2);

  // the banner across all three
  const band = `M64,440C150,424 350,424 436,440L436,484C350,468 150,468 64,484Z`;
  const tails = `M70,452L28,456L46,478L28,500L70,496ZM430,452L472,456L454,478L472,500L430,496Z`;
  const folds = `M64,484L70,496L70,478ZM436,484L430,496L430,478Z`;
  blue += `<path d="${tails}${band}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/>`;
  blue += `<path d="${tails}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += `<path d="${folds}" fill="${BLUE}"/>`;
  blue += `<path d="${band}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += `<path d="M76,446C160,432 340,432 424,446M76,478C160,464 340,464 424,478" fill="none" stroke="${BLUE}" stroke-width="2"/>`;
  blue += `<path d="${star4(150, 459, 10)}${star4(250, 454, 12)}${star4(350, 459, 10)}" fill="${BLUE}"/>`;
  blue += carve([[[44, 470], [60, 474]], [[456, 470], [440, 474]]], 2, BLUE);

  let pink = `<path d="${tails}${band}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot((x - gx) * 0.55, y - gy) / 130))}"/>`;
  return { blue, pink };
}
