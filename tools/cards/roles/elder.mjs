// The Elder: an old man, stooped over his staff, his long white beard flowing; above him, his two lives.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 73;

const HEARTS = [[244, 108, 36], [340, 100, 36]];
const [gx, gy] = [292, 106]; // the glow's centre

const ROBE = [
  [200, 560, 1], [204, 470], [214, 400], [224, 336], [214, 300],
  // the head, bowed forward: a long nose, a heavy brow, then back over the bald crown
  [178, 286, 1], [168, 272, 1], [150, 270, 1], [158, 252], [170, 238], [172, 226, 1], [180, 210], [196, 192], [226, 180], [256, 186], [276, 206], [284, 232], [290, 258],
  [320, 268], [362, 290], [398, 330], [420, 390], [434, 470], [446, 560, 1],
];
const BEARD = [
  [172, 280, 1], [206, 282], [236, 274, 1], [248, 302], [246, 350], [236, 396], [242, 440], [232, 484], [214, 530, 1], [208, 494], [192, 516, 1], [188, 474], [170, 494, 1],
  [172, 448], [160, 404], [168, 360], [160, 320],
];
const FRINGE = [[262, 222, 1], [282, 220], [296, 238], [302, 262], [300, 286, 1], [292, 268], [288, 290, 1], [282, 268], [274, 284, 1], [276, 258], [278, 238]];
// the near arm bent behind his back, the hand resting on it
const ARM = [[318, 296, 46], [348, 360, 42], [372, 410, 36], [404, 420, 32]];
const HAND = [[394, 402], [412, 396], [430, 406], [430, 426], [412, 434], [394, 428]];
const HAND_STAFF = [[124, 322], [138, 306], [160, 308], [168, 326], [160, 344], [136, 346]];
const STAFF = [[132, 560, 15], [128, 470, 14], [136, 390, 14], [132, 300, 13], [138, 230, 12], [134, 196, 12]];

/** A full heart, its point at the bottom. */
const fullHeart = (x, y, r) => `M${F(x)},${F(y + 0.98 * r)}C${F(x - 0.24 * r)},${F(y + 0.72 * r)} ${F(x - 1.06 * r)},${F(y + 0.24 * r)} ${F(x - r)},${F(y - 0.32 * r)}C${F(x - 0.94 * r)},${F(y - 0.9 * r)} ${F(x - 0.24 * r)},${F(y - 1.04 * r)} ${F(x)},${F(y - 0.52 * r)}C${F(x + 0.24 * r)},${F(y - 1.04 * r)} ${F(x + 0.94 * r)},${F(y - 0.9 * r)} ${F(x + r)},${F(y - 0.32 * r)}C${F(x + 1.06 * r)},${F(y + 0.24 * r)} ${F(x + 0.24 * r)},${F(y + 0.72 * r)} ${F(x)},${F(y + 0.98 * r)}Z`;

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="elder-sky"><rect width="500" height="700" fill="#fff"/>${HEARTS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 30}" fill="#000"/>`).join('')}</mask>`;
  blue += `<path mask="url(#elder-sky)" fill="${PAPER}" d="${lines(52, 560, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - gy) / 360) * 2.6)}"/>`;
  for (const [x, y, r] of HEARTS) {
    for (let i = 0; i < 2; i++) blue += `<path d="${fullHeart(x, y + 4, r + 12 + i * 10)}" fill="none" stroke="${PAPER}" stroke-width="${F(2.8 - i * 0.7)}" stroke-dasharray="${F(20 + R() * 20)} ${F(4 + R() * 5)}"/>`;
  }
  blue += `<path d="${stars(9, [56, 56, 444, 300], [[gx, gy, 140], [220, 280, 110], [130, 170, 40]])}" fill="${PAPER}"/>`;
  // a low hill he walks on
  blue += `<path d="M30,520C140,500 320,500 470,514L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;

  // the staff: gnarled, with a knot at the top
  blue += cutout(limb(STAFF), 8);
  blue += cutout(smooth([[134, 200], [114, 186], [110, 160], [126, 144], [150, 148], [160, 170], [152, 194]]), 7);
  blue += carve([[[128, 520], [132, 470]], [[134, 260], [131, 232]]], 2.4);
  blue += carve([[[122, 166], [134, 158], [146, 168]]], 2.4);

  const robe = smooth(ROBE);
  blue += cutout(robe);
  blue += `<clipPath id="elder-robe"><path d="${robe}"/></clipPath><g clip-path="url(#elder-robe)">`;
  blue += carve([[[260, 440], [276, 500], [282, 560]], [[316, 450], [330, 500], [336, 560]], [[386, 450], [396, 500], [400, 560]], [[296, 290], [330, 330]]], 3);
  blue += carve([[[214, 196], [232, 190], [250, 196]], [[204, 210], [220, 204], [236, 208]]], 2.2);
  blue += `</g>`;

  // the near arm, bent behind his stooped back
  blue += cutout(limb([[300, 280, 30], ...ARM], true), 8);
  blue += carve([[[322, 316], [346, 370], [368, 398]]], 2.6);
  blue += carve([[[380, 404], [386, 418], [384, 434]]], 3);
  blue += cutout(smooth(HAND), 6);
  blue += carve([[[402, 408], [416, 406], [426, 412]], [[400, 420], [414, 420], [424, 424]]], 2.2);

  // white hair and beard: cut away to paper, their strands left in the wood
  const beard = smooth(BEARD);
  for (const d of [smooth(FRINGE), beard]) blue += `<path d="${d}" fill="${PAPER}" stroke="${PAPER}" stroke-width="8" stroke-linejoin="round"/><path d="${d}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;
  blue += carve([[[200, 292], [216, 340], [212, 390], [222, 440], [214, 490]], [[184, 300], [186, 350], [180, 400], [192, 450], [196, 490]], [[222, 290], [234, 330], [228, 380]], [[172, 330], [172, 380], [178, 430]], [[228, 410], [232, 450], [222, 490]]], 2.2, BLUE);
  blue += carve([[[284, 232], [290, 252], [292, 270]]], 1.8, BLUE);
  // the brow, bushy and pale, over a narrowed eye; the moustache over the beard
  blue += `<path d="M168,224C182,208 206,208 226,220C212,224 196,226 184,236Z" fill="${PAPER}"/>`;
  blue += carve([[[192, 240], [202, 244], [212, 240]]], 2.8);
  blue += `<path d="M148,282C164,266 196,266 214,282C196,290 168,296 148,282Z" fill="${PAPER}" stroke="${BLUE}" stroke-width="2.6"/>`;
  blue += carve([[[256, 238], [250, 252], [258, 264]]], 2.6);

  blue += cutout(smooth(HAND_STAFF), 6);
  blue += carve([[[132, 316], [146, 314], [160, 318]], [[130, 330], [144, 328], [158, 332]]], 2.2);

  let hearts = '';
  for (const [x, y, r] of HEARTS) hearts += fullHeart(x, y, r);
  blue += `<path d="${hearts}" fill="${PAPER}"/>`;
  let pink = `<path d="${hearts}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot((x - gx) * 0.8, y - gy) / 210))}"/>`;
  return { blue, pink };
}
