// The Hunter: a bearded hunter in a feathered hat, his long rifle levelled at a target sun.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 57;

const [dx, dy, dr] = [374, 362, 84]; // the target sun, low on the right
// the rifle's line, from the butt at the shoulder to the muzzle inside the target
const A = [150, 258], B = [430, 316];
const along = (t, off = 0) => {
  const ux = B[0] - A[0], uy = B[1] - A[1], len = Math.hypot(ux, uy);
  return [A[0] + ux * t - (uy / len) * off, A[1] + uy * t + (ux / len) * off];
};

// the head against the sky: back of the head, then the face under the brim with its cheek on the stock
const BODY = [
  [36, 560, 1], [42, 460], [60, 380], [88, 318], [120, 284],
  [130, 252], [128, 214], [134, 190],
  [222, 186], [226, 202], [232, 214, 1], [238, 226], [260, 246, 1], [242, 252, 1], [254, 262], [238, 270, 1],
  [244, 292], [238, 318], [222, 344, 1], [210, 332], [208, 350, 1], [226, 384], [240, 450], [250, 560, 1],
];
const BRIM = [[104, 200, 1], [118, 186], [176, 180], [238, 176], [272, 170, 1], [250, 190], [176, 198], [122, 204]];
const CROWN = [[126, 192, 1], [130, 152], [142, 118], [170, 112], [186, 124, 1], [204, 110], [226, 116], [234, 152], [240, 186, 1]];
const FEATHER = [[150, 152, 5], [136, 126, 15], [122, 100, 20], [110, 78, 18], [102, 62, 10], [98, 52, 2]];
// the near arm: a round shoulder, the elbow dropped, the forearm up to the fore-stock
const ARM = [[134, 336, 66], [168, 372, 56], [206, 404, 48], [244, 374, 42], [276, 334, 36], [294, 306, 30]];
const HAND_FRONT = [[280, 304], [288, 286], [310, 282], [324, 292], [316, 310], [294, 314]];

export default function draw({ rays, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path d="${rays(dx, dy, dr + 30, 620, 46, 2.4)}" fill="${PAPER}"/>`;
  for (let i = 0; i < 3; i++) blue += `<circle cx="${dx}" cy="${dy}" r="${dr + 10 + i * 8}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.7)}"/>`;
  blue += `<path d="${stars(9, [56, 56, 444, 250], [[dx, dy, dr + 50], [170, 150, 110]])}" fill="${PAPER}"/>`;
  // the target: rings in the sun
  blue += `<circle cx="${dx}" cy="${dy}" r="${dr}" fill="${PAPER}"/>`;
  for (const r of [dr - 14, dr - 32, dr - 50, dr - 66]) blue += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="${BLUE}" stroke-width="3.4"/>`;
  blue += `<circle cx="${dx}" cy="${dy}" r="9" fill="${BLUE}"/>`;

  // the rifle: its stock against his far cheek, hidden by his head; the fore-stock, barrel and sight
  const R = (pts) => pts.map(([t, o, c]) => [...along(t, o), c]);
  const rifle = smooth(R([
    [0, -16, 1], [0.12, -12], [0.2, -8, 1], [0.34, -10, 1], [0.64, -8, 1], [0.64, -5.5, 1], [0.98, -5.5, 1], [0.98, -11, 1], [1, -11, 1], [1, 5, 1],
    [0.62, 5, 1], [0.6, 11, 1], [0.34, 11, 1], [0.28, 9, 1], [0.24, 12], [0.2, 11, 1], [0.12, 14], [0, 20, 1],
  ]));
  blue += cutout(rifle, 9);
  blue += carve([R([[0.03, -4], [0.1, -2], [0.18, 2]]), R([[0.36, 1], [0.58, 1]])], 2.4);
  const guard = along(0.25, 12);
  blue += `<path d="M${F(guard[0] - 10)},${F(guard[1] - 2)}q10,16 20,0" fill="none" stroke="${PAPER}" stroke-width="9"/><path d="M${F(guard[0] - 10)},${F(guard[1] - 2)}q10,16 20,0" fill="none" stroke="${BLUE}" stroke-width="3.4"/>`;

  // the coat: a collar and a couple of folds
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="hunter-body"><path d="${body}"/></clipPath><g clip-path="url(#hunter-body)">`;
  blue += carve([[[78, 420], [70, 490], [64, 560]], [[200, 452], [212, 506], [214, 560]]], 3);
  blue += carve([[[120, 300], [150, 326], [164, 360]]], 3);
  blue += carve([[[236, 300], [230, 318], [222, 334]], [[226, 296], [220, 314]], [[250, 262], [236, 262], [222, 256]]], 2.4);
  blue += `</g>`;
  // the aiming eye squeezed shut, a heavy brow, the ear
  blue += carve([[[204, 224], [216, 228], [228, 222]]], 3.2);
  blue += carve([[[200, 208], [216, 202], [232, 206]]], 4);
  blue += carve([[[160, 216], [150, 234], [162, 250]]], 2.8);

  // a pale feather in the hat band
  const feather = limb(FEATHER, true);
  blue += `<path d="${feather}" fill="${PAPER}" stroke="${PAPER}" stroke-width="12"/><path d="${feather}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4"/>`;
  blue += carve([[[148, 150], [132, 118], [116, 88], [104, 66], [100, 56]]], 2.6, BLUE);
  blue += carve([[136, 122], [126, 104], [116, 86], [108, 70]].map(([x, y]) => [[x, y], [x + 9, y - 4]]), 2, BLUE);
  blue += carve([[130, 116], [120, 98], [110, 80], [102, 66]].map(([x, y]) => [[x, y], [x - 9, y + 3]]), 2, BLUE);
  const crown = smooth(CROWN);
  blue += cutout(crown, 8);
  blue += carve([[[132, 170], [184, 164], [236, 166]]], 6);
  blue += cutout(smooth(BRIM), 7);

  // the near arm, bent up to the fore-stock, with a cuff at the wrist
  blue += cutout(limb(ARM, true), 9);
  blue += carve([[[150, 330], [134, 354], [130, 380]]], 2.6);
  blue += carve([[[184, 386], [206, 398], [226, 392]], [[266, 330], [282, 340]]], 2.6);
  blue += cutout(smooth(HAND_FRONT), 6);
  blue += carve([[[292, 294], [306, 298], [318, 294]]], 2.2);

  let pink = `<circle cx="${dx}" cy="${dy}" r="${dr}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - dx, y - dy) / 230))}"/>`;
  return { blue, pink };
}
