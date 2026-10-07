// The Fox: a fox with a great bushy tail, nose to the ground, following a scent that curls up into the night.
import { BLUE, PAPER, PINK, F, smooth, limb, almond, carve, cutout, circleD } from '../kit.mjs';

export const seed = 105;

const GROUND = 519;
// drawn big, then fitted into the block
const S = (pts) => pts.map(([x, y, c]) => [x * 0.94 + 26, y * 0.94 + 30, c]);
const W = (pts) => pts.map(([x, y, w]) => [x * 0.94 + 26, y * 0.94 + 30, w * 0.94]);
// the fox, walking left, head down: snout, ears, back, the near hind leg, belly, the near foreleg, chest
const FOX = S([
  [64, 462, 1], [84, 448], [110, 430], [136, 412], [152, 398],
  [156, 390], [154, 336, 1], [186, 370], [194, 366], [208, 318, 1], [216, 358],
  [238, 342], [266, 320], [302, 308], [342, 306], [372, 314], [394, 334], [402, 360], [398, 390], [388, 420],
  [378, 452], [384, 488], [390, 520, 1], [366, 520, 1], [364, 504], [364, 478], [358, 452], [340, 424],
  [314, 410], [282, 412], [256, 416], [242, 440], [238, 484], [238, 520, 1], [216, 520, 1], [220, 500], [220, 470], [214, 444],
  [204, 424], [186, 420], [168, 428], [144, 442], [116, 456], [92, 466], [74, 468],
]);
const FAR_LEGS = [W([[234, 416, 26], [216, 470, 17], [198, 516, 15]]), W([[372, 404, 32], [352, 460, 19], [334, 516, 15]])];
const TAIL = W([[380, 344, 30], [394, 300, 56], [402, 250, 72], [402, 196, 76], [390, 142, 66], [366, 106, 48], [338, 88, 26], [316, 84, 4]]);
// the scent: from the ground in front of the nose, curling up into the sky
const SCENT = [[78, 500], [54, 482], [50, 442], [72, 406], [102, 386], [114, 350], [94, 316], [68, 296], [62, 258], [88, 226], [130, 214], [168, 226], [196, 210], [204, 178], [184, 150], [154, 146], [140, 168], [156, 188], [180, 180]];

/** Points along a smooth curve through `pts`, every `step` units. */
function along(pts, step) {
  const n = pts.length, dense = [];
  const P = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let t = 0; t < 1; t += 0.02) {
      const t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  const out = [dense[0]];
  let acc = 0;
  for (let i = 1; i < dense.length; i++) {
    acc += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
    if (acc >= step) { out.push(dense[i]); acc = 0; }
  }
  return out;
}

