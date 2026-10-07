// The Stuttering Judge: a judge in a great curled wig behind his bench, gavel raised; on the block, the
// burst of his strike, twice over.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 110;

const [hx, hy] = [206, 206]; // the face
const BENCH = 432;
const BURSTS = [[380, 404, 62], [436, 352, 40]];

const WIG = [
  [106, 344, 1], [100, 290], [104, 230], [116, 172], [148, 128], [206, 108], [264, 128], [296, 172], [308, 230], [312, 290], [306, 344, 1],
  [284, 350], [264, 344, 1], [258, 300], [250, 266], [206, 280], [162, 266], [154, 300], [148, 344, 1], [128, 350],
];
const ROBE = [[52, 560, 1], [62, 470], [80, 380], [110, 330], [160, 306], [206, 300], [252, 306], [302, 330], [332, 380], [350, 470], [360, 560, 1]];
const ARM = [[290, 340, 62], [318, 288, 52], [340, 236, 42], [350, 210, 36]];

function burst(x, y, r, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.46 : r * (0.9 + ((i * 7) % 5) * 0.05);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return polyD(pts);
}

export default function draw({ halftone, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // a heavy curtain behind the bench: folds carved top to bottom, a scalloped valance
  let folds = '';
  for (let x = 46, i = 0; x < 470; x += 18 + (i % 3) * 6, i++) {
    const w = i % 3 === 0 ? 3.2 : 1.6;
    folds += `<path d="M${x},96C${x + 6},200 ${x - 6},320 ${x + 2},${BENCH}" fill="none" stroke="${PAPER}" stroke-width="${w}"/>`;
  }
  blue += folds;
  let val = `M30,40H470V82`;
  for (let x = 470; x > 30; x -= 40) val += `Q${x - 20},${110} ${x - 40},82`;
  val += 'Z';
  blue += cutout(val, 6);
  blue += `<path d="M30,62H470" stroke="${PAPER}" stroke-width="2.4"/>`;
  for (let x = 50; x < 470; x += 40) blue += `<path d="M${x},${100}l-5,16h10Z" fill="${PAPER}"/><circle cx="${x}" cy="98" r="3.4" fill="${PAPER}"/>`;
  void R;

  // the robe
  const robe = smooth(ROBE);
  blue += cutout(robe);
  blue += `<clipPath id="judge-robe"><path d="${robe}"/></clipPath><g clip-path="url(#judge-robe)">`;
  blue += carve([[[120, 360], [104, 410], [96, 440]], [[290, 360], [306, 410], [314, 440]], [[176, 330], [170, 390], [168, 440]], [[236, 330], [242, 390], [244, 440]]], 3);
  blue += `</g>`;
  // the collar bands
  blue += `<path d="M${hx - 16},${290}L${hx - 2},${290}L${hx},${336}L${hx - 18},${336}ZM${hx + 2},${290}L${hx + 16},${290}L${hx + 18},${336}L${hx},${336}Z" fill="${PAPER}" stroke="${BLUE}" stroke-width="2.4"/>`;

  // the wig: white, rolled curls down both sides
  const wig = smooth(WIG, true, 0.18);
  blue += `<path d="${wig}" fill="${PAPER}" stroke="${PAPER}" stroke-width="9" stroke-linejoin="round"/><path d="${wig}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.6" stroke-linejoin="round"/>`;
  let curls = '';
  const curl = (x, y, r) => `M${F(x + r)},${F(y)}A${r},${r} 0 1 0 ${F(x)},${F(y + r)}A${F(r * 0.6)},${F(r * 0.6)} 0 1 1 ${F(x + r * 0.5)},${F(y - r * 0.2)}`;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 6; row++) {
      for (const col of [0, 1]) {
        const x = hx + side * (82 - col * 24 - (row < 2 ? 4 : 0)), y = 190 + row * 27 + col * 12;
        if (row === 0 && col === 1) continue;
        curls += curl(x, y, 10);
      }
    }
  }
  // the rolls across the crown
  for (const [x, y] of [[150, 150], [178, 132], [206, 126], [234, 132], [262, 150]]) curls += curl(x, y, 11);
  blue += `<path d="${curls}" fill="none" stroke="${BLUE}" stroke-width="3" stroke-linecap="round"/>`;

  // the face: startled eyes behind spectacles, the mouth caught mid-word
  const face = smooth([[hx - 40, hy - 26], [hx, hy - 38], [hx + 40, hy - 26], [hx + 42, hy + 10], [hx + 32, hy + 42], [hx, hy + 56], [hx - 32, hy + 42], [hx - 42, hy + 10]]);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  for (const ex of [hx - 17, hx + 17]) blue += `<circle cx="${ex}" cy="${hy}" r="12" fill="none" stroke="${PAPER}" stroke-width="3"/><circle cx="${ex}" cy="${hy}" r="5.4" fill="${PAPER}"/><circle cx="${ex + 1}" cy="${hy + 1}" r="2.4" fill="${BLUE}"/>`;
  blue += `<path d="M${hx - 5},${hy - 2}Q${hx},${hy - 7} ${hx + 5},${hy - 2}" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;
  blue += carve([[[hx - 32, hy - 20], [hx - 18, hy - 28], [hx - 4, hy - 22]], [[hx + 4, hy - 22], [hx + 18, hy - 28], [hx + 32, hy - 20]]], 3);
  blue += carve([[[hx + 2, hy + 12], [hx + 6, hy + 24], [hx - 2, hy + 27]]], 2.6);
  blue += `<ellipse cx="${hx}" cy="${hy + 40}" rx="9" ry="7" fill="${PAPER}"/><ellipse cx="${hx}" cy="${hy + 43}" rx="4.4" ry="2.6" fill="${BLUE}"/>`;
  // the stutter: a ripple of little marks beside the mouth
  for (const [dx, r] of [[18, 7], [24, 11], [30, 15]]) blue += `<path d="M${hx + dx},${hy + 40 - r * 0.7}A${r},${r} 0 0 1 ${hx + dx},${hy + 40 + r * 0.7}" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round"/>`;

  // the bench: a ledge and carved panels; the sound block on it
  blue += cutout(`M30,${BENCH}H470V${BENCH + 18}H30Z`, 7);
  blue += cutout(`M30,${BENCH + 26}H470V560H30Z`, 6);
  for (let x = 54; x < 460; x += 102) blue += `<rect x="${x}" y="${BENCH + 44}" width="78" height="80" rx="4" fill="none" stroke="${PAPER}" stroke-width="3"/><rect x="${x + 10}" y="${BENCH + 54}" width="58" height="60" rx="2" fill="none" stroke="${PAPER}" stroke-width="1.6"/>`;

  // the arm raised, the gavel high, the arcs of its swing
  blue += cutout(limb(ARM, true), 9);
  blue += carve([[[300, 318], [318, 282], [332, 250]]], 2.6);
  blue += cutout(`M326,236C340,226 362,226 372,236L366,252C354,246 340,246 330,252Z`, 6);
  const [gx, gy] = [372, 118];
  blue += cutout(limb([[352, 222, 12], [gx, gy + 18, 12]], false), 6);
  const head = `M${gx - 42},${gy - 14}L${gx + 30},${gy - 26}L${gx + 36},${gy + 10}L${gx - 36},${gy + 22}Z`;
  blue += cutout(head, 7);
  blue += `<path d="M${gx - 26},${gy - 18}L${gx - 20},${gy + 19}M${gx + 16},${gy - 24}L${gx + 22},${gy + 12}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += cutout(smooth([[338, 208], [344, 194], [362, 190], [372, 202], [368, 220], [350, 224]]), 6);
  blue += carve([[[344, 200], [362, 198]], [[344, 212], [364, 210]]], 2.2);
  let swing = '';
  for (const [r, a0, a1, w] of [[128, -1.0, -0.62, 4], [150, -0.96, -0.5, 3.2], [172, -0.92, -0.4, 2.4]]) {
    swing += `<path d="M${F(312 + Math.cos(a0) * r)},${F(250 + Math.sin(a0) * r)}A${r},${r} 0 0 1 ${F(312 + Math.cos(a1) * r)},${F(250 + Math.sin(a1) * r)}" fill="none" stroke="${PAPER}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  blue += swing;

  // the two bursts: bang, b-bang
  const bursts = BURSTS.map(([x, y, r], i) => burst(x, y, r, i ? 9 : 11)).join('');
  blue += `<path d="${bursts}" fill="${PAPER}" stroke="${PAPER}" stroke-width="6" stroke-linejoin="round"/>`;
  blue += `<path d="${BURSTS.map(([x, y, r]) => burst(x, y, r * 0.5, 7)).join('')}" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // the sound block, struck
  blue += cutout(`M352,${BENCH - 18}H416V${BENCH}H352Z`, 6);
  blue += carve([[[356, BENCH - 9], [412, BENCH - 9]]], 2);

  let pink = `<path d="${bursts}" fill="${PINK}" stroke="${PINK}" stroke-width="6" stroke-linejoin="round"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(...BURSTS.map(([bx, by, r]) => 3.6 * Math.max(0, 1 - Math.hypot(x - bx, y - by) / (r * 3.6)))))}"/>`;
  return { blue, pink };
}
