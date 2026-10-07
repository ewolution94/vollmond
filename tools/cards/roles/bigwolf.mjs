// The Big Bad Wolf: a huge wolf's head staring straight out of the card, jaws wide open, fangs bared.
import { BLUE, PAPER, PINK, F, smooth, polyD, carve, cutout } from '../kit.mjs';

export const seed = 141;

const CX = 250;
/** A left half, from the top of the centre line down to its foot, mirrored into a whole shape. */
const mirror = (half) => [...half, ...half.slice(1, -1).reverse().map(([x, y, c]) => [2 * CX - x, y, c])];
const flip = (pts) => pts.map(([x, y, c]) => [2 * CX - x, y, c]);

// the head: ears up, a ruff of fur tufts down the cheeks, the lower jaw hanging open
const HEAD = mirror([
  [CX, 156], [216, 150], [190, 134, 1], [146, 54, 1], [118, 118], [102, 176, 1],
  [84, 192], [62, 204, 1], [78, 228], [48, 258, 1], [74, 274], [44, 318, 1], [76, 330], [52, 376, 1], [88, 382], [70, 428, 1], [110, 430], [104, 474, 1], [142, 466],
  [172, 500], [210, 528], [CX, 540],
]);
// the chest's ruff under the chin
const RUFF = [
  [30, 560, 1], [40, 470, 1], [70, 492], [82, 456, 1], [112, 486], [140, 470, 1], [CX, 520], [360, 470, 1], [388, 486], [418, 456, 1], [430, 492], [460, 470, 1], [470, 560, 1],
];
const EAR_IN = [[178, 140], [150, 82], [126, 152]];
const EYE = [[146, 246, 1], [176, 238], [204, 248], [220, 270, 1], [190, 274], [164, 264]];
const NOSE = [[CX - 38, 320], [CX, 312], [CX + 38, 320], [CX + 34, 340], [CX + 14, 358], [CX, 362, 1], [CX - 14, 358], [CX - 34, 340]];
// the open mouth: the upper lip's gull wing over the nose, the lower jaw's deep curve
const MOUTH = [
  [CX, 384, 1], [232, 376], [198, 378], [150, 392, 1], [164, 432], [196, 470], [CX, 490], [304, 470], [336, 432], [350, 392, 1], [302, 378], [268, 376],
];

/** A fang from its root (x, y) to its tip, `w` wide at the root, pointing down (dir 1) or up (-1). */
const fang = (x, y, w, len, dir, lean = 0) => smooth([[x - w / 2, y - dir * 8, 1], [x + w / 2, y - dir * 8, 1], [x + w * 0.42, y + dir * len * 0.4], [x + lean, y + dir * len, 1], [x - w * 0.36, y + dir * len * 0.5]], true, 0.18);

