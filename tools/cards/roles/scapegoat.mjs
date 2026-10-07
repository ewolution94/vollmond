// The Scapegoat: a goat with curled horns, its head bowed, a bell at its throat and a cloth laid over its
// back, standing in the middle of a target.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 109;

const GROUND = 520;
// drawn small, then scaled up about its feet
const K = 1.14;
const P = (x, y) => [250 + (x - 250) * K, GROUND + (y - GROUND) * K];
const S = (pts) => pts.map(([x, y, c]) => [...P(x, y), c]);
const W = (pts) => pts.map(([x, y, w]) => [...P(x, y), w * K]);

const GOAT = S([
  [214, 300], [280, 294], [340, 296], [380, 300],
  [390, 296], [408, 272, 1], [400, 308],
  [402, 330], [396, 362], [386, 392], [376, 418], [378, 442], [380, 478], [383, GROUND, 1], [369, GROUND, 1], [369, 480], [366, 446], [360, 428], [350, 410],
  [320, 412], [262, 414], [232, 408],
  [226, 430], [224, 452], [221, 474], [222, GROUND, 1], [209, GROUND, 1], [209, 474], [207, 452], [204, 432], [196, 410],
  [184, 394], [166, 402], [148, 394], [136, 372], [142, 350],
  [160, 334], [188, 312], [204, 302],
]);
// the head, hung low: drawn along its own axis (u toward the nose, v toward the jaw), then turned down-left
const TH = (125 * Math.PI) / 180;
const H = (u, v) => P(150 + Math.cos(TH) * u + Math.sin(TH) * v, 350 + Math.sin(TH) * u - Math.cos(TH) * v);
const HEAD = [[-8, -26], [30, -30], [66, -24], [96, -16], [112, -6, 1], [114, 8], [104, 16], [86, 22], [56, 26], [24, 30], [-4, 28], [-16, 10], [-16, -12]].map(([u, v, c]) => [...H(u, v), c]);
const FAR = [W([[244, 408, 16], [241, 452, 12], [240, 476, 10], [238, GROUND - 2, 10]]), W([[350, 404, 20], [346, 446, 11], [344, 480, 10], [340, GROUND - 2, 10]])];
// the horn: from the poll up and back, curling round on itself
const HORN = W([[0, 0, 20], [2, -28, 23], [24, -46, 21], [52, -36, 17], [56, -10, 13], [40, 4, 9], [24, -8, 6], [32, -22, 3]].map(([x, y, w]) => [134 + x, 334 + y, w]));
// the ear, hanging back from behind the eye
const EAR = S([[146, 360], [166, 362], [186, 374], [194, 396, 1], [172, 386], [152, 372]]);
// the cloth: laid over the back, hanging in a curve between the legs, a tassel at each corner
const CLOTH = S([[236, 298, 1], [300, 290], [362, 298, 1], [370, 330], [366, 374, 1], [334, 366], [300, 364], [266, 366], [240, 374, 1], [232, 334]]);
const [ox, oy] = P(300, 332); // the target's centre, on the cloth
const [bx, by] = P(184, 432); // the bell

