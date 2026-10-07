// The Rusty Knight: an old knight in a dented great helm, his white beard poking out beneath it, one fist
// on his hip, the other resting on a long notched sword gone to rust. A cobweb hangs off its pommel.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 108;

const [hx, hy] = [200, 148]; // the helm's eye slit
const BX = 372; // the sword
const POMMEL = 214, GUARD = 282, TIP = 540;

const HELM = [[hx - 58, hy + 72, 1], [hx - 62, hy + 10], [hx - 60, hy - 40], [hx - 50, hy - 62], [hx - 20, hy - 72], [hx + 20, hy - 72], [hx + 50, hy - 64], [hx + 60, hy - 40], [hx + 62, hy + 10], [hx + 58, hy + 72, 1]];
const BEARD = [[hx - 44, hy + 68, 1], [hx + 44, hy + 68, 1], [hx + 42, hy + 100], [hx + 34, hy + 128], [hx + 22, hy + 148, 1], [hx + 12, hy + 132], [hx, hy + 156, 1], [hx - 12, hy + 132], [hx - 22, hy + 148, 1], [hx - 34, hy + 128], [hx - 42, hy + 100]];
const BODY = [[60, 560, 1], [70, 470], [84, 390], [90, 310], [104, 252], [150, 226], [200, 220], [250, 226], [296, 252], [310, 310], [318, 390], [330, 470], [338, 560, 1]];
// the near arm out to the sword, the far fist on his hip
const ARM_SWORD = [[284, 262, 50], [318, 284, 42], [346, 256, 36], [362, 234, 32]];
const ARM_HIP = [[114, 262, 50], [72, 316, 44], [70, 352, 40], [100, 384, 34]];
const FIST_SWORD = [[346, 230], [352, 210], [374, 202], [394, 210], [398, 230], [384, 244], [358, 244]];
const FIST_HIP = [[90, 372], [104, 360], [124, 366], [128, 388], [116, 402], [96, 398]];