export default function draw({ lines, halftone, stars, R }) {
  const trail = along(SCENT, 17);
  const trailD = trail.map(([x, y], i) => circleD(x, y, 5.6 - (i / trail.length) * 2.2)).join('');
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="fox-sky"><rect width="500" height="700" fill="#fff"/><path d="${smooth(SCENT, false)}" fill="none" stroke="#000" stroke-width="30" stroke-linecap="round"/></mask>`;
  blue += `<path mask="url(#fox-sky)" fill="${PAPER}" d="${lines(52, 476, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 240) / 300) * 1.9)}"/>`;
  blue += `<path d="${stars(9, [56, 56, 450, 330], [[140, 200, 80], [96, 380, 60], [400, 200, 110], [250, 380, 90]])}" fill="${PAPER}"/>`;
  // the ground he walks on
  blue += `<path d="M30,482C160,476 340,478 470,474L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path fill="${PAPER}" d="${lines(526, 552, 7, () => 1.4, 40, 460)}"/>`;
  let grass = '';
  for (const [x, y] of [[420, 512], [452, 500], [150, 530], [70, 534], [286, 540]]) grass += `M${x - 10},${y}L${x - 4},${y - 16}L${x},${y}L${x + 5},${y - 20}L${x + 9},${y}L${x + 14},${y - 12}L${x + 16},${y}Z`;
  blue += `<path d="${grass}" fill="${PAPER}"/>`;
  void R;

  // the scent, a dotted trail
  blue += `<path d="${trailD}" fill="${PAPER}"/>`;

  // the far legs, the tail, the fox
  for (const l of FAR_LEGS) blue += cutout(limb(l, true), 7);
  const tail = limb(TAIL, true);
  blue += cutout(tail, 9);
  blue += `<clipPath id="fox-tail"><path d="${tail}"/></clipPath><g clip-path="url(#fox-tail)">`;
  let zig = 'M300,190';
  for (let x = 300, k = 0; x <= 470; x += 11, k++) zig += `L${x},${F(150 + (x - 300) * 0.42 + (k % 2 ? -9 : 9))}`;
  const tip = zig + 'L470,40L300,40Z';
  blue += `<path d="${tip}" fill="${PAPER}"/>`;
  // the brush: chevrons of fur down its middle, strokes along its sides
  const mid = TAIL.slice(1, 5);
  for (let i = 0; i < mid.length; i++) {
    const [x, y] = mid[i];
    blue += carve([[[x - 22, y + 10], [x, y - 8], [x + 22, y + 10]]], 2.8);
  }
  blue += carve([[[366, 360], [382, 320], [390, 276]], [[424, 300], [430, 260], [428, 226]], [[376, 300], [380, 250]]], 2.6);
  blue += carve([[[338, 132], [360, 118], [378, 116]], [[318, 112], [338, 104]]], 2.4, BLUE);
  blue += `</g>`;
  const fox = smooth(FOX, true, 0.18);
  blue += cutout(fox);
  blue += `<clipPath id="fox-body"><path d="${fox}"/></clipPath><g clip-path="url(#fox-body)">`;
  // the cheek ruff, the shoulder, the haunch, the fur along the back
  blue += carve([[[184, 392], [196, 412], [190, 432]], [[236, 360], [248, 392], [240, 424]], [[350, 330], [372, 364], [368, 404]], [[276, 330], [316, 322], [354, 324]], [[264, 364], [282, 380], [276, 404]], [[300, 360], [320, 376]]].map(S), 3.2);
  blue += carve([[[230, 460], [230, 500]], [[372, 466], [374, 500]], [[204, 396], [214, 404]]].map(S), 2.4);
  // the pale throat
  blue += `<path d="${smooth(S([[92, 474, 1], [118, 464], [146, 450], [170, 436], [190, 430], [210, 434, 1], [208, 412, 1], [198, 420], [190, 402, 1], [182, 418], [170, 408, 1], [164, 426], [150, 420, 1], [144, 436], [128, 436, 1], [118, 448], [100, 454, 1]]), true, 0.16)}" fill="${PAPER}"/>`;
  blue += `</g>`;
  // ears, eye, nose
  blue += carve([[[162, 352], [168, 380]], [[208, 334], [206, 362]]].map(S), 2.4);
  const [ex, ey] = S([[124, 424]])[0];
  blue += `<path d="${almond(ex, ey, 8, 3)}" fill="${PAPER}" transform="rotate(-30 ${ex} ${ey})"/>`;
  const [nx, ny] = S([[68, 464]])[0];
  blue += `<circle cx="${F(nx)}" cy="${F(ny)}" r="5.4" fill="${PAPER}"/>`;
  blue += carve([[[76, 472], [96, 470], [116, 462]]].map(S), 2.2);

  let pink = `<path d="${trailD}" fill="${PINK}"/>`;
  pink += `<g clip-path="url(#fox-tail)"><path d="${tip}" fill="${PINK}"/></g>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => {
    let v = 3 * Math.max(0, 1 - Math.hypot(x - 366, y - 130) / 100);
    for (const [tx, ty] of trail) v = Math.max(v, 3 * Math.max(0, 1 - Math.hypot(x - tx, y - ty) / 46));
    return v;
  })}"/>`;
  return { blue, pink };
}
