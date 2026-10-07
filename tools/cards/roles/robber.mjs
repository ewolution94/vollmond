// The Robber: a bandit under a wide hat, a bandana over his face, snatching a card out of the air.
import { BLUE, PAPER, PINK, F, smooth, limb, firs, star4, carve, cutout } from '../kit.mjs';

export const seed = 151;

const [kx, ky, ka] = [386, 122, 24]; // the card: centre, tilt
const [kw, kh] = [66, 94];

const TORSO = [[56, 560, 1], [62, 450], [80, 372], [116, 334], [168, 318], [228, 322], [278, 336], [310, 362], [328, 420], [334, 560, 1]];
const HEAD = [[156, 306], [142, 260], [150, 214], [246, 208], [254, 226, 1], [264, 246], [278, 264, 1], [266, 272], [262, 292], [248, 314], [218, 322], [186, 318]];
const BANDANA = [[146, 252], [204, 250], [262, 244, 1], [284, 266, 1], [270, 282], [258, 312], [236, 346, 1], [206, 320], [170, 304], [150, 290]];
const KNOT = [[[148, 262, 12], [122, 268, 10], [96, 262, 6], [78, 272, 2]], [[148, 274, 12], [126, 290, 9], [104, 300, 6], [92, 318, 2]]];
const BRIM = [[80, 222, 1], [126, 202], [200, 190], [274, 186], [322, 194, 1], [278, 208], [200, 214], [128, 224]];
const CROWN = [[134, 208, 1], [140, 156], [158, 120], [190, 112], [206, 124, 1], [222, 112], [248, 120], [262, 156], [270, 202, 1]];
const ARM = [[292, 368, 52], [314, 310, 44], [334, 250, 38], [346, 200, 32]];
const HAND = [[322, 208], [318, 182], [330, 160], [352, 152], [370, 162], [372, 186], [358, 204], [340, 214]];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="robber-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${kx}" cy="${ky}" r="86" fill="#000"/></mask>`;
  blue += `<path mask="url(#robber-sky)" fill="${PAPER}" d="${lines(52, 500, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - ky) / 320) * 2.6)}"/>`;
  blue += `<path d="${stars(9, [56, 56, 444, 300], [[kx, ky, 120], [200, 200, 140]])}" fill="${PAPER}"/>`;
  // the woods behind him
  blue += `<path d="${firs([[372, 520, 150, 84], [430, 524, 190, 100], [478, 520, 130, 76], [330, 524, 96, 60]])}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += `<path d="M30,520C150,512 330,516 470,508L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;

  // the card's flight: swept lines behind it, the way it came
  const swish = [[[kx + 30, ky - 66], [kx + 44, ky - 80], [kx + 50, ky - 100]], [[kx + 46, ky - 36], [kx + 60, ky - 52], [kx + 68, ky - 74]], [[kx + 54, ky - 2], [kx + 66, ky - 20], [kx + 72, ky - 42]]];
  blue += carve(swish, 3.2);

  // the coat and the bandit's head
  const torso = smooth(TORSO);
  blue += cutout(torso);
  blue += `<clipPath id="robber-coat"><path d="${torso}"/></clipPath><g clip-path="url(#robber-coat)">`;
  blue += carve([[[200, 330], [210, 420], [206, 560]], [[120, 420], [112, 490], [110, 560]], [[260, 440], [270, 500], [272, 560]]], 3);
  // a short cape over the shoulders, fastened at the throat
  blue += carve([[[70, 420], [140, 400], [210, 396], [270, 404], [320, 420]]], 3.4);
  blue += `<circle cx="214" cy="344" r="9" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += `</g>`;
  const head = smooth(HEAD);
  blue += cutout(head, 8);
  blue += carve([[[166, 256], [160, 276], [168, 292]]], 2.8);
  // the narrowed eye under a heavy brow
  blue += `<path d="M222,234Q236,226 250,232Q236,240 222,234Z" fill="${PAPER}"/>`;
  blue += carve([[[214, 222], [234, 218], [254, 224]]], 4);
  // the bandana: its knot and tails at the back, the cloth hung over nose and mouth
  blue += `<path d="${KNOT.map((k) => limb(k, true)).join('')}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round"/>`;
  const bandana = smooth(BANDANA, true, 0.18);
  blue += cutout(bandana, 6);
  blue += `<clipPath id="robber-cloth"><path d="${bandana}"/></clipPath><g clip-path="url(#robber-cloth)">`;
  let dots = '';
  for (let y = 258, r = 0; y < 350; y += 14, r++) for (let x = 150 + (r % 2) * 9; x < 290; x += 18) dots += `M${x - 3},${y}a3,3 0 1 0 6,0a3,3 0 1 0 -6,0Z`;
  blue += `<path d="${dots}" fill="${PAPER}"/>`;
  blue += `</g>`;
  blue += carve([[[268, 272], [258, 296], [242, 326]]], 2.4);

  // the hat
  const crown = smooth(CROWN, true, 0.18);
  blue += cutout(crown, 8);
  blue += carve([[[140, 186], [204, 180], [266, 184]], [[140, 198], [204, 192], [268, 196]]], 3);
  blue += cutout(smooth(BRIM, true, 0.18), 7);
  blue += carve([[[110, 214], [200, 202], [292, 198]]], 2.4);

  // the arm thrown up, and the card caught at its corner
  blue += cutout(limb(ARM, true), 9);
  blue += carve([[[300, 330], [318, 286], [332, 240]], [[330, 220], [352, 226]]], 2.6);
  const card = `<rect x="${kx - kw / 2}" y="${ky - kh / 2}" width="${kw}" height="${kh}" rx="6"`;
  blue += `<g transform="rotate(${ka} ${kx} ${ky})">${card} fill="${PAPER}" stroke="${PAPER}" stroke-width="10"/>${card} fill="${PAPER}" stroke="${BLUE}" stroke-width="4"/>`;
  blue += `<rect x="${kx - kw / 2 + 8}" y="${ky - kh / 2 + 8}" width="${kw - 16}" height="${kh - 16}" rx="3" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
  blue += `<path d="${star4(kx, ky, 16)}" fill="${BLUE}"/><circle cx="${kx}" cy="${ky}" r="24" fill="none" stroke="${BLUE}" stroke-width="2.2" stroke-dasharray="4 4"/></g>`;
  blue += cutout(smooth(HAND), 7);
  blue += carve([[[328, 174], [344, 170], [360, 174]], [[326, 188], [342, 184], [360, 188]], [[330, 162], [344, 154]]], 2.4);

  let pink = `<g transform="rotate(${ka} ${kx} ${ky})">${card} fill="${PINK}"/></g>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - kx, y - ky) / 190))}"/>`;
  void F; void R;
  return { blue, pink };
}
