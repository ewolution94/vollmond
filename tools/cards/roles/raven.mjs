// The Raven: a great raven on a signpost, its wings half open; on the sign, the X it has marked.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 107;

const [hx, hy] = [230, 160]; // the head
const [ex, ey] = [222, 150]; // the eye
const PX = 252; // the post
const [xx, xy] = [176, 470]; // the X on the sign

const BODY = [[hx + 4, hy + 20], [hx + 34, hy + 34], [300, 230], [312, 280], [302, 326], [276, 348], [248, 350], [222, 330], [206, 290], [204, 240], [hx - 14, hy + 30]];
const HEAD = [[hx - 30, hy + 16], [hx - 32, hy - 10], [hx - 16, hy - 30], [hx + 8, hy - 36], [hx + 32, hy - 26], [hx + 40, hy], [hx + 36, hy + 26], [hx + 20, hy + 44], [hx - 4, hy + 44]];
const BEAK = [[hx - 22, hy - 20, 1], [hx - 58, hy - 10], [hx - 88, hy + 6], [hx - 100, hy + 22, 1], [hx - 86, hy + 20], [hx - 60, hy + 24], [hx - 24, hy + 28, 1]];
// the throat's shaggy hackles
const HACKLES = [[hx - 20, hy + 18, 1], [hx - 24, hy + 34], [hx - 30, hy + 50, 1], [hx - 16, hy + 46], [hx - 18, hy + 62, 1], [hx - 4, hy + 54], [hx, hy + 70, 1], [hx + 10, hy + 50], [hx + 8, hy + 30]];

