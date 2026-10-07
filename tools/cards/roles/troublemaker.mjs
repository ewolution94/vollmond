// The Troublemaker: a grinning woman with a sly sideways look, two cards crossed in her hands, and
// the arrows of the swap she's about to make wheeling round them.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, star4, carve, cutout } from '../kit.mjs';

export const seed = 153;

const [fx, fy] = [250, 210]; // the face
const [kx, ky] = [250, 416]; // where the cards cross
const [kw, kh, ka] = [62, 118, 36]; // card size, tilt
const AR = 124; // the arrows' radius round the cards

const FACE = [[fx - 44, fy - 30], [fx - 30, fy - 54], [fx, fy - 62], [fx + 30, fy - 54], [fx + 44, fy - 30], [fx + 44, fy + 8], [fx + 34, fy + 42], [fx + 16, fy + 62], [fx, fy + 66], [fx - 16, fy + 62], [fx - 34, fy + 42], [fx - 44, fy + 8]];
// her hair: parted in the middle, falling in waves to her shoulders
const HAIR = [
  [fx, fy - 84], [fx + 46, fy - 78], [fx + 72, fy - 46], [fx + 84, fy - 6], [fx + 74, fy + 30], [fx + 88, fy + 62], [fx + 76, fy + 92], [fx + 94, fy + 120], [fx + 80, fy + 140, 1], [fx + 68, fy + 118], [fx + 56, fy + 136, 1],
  [fx + 52, fy + 96], [fx + 50, fy + 40], [fx + 44, fy - 28], [fx + 18, fy - 56], [fx, fy - 54, 1], [fx - 18, fy - 56], [fx - 44, fy - 28], [fx - 50, fy + 40], [fx - 52, fy + 96],
  [fx - 56, fy + 136, 1], [fx - 68, fy + 118], [fx - 80, fy + 140, 1], [fx - 94, fy + 120], [fx - 76, fy + 92], [fx - 88, fy + 62], [fx - 74, fy + 30], [fx - 84, fy - 6], [fx - 72, fy - 46], [fx - 46, fy - 78],
];
const BODY = [[86, 560, 1], [96, 470], [118, 396], [160, 346], [210, 326], [250, 322], [290, 326], [340, 346], [382, 396], [404, 470], [414, 560, 1]];
// her arms, down from the shoulders and in to the cards (the left; the right mirrors it)
const ARM = [[154, 368, 48], [132, 420, 42], [146, 470, 36], [186, 490, 30], [212, 488, 26]];
const FIST = [[198, 494], [196, 472], [210, 460], [230, 464], [236, 482], [228, 500], [210, 504]];

const flip = (pts) => pts.map(([x, y, c]) => [500 - x, y, c]);

/** A swap arrow: a thick arc round the cards from angle a0 to a1 (degrees), its head at a1. */
function arrow(a0, a1) {
  const rad = (a) => (a * Math.PI) / 180;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / 8);
    pts.push([kx + Math.cos(a) * AR, ky + Math.sin(a) * AR, i === 0 ? 4 : 15]);
  }
  const e = rad(a1), dir = Math.sign(a1 - a0);
  const tip = [kx + Math.cos(e + dir * 0.2) * AR, ky + Math.sin(e + dir * 0.2) * AR];
  const o = [kx + Math.cos(e) * (AR + 22), ky + Math.sin(e) * (AR + 22)], i = [kx + Math.cos(e) * (AR - 22), ky + Math.sin(e) * (AR - 22)];
  return limb(pts, true) + polyD([o, tip, i]);
}

