// The Minion: a hunched, bald servant, head bowed low, holding a wolf mask up high for his masters.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 149;

const [mx, my] = [250, 146]; // the mask's centre
const flip = (pts) => pts.map(([x, y, c]) => [500 - x, y, c]);
const mirror = (half) => [...half, ...flip(half.slice(1, -1)).reverse()];
/** Mask points drawn around (352, 168), moved to the mask's centre. */
const S = (pts) => pts.map(([x, y, c]) => [x + mx - 352, y + my - 168, c]);

const MASK = mirror(S([
  [352, 122], [326, 114], [306, 74, 1], [292, 120], [280, 152, 1], [292, 166], [282, 188, 1], [298, 204], [316, 238], [334, 262], [352, 272],
]));
const EYE = (s) => `M${mx + s * 46},${my - 10}Q${mx + s * 28},${my - 20} ${mx + s * 10},${my + 4}Q${mx + s * 30},${my + 10} ${mx + s * 46},${my - 10}Z`;

const CLOAK = [[70, 560, 1], [84, 470], [112, 404], [156, 368], [206, 352], [250, 350], [294, 352], [344, 368], [388, 404], [416, 470], [430, 560, 1]];
// the arm (the left; the right is its mirror): up from the shoulder, the elbow out, the hand at the mask's side
const ARM = [[196, 392, 54], [146, 356, 46], [122, 300, 40], [146, 246, 34], [172, 208, 28]];
const HAND = [[160, 214], [158, 190], [172, 176], [190, 180], [196, 200], [186, 220], [172, 226]];
// the head, bowed: the bald crown toward us, the face tucked down beneath it
const [hx, hy] = [250, 346];
const HEAD = [[hx, hy - 54], [hx + 32, hy - 46], [hx + 48, hy - 20], [hx + 50, hy + 10], [hx + 40, hy + 38], [hx + 22, hy + 54], [hx, hy + 58], [hx - 22, hy + 54], [hx - 40, hy + 38], [hx - 50, hy + 10], [hx - 48, hy - 20], [hx - 32, hy - 46]];
const EAR = [[hx - 46, hy + 2], [hx - 62, hy - 6], [hx - 66, hy + 14], [hx - 56, hy + 30], [hx - 42, hy + 26]];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="minion-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${mx}" cy="${my}" r="124" fill="#000"/></mask>`;
  blue += `<path mask="url(#minion-sky)" fill="${PAPER}" d="${lines(52, 540, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - my) / 320) * 2.6)}"/>`;
  for (let i = 0; i < 6; i++) blue += `<circle cx="${mx}" cy="${my}" r="${112 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.4)}" stroke-dasharray="${F(26 + R() * 30)} ${F(4 + R() * 6)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 444, 330], [[mx, my, 190], [130, 300, 70], [370, 300, 70]])}" fill="${PAPER}"/>`;

  // the mask's ties, hanging loose behind his hands
  blue += `<path d="M${mx - 72},${my + 8}C${mx - 90},${my + 40} ${mx - 82},${my + 70} ${mx - 96},${my + 104}M${mx + 72},${my + 8}C${mx + 90},${my + 40} ${mx + 82},${my + 70} ${mx + 96},${my + 104}" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;

  // the hunched shoulders under a ragged cloak, a patch, a rope belt
  const cloak = smooth(CLOAK);
  blue += cutout(cloak);
  blue += `<clipPath id="minion-cloak"><path d="${cloak}"/></clipPath><g clip-path="url(#minion-cloak)">`;
  blue += carve([[[250, 410], [246, 480], [250, 560]], [[200, 420], [190, 490], [182, 560]], [[300, 420], [312, 490], [318, 560]], [[140, 450], [124, 510], [116, 560]], [[360, 450], [376, 510], [384, 560]]], 3);
  blue += `<path d="M300,482L338,476L342,512L304,518Z" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path d="M308,474V486M322,472V484M336,470V482M298,498H310M336,494H348M312,512V524M328,510V522" stroke="${PAPER}" stroke-width="2"/>`;
  blue += `<path d="M96,468C180,484 320,484 404,468" fill="none" stroke="${PAPER}" stroke-width="9"/><path d="M96,468C180,484 320,484 404,468" fill="none" stroke="${BLUE}" stroke-width="3.4"/>`;
  blue += carve([[[226, 480], [220, 510], [228, 540]], [[238, 482], [240, 514]]], 3);
  blue += `</g>`;

  // the arms raised in their sleeves
  for (const side of [ARM, flip(ARM)]) blue += cutout(limb(side, true), 8);
  const sleeve = [[[132, 330], [130, 296], [146, 262]], [[176, 380], [152, 356], [136, 330]]];
  blue += carve([...sleeve, ...sleeve.map(flip)], 2.6);
  const cuff = [[[150, 236], [172, 248]]];
  blue += carve([...cuff, ...cuff.map(flip)], 3);

  // the bowed head: the bald crown, the ears, the brows, a long nose, eyes shut
  const ears = smooth(EAR) + smooth(flip(EAR));
  blue += cutout(ears, 6);
  blue += carve([[[hx - 54, hy + 4], [hx - 58, hy + 14], [hx - 50, hy + 22]], flip([[hx - 54, hy + 4], [hx - 58, hy + 14], [hx - 50, hy + 22]])], 2.2);
  const head = smooth(HEAD);
  blue += cutout(head, 7);
  blue += carve([[[hx - 22, hy - 34], [hx - 6, hy - 40], [hx + 14, hy - 38]], [[hx - 30, hy - 20], [hx - 20, hy - 26]]], 2.4);
  blue += carve([[[hx - 34, hy + 8], [hx - 18, hy + 2], [hx - 4, hy + 8]], [[hx + 4, hy + 8], [hx + 18, hy + 2], [hx + 34, hy + 8]]], 4);
  blue += carve([[[hx - 28, hy + 20], [hx - 18, hy + 24], [hx - 8, hy + 20]], [[hx + 8, hy + 20], [hx + 18, hy + 24], [hx + 28, hy + 20]]], 2.6);
  blue += `<path d="M${hx - 4},${hy + 14}C${hx - 10},${hy + 30} ${hx - 12},${hy + 44} ${hx},${hy + 50}C${hx + 12},${hy + 44} ${hx + 10},${hy + 30} ${hx + 4},${hy + 14}" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>`;

  // the hands at the mask's sides, and the mask: a wolf's face, ears up, its eyes cut through
  const mask = smooth(MASK, true, 0.18);
  blue += cutout(mask, 9);
  blue += `<clipPath id="minion-mask"><path d="${mask}"/></clipPath><g clip-path="url(#minion-mask)">`;
  const fur = [[[312, 120], [306, 92]], [[324, 140], [336, 150]], [[300, 182], [314, 196]], [[310, 214], [324, 226]]].map(S);
  blue += carve([...fur, ...fur.map(flip)], 2.6);
  blue += carve([[[352, 130], [352, 150]], [[342, 190], [338, 220], [344, 244]], [[362, 190], [366, 220], [360, 244]]].map(S), 2.8);
  blue += `</g>`;
  const eyes = EYE(-1) + EYE(1);
  blue += `<path d="${eyes}" fill="${PAPER}" stroke="${PAPER}" stroke-width="2" stroke-linejoin="round"/>`;
  blue += `<path d="M${mx - 18},${my + 76}C${mx - 8},${my + 64} ${mx + 8},${my + 64} ${mx + 18},${my + 76}C${mx + 10},${my + 90} ${mx - 10},${my + 90} ${mx - 18},${my + 76}Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  const hands = smooth(HAND) + smooth(flip(HAND));
  blue += cutout(hands, 6);
  const fingers = [[[176, 186], [188, 192]], [[178, 198], [192, 202]], [[176, 210], [188, 212]]];
  blue += carve([...fingers, ...fingers.map(flip)], 2.2);

  let pink = `<path d="${eyes}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot((x - mx) * 0.8, y - my + 6) / 170))}"/>`;
  return { blue, pink };
}