/** A wing, raised from the shoulder, its long primaries hanging down; s = -1 left, +1 right. */
function wing(s) {
  const X = (x) => PX + (x - PX) * s;
  const covert = smooth([
    [X(236), 220], [X(206), 186], [X(170), 148], [X(126), 116], [X(88), 104, 1], [X(78), 124], [X(96), 160], [X(130), 196], [X(170), 236], [X(206), 272],
  ]);
  const feathers = [];
  // primaries from the wrist, secondaries along the arm
  const roots = [[94, 116], [104, 136], [118, 158], [136, 180], [156, 202], [176, 224], [196, 246]];
  const tips = [[54, 236], [72, 262], [94, 284], [118, 300], [144, 312], [172, 320], [200, 324]];
  for (let i = 0; i < roots.length; i++) {
    const [ax, ay] = roots[i], [bx, by] = tips[i];
    const mx = (ax + bx) / 2 - 8, my = (ay + by) / 2;
    feathers.push(limb([[X(ax), ay, 18], [X(mx), my, 24], [X(bx), by, 4]], true));
  }
  let out = '';
  for (let i = 0; i < feathers.length; i++) {
    out += cutout(feathers[i], 4.5);
    const [ax, ay] = roots[i], [bx, by] = tips[i];
    out += carve([[[X(ax + (bx - ax) * 0.2), ay + (by - ay) * 0.2], [X((ax + bx) / 2 - 6), (ay + by) / 2], [X(ax + (bx - ax) * 0.85), ay + (by - ay) * 0.85]]], 1.8);
  }
  out += cutout(covert, 7);
  // rows of covert feathers
  let sc = '';
  for (const [x, y] of [[110, 124], [134, 142], [158, 162], [182, 184], [206, 206], [124, 152], [148, 174], [172, 198], [196, 222]]) {
    sc += `M${X(x - 10)},${y}Q${X(x)},${y + 16} ${X(x + 10)},${y}`;
  }
  out += `<path d="${sc}" fill="none" stroke="${PAPER}" stroke-width="2.4" stroke-linecap="round"/>`;
  return out;
}

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(52, 520, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 200) / 320) * 2.4)}"/>`;
  // a thin moon high on the right
  blue += `<mask id="raven-moon"><circle cx="404" cy="300" r="34" fill="#fff"/><circle cx="390" cy="290" r="31" fill="#000"/></mask><rect mask="url(#raven-moon)" x="350" y="250" width="100" height="100" fill="${PAPER}"/>`;
  blue += `<path d="${stars(10, [56, 56, 450, 420], [[PX, 210, 210], [404, 300, 50], [xx + 40, xy, 110]])}" fill="${PAPER}"/>`;
  // low hills and the ground
  blue += `<path d="M30,512C110,488 170,486 240,500C320,488 400,486 470,500L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path fill="${PAPER}" d="${lines(522, 552, 8, () => 1.3, 40, 460)}"/>`;
  void R;

  // the signpost, its sign pointing left
  const post = polyD([[PX - 20, 560], [PX - 20, 356], [PX, 346], [PX + 20, 352], [PX + 20, 560]]);
  blue += cutout(post, 9);
  blue += carve([[[PX - 8, 370], [PX - 6, 440], [PX - 9, 540]], [[PX + 8, 380], [PX + 10, 470]]], 2.4);

  // the raven: tail, wings, body, head
  let tail = '';
  for (const [dx, len] of [[-26, 72], [-12, 84], [0, 90], [12, 84], [26, 72]]) tail += limb([[PX + dx * 0.3, 324, 18], [PX + dx, 324 + len * 0.6, 22], [PX + dx * 1.4, 324 + len, 6]], true);
  blue += cutout(tail, 5);
  blue += carve([[[PX - 10, 360], [PX - 14, 400]], [[PX + 10, 360], [PX + 14, 400]], [[PX, 362], [PX, 408]]], 2);
  blue += wing(-1) + wing(1);
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="raven-body"><path d="${body}"/></clipPath><g clip-path="url(#raven-body)">`;
  let sc = '';
  for (let y = 228, row = 0; y < 340; y += 18, row++) for (let x = 210 + (row % 2) * 10; x < 310; x += 20) sc += `M${x - 8},${y}Q${x},${y + 12} ${x + 8},${y}`;
  blue += `<path d="${sc}" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round"/>`;
  blue += `</g>`;
  blue += cutout(smooth(HACKLES, true, 0.14), 6);
  blue += cutout(smooth(HEAD), 8);
  blue += carve([[[hx + 6, hy - 20], [hx + 24, hy - 10], [hx + 30, hy + 8]], [[hx + 14, hy + 20], [hx + 22, hy + 30]]], 2.4);
  blue += cutout(smooth(BEAK, true, 0.16), 6);
  blue += carve([[[hx - 26, hy + 8], [hx - 56, hy + 10], [hx - 84, hy + 17]]], 2.4);
  blue += `<ellipse cx="${hx - 38}" cy="${hy - 6}" rx="4.4" ry="2.6" fill="${PAPER}"/>`;
  blue += `<circle cx="${ex}" cy="${ey}" r="10" fill="${PAPER}"/><circle cx="${ex - 1}" cy="${ey}" r="4.4" fill="${BLUE}"/>`;
  // the feet, gripping the post
  for (const dx of [-12, 12]) {
    blue += cutout(limb([[PX + dx, 336, 8], [PX + dx, 350, 7]], true), 4);
    blue += `<path d="M${PX + dx - 12},${352}q4,-8 12,-6q8,-2 12,6" fill="none" stroke="${PAPER}" stroke-width="9" stroke-linecap="round"/><path d="M${PX + dx - 12},${352}q4,-8 12,-6q8,-2 12,6" fill="none" stroke="${BLUE}" stroke-width="5" stroke-linecap="round"/>`;
  }

  // the sign, nailed across the post, and the X daubed on it
  const sign = polyD([[66, xy], [98, xy - 30], [342, xy - 26], [338, xy + 30], [98, xy + 30]]);
  blue += cutout(sign, 8);
  blue += carve([[[104, xy - 14], [220, xy - 12], [330, xy - 14]], [[110, xy + 16], [230, xy + 18], [326, xy + 16]]], 2.2);
  for (const [x, y] of [[PX - 10, xy - 16], [PX + 10, xy + 18], [90, xy]]) blue += `<circle cx="${x}" cy="${y}" r="3.4" fill="${PAPER}"/>`;
  const X = limb([[xx - 26, xy - 22, 11], [xx, xy, 13], [xx + 28, xy + 24, 9]], true) + limb([[xx + 26, xy - 24, 10], [xx, xy, 13], [xx - 24, xy + 22, 11]], true);
  blue += `<path d="${X}" fill="${PAPER}"/>`;
  const drips = `M${xx - 22},${xy + 24}q2,10 0,14q-3,-4 -2,-14ZM${xx + 26},${xy + 26}q2,6 0,9q-2,-3 -2,-9Z`;
  blue += `<path d="${drips}" fill="${PAPER}"/>`;

  const eye = `M${ex - 10},${ey}a10,10 0 1 0 20,0a10,10 0 1 0 -20,0Z`;
  let pink = `<path d="${eye}${X}${drips}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(3.4 * Math.max(0, 1 - Math.hypot(x - xx, y - xy) / 140), 3 * Math.max(0, 1 - Math.hypot(x - ex, y - ey) / 90)))}"/>`;
  void F;
  return { blue, pink };
}