export default function draw({ lines, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(52, 540, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 120) / 320) * 2.4)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 444, 300], [[fx, fy, 130], [kx, ky, AR + 40]])}" fill="${PAPER}"/>`;

  const hair = smooth(HAIR, true, 0.18);
  blue += cutout(hair, 8);
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="troublemaker-body"><path d="${body}"/></clipPath><g clip-path="url(#troublemaker-body)">`;
  // a square neckline and a laced bodice
  blue += `<path d="M196,334L204,384L296,384L304,334" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += carve([[[130, 420], [118, 490], [112, 560]], [[370, 420], [382, 490], [388, 560]]], 3);
  blue += `</g>`;
  // the hair over the shoulders, its waves carved in
  blue += `<clipPath id="troublemaker-hair"><path d="${hair}"/></clipPath><g clip-path="url(#troublemaker-hair)">`;
  const waves = [[[fx - 10, fy - 70], [fx - 50, fy - 52], [fx - 64, fy - 6]], [[fx - 62, fy + 10], [fx - 66, fy + 44], [fx - 72, fy + 80], [fx - 66, fy + 110]], [[fx - 30, fy - 76], [fx - 60, fy - 40], [fx - 72, fy - 10]], [[fx - 58, fy + 60], [fx - 82, fy + 100]]];
  blue += carve([...waves, ...waves.map(flip)], 2.6);
  blue += `</g>`;

  // the face: a sly look to the side, one brow cocked, a wide crooked grin
  const face = smooth(FACE);
  blue += `<path d="${limb([[fx, fy + 50, 34], [fx, fy + 118, 40]], true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  for (const ex of [fx - 20, fx + 20]) {
    blue += `<path d="M${ex - 13},${fy}Q${ex},${fy - 8} ${ex + 13},${fy}Q${ex},${fy + 7} ${ex - 13},${fy}Z" fill="${PAPER}"/>`;
    blue += `<circle cx="${ex + 7}" cy="${fy}" r="4.6" fill="${BLUE}"/>`;
    blue += `<path d="M${ex - 15},${fy - 3}Q${ex},${fy - 10} ${ex + 15},${fy - 3}" fill="none" stroke="${BLUE}" stroke-width="3.6"/>`;
  }
  blue += carve([[[fx - 36, fy - 26], [fx - 22, fy - 32], [fx - 6, fy - 22]], [[fx + 6, fy - 16], [fx + 22, fy - 24], [fx + 38, fy - 26]]], 3.4);
  blue += carve([[[fx + 2, fy + 6], [fx + 6, fy + 22], [fx - 2, fy + 26]]], 2.6);
  const grin = `M${fx - 28},${fy + 36}C${fx - 10},${fy + 42} ${fx + 14},${fy + 40} ${fx + 32},${fy + 28}C${fx + 26},${fy + 54} ${fx - 16},${fy + 62} ${fx - 28},${fy + 36}Z`;
  blue += `<path d="${grin}" fill="${PAPER}"/>`;
  blue += `<path d="M${fx - 24},${fy + 43}C${fx - 6},${fy + 48} ${fx + 14},${fy + 45} ${fx + 28},${fy + 36}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
  blue += carve([[[fx + 32, fy + 28], [fx + 38, fy + 22]], [[fx - 28, fy + 36], [fx - 34, fy + 34]]], 2.6);

  // the two cards, crossed
  let cards = '', marks = '';
  for (const a of [ka, -ka]) {
    const r = `<rect x="${kx - kw / 2}" y="${ky - kh / 2}" width="${kw}" height="${kh}" rx="6"`;
    cards += `<g transform="rotate(${a} ${kx} ${ky})">${r} fill="${BLUE}" stroke="${PAPER}" stroke-width="12"/>${r} fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
    cards += `<rect x="${kx - kw / 2 + 9}" y="${ky - kh / 2 + 9}" width="${kw - 18}" height="${kh - 18}" rx="3" fill="none" stroke="${PAPER}" stroke-width="2.2"/>`;
    cards += a > 0 ? `<path d="${star4(kx, ky - 36, 12)}${star4(kx, ky + 36, 12)}" fill="${PAPER}"/></g>` : `<path d="M${kx + 8},${ky - 15}A16,16 0 1 0 ${kx + 8},${ky + 15}A20,20 0 0 1 ${kx + 8},${ky - 15}Z" fill="${PAPER}"/></g>`;
    marks += a;
  }
  blue += cards;
  // her arms and fists holding them
  for (const side of [ARM, flip(ARM)]) blue += cutout(limb(side, true), 8);
  const fists = smooth(FIST) + smooth(flip(FIST));
  blue += cutout(fists, 6);
  const knuckles = [[[202, 472], [218, 470], [232, 476]], [[200, 486], [216, 484], [232, 490]]];
  blue += carve([...knuckles, ...knuckles.map(flip)], 2.2);

  // the swap: two arrows wheeling round the cards
  const arrows = arrow(118, 238) + arrow(298, 418);
  blue += `<path d="${arrows}" fill="${PAPER}" stroke="${BLUE}" stroke-width="10" stroke-linejoin="round"/><path d="${arrows}" fill="${PAPER}"/>`;

  let pink = `<path d="${arrows}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.4 * Math.max(0, 1 - Math.abs(Math.hypot(x - kx, y - ky) - AR) / 80))}"/>`;
  void F; void marks;
  return { blue, pink };
}
