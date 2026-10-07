// The White Werewolf: the werewolf turned inside out, a pale wolf left in the paper against the
// night, standing proud on a crag under a thin moon; one eye burns.
import { BLUE, PAPER, PINK, F, smooth, polyD, carve } from '../kit.mjs';

export const seed = 145;

const [mx, my, mr] = [104, 102, 44]; // the moon
const [ex, ey] = [126, 210]; // the eye

const WOLF = [
  [48, 232, 1], [60, 214], [102, 198], [130, 186], [146, 170], [152, 154], [166, 108, 1], [184, 148], [192, 164, 1], [206, 120, 1], [220, 168],
  [238, 192], [270, 220], [304, 240], [342, 248], [382, 250], [414, 258], [436, 278],
  // the tail, hanging heavy
  [448, 298], [462, 336], [464, 384], [452, 434, 1], [438, 400], [432, 352], [424, 326],
  // the near hind leg: the thigh, the hock bent back, the long foot
  [430, 344], [426, 384], [414, 420, 1], [414, 452], [420, 476, 1], [384, 476, 1], [392, 462], [392, 432], [380, 404], [362, 374], [344, 354],
  // the belly, the near foreleg, the chest's ruff, the jaw
  [316, 348], [280, 352], [256, 360], [252, 400], [246, 444], [248, 462], [244, 476, 1], [206, 476, 1], [214, 464], [222, 444], [222, 400], [214, 358],
  [200, 316, 1], [204, 304], [180, 290, 1], [188, 278], [160, 270, 1], [146, 268], [116, 264], [84, 258], [58, 246],
];
// the far legs, a step behind
const FAR_FORE = [[262, 352], [290, 350], [292, 400], [298, 440], [306, 464], [304, 476, 1], [272, 476, 1], [276, 462], [270, 436], [264, 400]];
const FAR_HIND = [[330, 340], [372, 352], [366, 396], [348, 430], [346, 462], [352, 476, 1], [318, 476, 1], [324, 460], [324, 424], [334, 392]];

export default function draw({ lines, halftone, stars }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="whitewolf-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${mx}" cy="${my}" r="${mr + 26}" fill="#000"/></mask>`;
  blue += `<path mask="url(#whitewolf-sky)" fill="${PAPER}" d="${lines(52, 500, 9, (y) => 0.5 + Math.max(0, 1 - Math.abs(y - my) / 300) * 2.2)}"/>`;
  for (let i = 0; i < 4; i++) blue += `<circle cx="${mx}" cy="${my}" r="${mr + 10 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(2.6 - i * 0.5)}" stroke-dasharray="${F(18 + i * 9)} ${F(6 + i * 2)}"/>`;
  blue += `<path d="${stars(14, [56, 56, 444, 230], [[mx, my, mr + 50], [180, 180, 80]])}" fill="${PAPER}"/>`;
  // the thin moon
  const moon = (id, fill) => `<mask id="whitewolf-${id}"><circle cx="${mx}" cy="${my}" r="${mr}" fill="#fff"/><circle cx="${mx + 15}" cy="${my - 7}" r="${mr - 2}" fill="#000"/></mask><rect mask="url(#whitewolf-${id})" x="${mx - mr}" y="${my - mr}" width="${mr * 2}" height="${mr * 2}" fill="${fill}"/>`;
  blue += moon('moon-b', PAPER);

  // the crag he stands on
  const crag = 'M30,560L30,520C70,508 110,500 150,496L184,478L240,474L300,480L360,474L420,470L470,476L470,560Z';
  blue += `<path d="${crag}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += carve([[[184, 486], [196, 512], [190, 548]], [[300, 488], [312, 520], [306, 548]], [[420, 480], [410, 516], [418, 548]], [[100, 512], [118, 530]], [[250, 494], [270, 506]], [[360, 486], [380, 500]]], 2.6);

  // the wolf, cut out of the block: paper, a ring of wood around him, his fur carved back in ink
  const far = smooth(FAR_FORE) + smooth(FAR_HIND);
  blue += `<path d="${far}" fill="${PAPER}" stroke="${BLUE}" stroke-width="10" stroke-linejoin="round"/><path d="${far}" fill="${PAPER}"/>`;
  blue += carve([[[272, 366], [278, 420], [288, 466]], [[350, 364], [344, 410], [334, 462]], [[282, 372], [286, 410]], [[360, 370], [354, 400]]], 2.4, BLUE);
  const wolf = smooth(WOLF, true, 0.18);
  blue += `<path d="${wolf}" fill="${PAPER}" stroke="${BLUE}" stroke-width="12" stroke-linejoin="round"/><path d="${wolf}" fill="${PAPER}"/>`;
  blue += `<clipPath id="whitewolf-body"><path d="${wolf}"/></clipPath><g clip-path="url(#whitewolf-body)">`;
  blue += carve([
    // the ruff down the neck and chest
    [[214, 200], [220, 236], [212, 270]], [[236, 210], [246, 250], [240, 290]], [[262, 228], [270, 270], [262, 310]], [[288, 246], [294, 286], [286, 330]],
    // the flank and the thigh
    [[330, 270], [344, 300], [342, 336]], [[364, 268], [380, 296], [394, 330]], [[398, 284], [412, 312], [410, 348]],
    // the tail
    [[440, 310], [450, 350], [450, 400]], [[432, 330], [440, 370], [444, 410]],
    // the legs
    [[234, 380], [234, 430], [228, 466]], [[402, 424], [402, 448], [404, 470]], [[376, 384], [394, 412]],
    // the ear's inside, the jaw
    [[172, 128], [178, 152]], [[72, 244], [104, 242], [138, 250]],
  ], 2.6, BLUE);
  blue += `</g>`;
  // the nose, the eye
  blue += `<path d="M44,230C46,218 58,212 70,218C72,230 60,238 46,238Z" fill="${BLUE}"/>`;
  const eye = `M${ex - 16},${ey + 4}Q${ex - 2},${ey - 10} ${ex + 16},${ey - 6}Q${ex + 4},${ey + 8} ${ex - 16},${ey + 4}Z`;
  blue += `<path d="${eye}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4" stroke-linejoin="round"/><circle cx="${ex + 1}" cy="${ey - 1}" r="3.4" fill="${BLUE}"/>`;
  blue += carve([[[106, 196], [124, 190], [144, 194]]], 3.4, BLUE);

  let pink = moon('moon-p', PINK);
  pink += `<path d="${eye}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(3.4 * Math.max(0, 1 - Math.hypot(x - mx, y - my) / 130), 2.2 * Math.max(0, 1 - Math.hypot(x - ex, y - ey) / 40)))}"/>`;
  void polyD;
  return { blue, pink };
}