export default function draw({ halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // the target round it: rings, and a cross through them
  for (let r = 84, i = 0; r < 520; r += 13, i++) {
    const bold = i % 6 === 5;
    blue += `<circle cx="${F(ox)}" cy="${F(oy)}" r="${r}" fill="none" stroke="${PAPER}" stroke-width="${F(bold ? 3.4 : Math.max(0.7, 2.2 - r / 220))}" stroke-dasharray="${bold ? 'none' : `${F(40 + R() * 60)} ${F(5 + R() * 7)}`}"/>`;
  }
  blue += `<path d="M${F(ox)},40V${F(oy - 84)}M30,${F(oy)}H${F(ox - 84)}M${F(ox + 84)},${F(oy)}H470" stroke="${PAPER}" stroke-width="2.4"/>`;
  blue += `<path d="${stars(5, [56, 56, 444, 200], [[ox, oy, 250]])}" fill="${PAPER}"/>`;
  // the ground
  blue += `<path d="M30,${GROUND + 2}C150,${GROUND - 4} 330,${GROUND - 2} 470,${GROUND - 6}L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  let grass = '';
  for (const [x, y] of [[70, 540], [140, 532], [440, 534], [300, 546], [452, 550]]) grass += `M${x - 10},${y}L${x - 4},${y - 16}L${x},${y}L${x + 5},${y - 20}L${x + 9},${y}L${x + 14},${y - 12}L${x + 16},${y}Z`;
  blue += `<path d="${grass}" fill="${PAPER}"/>`;

  // the goat
  for (const l of FAR) blue += cutout(limb(l, true), 7);
  const goat = smooth(GOAT, true, 0.18);
  blue += cutout(goat);
  blue += `<clipPath id="scapegoat-body"><path d="${goat}"/></clipPath><g clip-path="url(#scapegoat-body)">`;
  blue += carve([[[370, 398], [380, 424], [374, 446]], [[216, 440], [216, 470]], [[374, 456], [374, 480]], [[196, 330], [204, 360], [200, 388]]].map(S), 2.6);
  blue += `</g>`;
  // split hooves
  for (const x of [215.5, 376]) {
    const [hx, hy] = P(x, GROUND - 6);
    blue += `<path d="M${F(hx - 7)},${F(hy - 4)}H${F(hx + 7)}M${F(hx)},${F(hy - 4)}V${F(hy + 6)}" stroke="${PAPER}" stroke-width="2.4"/>`;
  }
  // the ear, the head, the beard; the eye shut, sad
  blue += cutout(smooth(EAR), 5);
  blue += carve([[[160, 366], [176, 374], [186, 388]]].map(S), 2);
  const head = smooth(HEAD, true, 0.18);
  blue += cutout(head, 8);
  const beard = smooth([[...H(70, 26), 1], [...H(96, 20), 1], [...H(110, 54)], [...H(118, 84), 1], [...H(96, 60)]]);
  blue += cutout(beard, 4);
  blue += carve([[H(84, 30), H(100, 50), H(108, 70)]], 2);
  blue += carve([[H(22, -8), H(34, -4), H(46, -8)]], 3.4);
  blue += carve([[H(28, -4), H(26, 4)], [H(38, -4), H(38, 4)]], 1.8);
  blue += carve([[H(10, -22), H(30, -24), H(48, -20)]], 2.2);
  const [nx, ny] = H(104, -4);
  blue += `<ellipse cx="${F(nx)}" cy="${F(ny)}" rx="4" ry="2.4" transform="rotate(-55 ${F(nx)} ${F(ny)})" fill="${PAPER}"/>`;
  blue += carve([[H(98, 12), H(110, 10)]], 2.2);
  // the horn, ridged
  const horn = limb(HORN, true);
  blue += cutout(horn, 7);
  blue += `<clipPath id="scapegoat-horn"><path d="${horn}"/></clipPath><g clip-path="url(#scapegoat-horn)">`;
  for (let i = 1; i < HORN.length - 1; i++) {
    const [x, y, w] = HORN[i], [px, py] = HORN[i - 1], [qx, qy] = HORN[i + 1];
    const dx = qx - px, dy = qy - py, len = Math.hypot(dx, dy);
    const ux = -dy / len, uy = dx / len;
    for (const f of [0, 0.5]) {
      const cx = x + (qx - x) * f, cy = y + (qy - y) * f;
      blue += `<path d="M${F(cx - ux * w)},${F(cy - uy * w)}L${F(cx + ux * w)},${F(cy + uy * w)}" stroke="${PAPER}" stroke-width="2.2"/>`;
    }
  }
  blue += `</g>`;

  // the collar and the bell
  blue += cutout(limb(W([[146, 356, 11], [160, 382, 11], [172, 404, 11]]), false), 5);
  const bell = `M${F(bx - 11)},${F(by - 22)}C${F(bx - 13)},${F(by - 4)} ${F(bx - 15)},${F(by + 9)} ${F(bx - 24)},${F(by + 18)}L${F(bx + 24)},${F(by + 18)}C${F(bx + 15)},${F(by + 9)} ${F(bx + 13)},${F(by - 4)} ${F(bx + 11)},${F(by - 22)}C${F(bx + 7)},${F(by - 29)} ${F(bx - 7)},${F(by - 29)} ${F(bx - 11)},${F(by - 22)}Z`;
  blue += `<path d="${bell}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${bell}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += `<path d="M${F(bx - 17)},${F(by + 7)}H${F(bx + 17)}" stroke="${BLUE}" stroke-width="2.4"/><circle cx="${F(bx)}" cy="${F(by + 22)}" r="4.6" fill="${BLUE}"/>`;

  // the cloth over its back, with a carved border and tassels
  const cloth = smooth(CLOTH, true, 0.16);
  const tassels = [CLOTH[4], CLOTH[8]].map(([x, y]) => `M${F(x - 5)},${F(y)}L${F(x + 5)},${F(y)}L${F(x + 8)},${F(y + 22)}L${F(x - 8)},${F(y + 22)}Z`).join('');
  blue += `<path d="${cloth}${tassels}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/>`;
  blue += `<path d="${cloth}${tassels}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  const inner = smooth(CLOTH.map(([x, y, c]) => [ox + (x - ox) * 0.82, oy + (y - oy) * 0.78, c]), true, 0.16);
  blue += `<path d="${inner}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-dasharray="7 5"/>`;

  let pink = `<path d="${cloth}${tassels}${bell}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(3.4 * Math.max(0, 1 - Math.hypot(x - ox, y - oy) / 200), 2.4 * Math.max(0, 1 - Math.hypot(x - bx, y - by) / 60)))}"/>`;
  return { blue, pink };
}