function blade() {
  const L = [], Rt = [];
  const half = (y) => 24 - ((y - GUARD) / (TIP - GUARD)) * 8;
  const bite = (y, list) => Math.max(0, ...list.map((n) => 9 - Math.abs(y - n) * 1.2));
  for (let y = GUARD + 8; y <= TIP - 34; y += 3) {
    const h = half(y);
    L.push([BX - h + bite(y, [340, 428, 470]), y]);
    Rt.push([BX + h - bite(y, [372, 448, 500]), y]);
  }
  return polyD([...L, [BX, TIP], ...Rt.reverse()]);
}
const RUST = [
  [[350, 318], [362, 312], [372, 320], [370, 336], [358, 342], [350, 332]],
  [[378, 380], [390, 372], [394, 388], [390, 404], [380, 400]],
  [[352, 418], [360, 410], [366, 420], [362, 436], [354, 434]],
  [[374, 456], [384, 452], [388, 466], [380, 478], [372, 470]],
  [[362, 500], [370, 496], [372, 508], [366, 514]],
];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(52, 540, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 420) / 340) * 2.2)}"/>`;
  blue += `<path d="${stars(7, [56, 56, 330, 260], [[hx, hy, 120], [80, 80, 30]])}" fill="${PAPER}"/>`;
  void R;

  // the cobweb, from the corner down to the pommel: he has stood here a long time
  const [wx, wy] = [460, 40];
  let web = '';
  const spokes = [0.52, 0.64, 0.78, 0.94].map((t) => t * Math.PI);
  for (const a of spokes) web += `M${wx},${wy}L${F(wx + Math.cos(a) * 190)},${F(wy + Math.sin(a) * 190)}`;
  for (const r of [32, 64, 98, 134]) {
    for (let i = 0; i < spokes.length - 1; i++) {
      const a = spokes[i], b = spokes[i + 1], m = (a + b) / 2;
      web += `M${F(wx + Math.cos(a) * r)},${F(wy + Math.sin(a) * r)}Q${F(wx + Math.cos(m) * r * 0.8)},${F(wy + Math.sin(m) * r * 0.8)} ${F(wx + Math.cos(b) * r)},${F(wy + Math.sin(b) * r)}`;
    }
  }
  web += `M${BX},${POMMEL - 10}L${F(wx + Math.cos(spokes[0]) * 134)},${F(wy + Math.sin(spokes[0]) * 134)}`;
  blue += `<path d="${web}" fill="none" stroke="${PAPER}" stroke-width="2"/>`;
  blue += `<path d="M418,130v34" stroke="${PAPER}" stroke-width="1.6"/><circle cx="418" cy="168" r="5" fill="${PAPER}"/>`;
  // the ground
  blue += `<path d="M30,536C150,530 330,532 470,526L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;

  // his body: mail at the neck and shoulders, a surcoat with a cross, a belt
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="knight-body"><path d="${body}"/></clipPath><g clip-path="url(#knight-body)">`;
  let mail = '';
  for (let y = 232, row = 0; y < 300; y += 10, row++) for (let x = 84 + (row % 2) * 6; x < 320; x += 12) mail += `M${x - 5},${y}a5,5 0 0 0 10,0`;
  blue += `<path d="${mail}" fill="none" stroke="${PAPER}" stroke-width="1.8"/>`;
  blue += `<path d="M86,302C140,292 260,292 314,302" fill="none" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="M76,410C130,422 270,422 324,410" fill="none" stroke="${PAPER}" stroke-width="12"/><path d="M76,410C130,422 270,422 324,410" fill="none" stroke="${BLUE}" stroke-width="5"/>`;
  blue += carve([[[110, 430], [100, 490], [92, 560]], [[290, 430], [298, 490], [306, 560]], [[160, 432], [156, 496], [152, 560]], [[240, 432], [244, 496], [248, 560]]], 3);
  blue += `</g>`;
  blue += `<rect x="186" y="406" width="28" height="22" rx="3" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += `<path d="M${hx},${318}V${388}M${hx - 26},${346}H${hx + 26}" stroke="${PAPER}" stroke-width="7" stroke-linecap="square"/>`;

  // the sword: blade, cross-guard, grip, pommel
  const bl = blade();
  blue += `<path d="${bl}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${bl}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4" stroke-linejoin="round"/>`;
  blue += `<path d="M${BX},${GUARD + 14}V${TIP - 70}" stroke="${BLUE}" stroke-width="3.4"/>`;
  let flecks = '';
  for (const [x, y] of [[358, 330], [386, 392], [358, 428], [380, 466], [366, 506], [384, 312], [356, 372]]) flecks += `M${x},${y}h2.6v2.6h-2.6Z`;
  blue += `<path d="${flecks}" fill="${BLUE}"/>`;
  const guard = smooth([[BX - 74, GUARD + 14, 1], [BX - 64, GUARD - 6], [BX, GUARD - 10], [BX + 64, GUARD - 6], [BX + 74, GUARD + 14, 1], [BX + 54, GUARD + 8], [BX, GUARD + 12], [BX - 54, GUARD + 8]]);
  blue += cutout(guard, 7);
  blue += `<path d="${polyD([[BX - 8, GUARD - 12], [BX + 8, GUARD - 12], [BX + 10, GUARD + 14], [BX, GUARD + 24], [BX - 10, GUARD + 14]])}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += cutout(limb([[BX, GUARD - 8, 16], [BX, POMMEL + 8, 16]], false), 6);
  blue += carve([[[BX - 6, 266], [BX + 6, 260]], [[BX - 6, 254], [BX + 6, 248]]], 2);

  // the arms and fists
  blue += cutout(limb(ARM_HIP, true), 8);
  blue += carve([[[96, 290], [80, 320]], [[80, 344], [96, 366]]], 2.6);
  blue += cutout(smooth(FIST_HIP), 6);
  blue += carve([[[100, 376], [114, 380]], [[98, 388], [112, 392]]], 2.2);
  blue += cutout(limb(ARM_SWORD, true), 8);
  blue += carve([[[300, 282], [318, 296]], [[332, 266], [346, 250]]], 2.6);
  blue += `<circle cx="${BX}" cy="${POMMEL}" r="15" fill="${BLUE}" stroke="${PAPER}" stroke-width="7"/><circle cx="${BX}" cy="${POMMEL}" r="15" fill="${BLUE}"/><circle cx="${BX}" cy="${POMMEL}" r="6" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;
  blue += cutout(smooth(FIST_SWORD), 6);
  blue += carve([[[354, 222], [370, 218], [386, 222]], [[356, 234], [372, 230], [388, 234]]], 2.2);

  // pauldrons
  for (const [x, s] of [[110, -1], [290, 1]]) {
    const p = `M${x - 44},${266}C${x - 44},${222} ${x + 44},${222} ${x + 44},${266}C${x + 20},${258} ${x - 20},${258} ${x - 44},${266}Z`;
    blue += cutout(p, 7);
    blue += carve([[[x - 32, 250], [x, 240], [x + 32, 250]]], 2.4);
    blue += `<circle cx="${x + s * 4}" cy="${234}" r="3.4" fill="${PAPER}"/>`;
  }

  // the white beard, then the helm: a bucket with a cross of slits, dented, and a drooping plume
  const beard = smooth(BEARD);
  blue += `<path d="${beard}" fill="${PAPER}" stroke="${PAPER}" stroke-width="8" stroke-linejoin="round"/><path d="${beard}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;
  blue += carve([[[hx - 26, hy + 78], [hx - 24, hy + 104], [hx - 18, hy + 132]], [[hx - 8, hy + 78], [hx - 6, hy + 112], [hx - 2, hy + 142]], [[hx + 10, hy + 78], [hx + 10, hy + 108], [hx + 6, hy + 136]], [[hx + 26, hy + 78], [hx + 24, hy + 102], [hx + 18, hy + 128]]], 2.2, BLUE);
  const plume = limb([[hx - 6, hy - 70, 10], [hx - 30, hy - 104, 24], [hx - 72, hy - 112, 28], [hx - 104, hy - 92, 22], [hx - 118, hy - 58, 14], [hx - 116, hy - 34, 4]], true);
  blue += cutout(plume, 7);
  blue += carve([[[hx - 20, hy - 92], [hx - 60, hy - 106], [hx - 96, hy - 90], [hx - 110, hy - 58]]], 2.4);
  blue += carve([[hx - 40, hy - 104], [hx - 62, hy - 108], [hx - 84, hy - 102], [hx - 102, hy - 86], [hx - 110, hy - 68]].map(([x, y]) => [[x, y], [x - 6, y + 12]]), 2);
  const helm = smooth(HELM, true, 0.18);
  blue += cutout(helm, 9);
  blue += `<clipPath id="knight-helm"><path d="${helm}"/></clipPath><g clip-path="url(#knight-helm)">`;
  blue += carve([[[hx - 62, hy - 40], [hx, hy - 48], [hx + 62, hy - 40]]], 3);
  // the dent: a crumpled patch on the brow
  blue += carve([[[hx + 46, hy - 34], [hx + 30, hy - 24], [hx + 22, hy - 38]], [[hx + 44, hy - 20], [hx + 34, hy - 14]]], 2.4);
  blue += `</g>`;
  blue += `<path d="M${hx - 50},${hy}H${hx + 50}M${hx - 46},${hy + 14}H${hx - 8}M${hx + 8},${hy + 14}H${hx + 46}" stroke="${PAPER}" stroke-width="5" stroke-linecap="round"/>`;
  blue += `<path d="M${hx},${hy - 44}V${hy + 64}" stroke="${PAPER}" stroke-width="4"/>`;
  let holes = '';
  for (const [x, y] of [[hx + 22, hy + 36], [hx + 34, hy + 36], [hx + 22, hy + 48], [hx + 34, hy + 48], [hx - 22, hy + 36], [hx - 34, hy + 36], [hx - 22, hy + 48], [hx - 34, hy + 48]]) holes += `M${x - 2.6},${y}a2.6,2.6 0 1 0 5.2,0a2.6,2.6 0 1 0 -5.2,0Z`;
  blue += `<path d="${holes}" fill="${PAPER}"/>`;
  for (const [x, y] of [[hx - 54, hy + 62], [hx + 54, hy + 62], [hx - 56, hy - 20], [hx + 56, hy - 20]]) blue += `<circle cx="${x}" cy="${y}" r="3" fill="${PAPER}"/>`;

  // pink: the rust, flaking off the blade
  const rust = RUST.map((p) => smooth(p)).join('');
  const centres = RUST.map((p) => [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length]);
  let pink = `<clipPath id="knight-blade"><path d="${bl}"/></clipPath><path clip-path="url(#knight-blade)" d="${rust}" fill="${PINK}"/>`;
  pink += `<g clip-path="url(#knight-blade)"><path fill="${PINK}" d="${halftone([BX - 26, GUARD, BX + 26, TIP], 5, (x, y) => Math.max(...centres.map(([cx, cy]) => 2.2 * Math.max(0, 1 - Math.hypot(x - cx, y - cy) / 26))))}"/></g>`;
  pink += `<mask id="knight-glow"><rect width="500" height="700" fill="#fff"/><path d="${bl}" fill="#000"/></mask>`;
  pink += `<path mask="url(#knight-glow)" fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.2 * Math.max(0, 1 - Math.hypot((x - BX) * 1.3, y - 420) / 170))}"/>`;
  return { blue, pink };
}