export default function draw({ lines, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(48, 560, 9, (y) => 0.6 + Math.max(0, 1 - (y - 40) / 300) * 2.4)}"/>`;
  blue += `<path d="${stars(10, [56, 50, 444, 170], [[CX, 300, 130], [146, 110, 50], [354, 110, 50]])}" fill="${PAPER}"/>`;

  const ruff = smooth(RUFF, true, 0.16);
  blue += cutout(ruff, 8);
  blue += carve([[[66, 548], [72, 510]], [[120, 548], [126, 506]], [[380, 548], [374, 506]], [[434, 548], [428, 510]]], 3);

  const head = smooth(HEAD, true, 0.18);
  blue += cutout(head);
  blue += `<clipPath id="bigwolf-head"><path d="${head}"/></clipPath><g clip-path="url(#bigwolf-head)">`;
  // the inner ears, the fur of the brow and cheeks, all running out from the snout
  blue += carve([EAR_IN, flip(EAR_IN)], 3.4);
  blue += carve([[[166, 132], [150, 104], [140, 140]], flip([[166, 132], [150, 104], [140, 140]])], 2.2);
  const fur = [
    [[232, 170], [236, 196], [238, 224]], [[214, 176], [216, 200], [222, 226]], [[196, 190], [200, 210]],
    [[126, 206], [112, 230], [96, 248]], [[124, 262], [108, 286], [88, 304]], [[146, 286], [130, 314], [110, 336]],
    [[120, 318], [104, 344], [84, 360]], [[146, 340], [130, 370], [112, 392]], [[118, 376], [104, 400], [90, 414]],
    [[150, 406], [136, 430], [122, 452]],
    [[178, 460], [190, 486], [206, 506]], [[220, 500], [236, 516]],
  ];
  blue += carve([...fur, ...fur.map(flip)], 3);
  blue += carve([[[CX, 168], [CX, 196]], [[CX - 8, 206], [CX - 4, 232]], [[CX + 8, 206], [CX + 4, 232]]], 2.4);
  // the muzzle's bridge down to the nose
  blue += carve([[[232, 256], [228, 290], [222, 318]], [[268, 256], [272, 290], [278, 318]]], 3.2);
  const muzzle = [[206, 284], [194, 330], [170, 376]];
  blue += carve([muzzle, flip(muzzle)], 3.4);
  blue += `</g>`;
  // heavy brows, scowling down to the middle
  const brow = [[138, 230], [180, 222], [226, 246]];
  blue += carve([brow, flip(brow)], 5);

  // the eyes: cut to paper (pink in print), slit pupils
  const eyes = smooth(EYE, true, 0.2) + smooth(flip(EYE), true, 0.2);
  blue += `<path d="${eyes}" fill="${PAPER}"/>`;
  blue += `<path d="M184,244C178,252 178,264 184,272C190,264 190,252 184,244ZM316,244C322,252 322,264 316,272C310,264 310,252 316,244Z" fill="${BLUE}"/>`;

  // the open jaws: the mouth cut away, a dark throat, a tongue, the teeth left standing
  const mouth = smooth(MOUTH, true, 0.2);
  blue += `<path d="${mouth}" fill="${PAPER}" stroke="${PAPER}" stroke-width="6" stroke-linejoin="round"/>`;
  blue += `<clipPath id="bigwolf-mouth"><path d="${mouth}"/></clipPath><g clip-path="url(#bigwolf-mouth)">`;
  blue += `<ellipse cx="${CX}" cy="430" rx="54" ry="30" fill="${BLUE}"/>`;
  blue += `<path d="M198,492C202,452 298,452 302,492Z" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4"/>`;
  blue += carve([[[CX, 466], [CX - 1, 478], [CX, 492]]], 3, BLUE);
  blue += `</g>`;
  blue += `<path d="${mouth}" fill="none" stroke="${BLUE}" stroke-width="4"/>`;
  const teeth = [
    fang(190, 382, 26, 62, 1, -2), fang(310, 382, 26, 62, 1, 2),
    fang(220, 380, 14, 22, 1), fang(240, 384, 12, 18, 1), fang(260, 384, 12, 18, 1), fang(280, 380, 14, 22, 1),
    fang(204, 474, 24, 50, -1, 2), fang(296, 474, 24, 50, -1, -2),
    fang(170, 440, 16, 26, -1, 4), fang(330, 440, 16, 26, -1, -4),
  ].join('');
  blue += `<path d="${teeth}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;

  // the nose, wet and black, over it all
  blue += cutout(smooth(NOSE, true, 0.2), 6);
  blue += `<path d="M232,334c6,-6 14,-4 16,2M268,334c-6,-6 -14,-4 -16,2" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;
  blue += carve([[[CX - 22, 322], [CX - 8, 318]]], 2.4);

  let pink = `<path d="${mouth}${eyes}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(3.6 * Math.max(0, 1 - Math.hypot((x - CX) * 0.8, y - 436) / 200), 2.8 * Math.max(0, 1 - Math.min(Math.hypot(x - 184, y - 258), Math.hypot(x - 316, y - 258)) / 70)))}"/>`;
  // the teeth stay bare paper: white prints nothing in the multiplied ink
  pink += `<path d="${teeth}" fill="#fff"/>`;
  void F; void polyD;
  return { blue, pink };
}
