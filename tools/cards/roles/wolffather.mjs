// The Wolf Father: an ancient wolf in profile, grizzled and scarred, a long mane down his neck and a
// crown of bone on his brow; one eye glows, and a drop of blood falls from his fang.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 143;

const [ex, ey] = [204, 254]; // the eye
const [rx, ry, rr] = [300, 168, 118]; // the dark moon's ring behind his crown

const HEAD = [
  [56, 298, 1], [66, 280], [112, 268], [160, 256], [196, 238], [218, 212], [250, 192], [292, 184],
  // the ear laid back, torn at its edge; then the mane in long jagged locks down the neck
  [300, 178, 1], [346, 124, 1], [346, 146, 1], [334, 152, 1], [350, 162, 1], [342, 200, 1],
  [372, 214], [416, 228, 1], [392, 246], [436, 280, 1], [404, 292], [446, 338, 1], [416, 350], [452, 408, 1], [424, 418], [454, 482, 1], [430, 494], [450, 560, 1],
  // the chest, its ruff in tufts, up to the throat and the lower jaw
  [170, 560, 1], [176, 512], [148, 484, 1], [176, 468], [142, 436, 1], [172, 422], [146, 394, 1], [182, 386], [204, 368, 1], [172, 360], [130, 346], [92, 334], [68, 318],
];
const FANG = [[102, 314, 1], [118, 314, 1], [114, 334], [106, 354, 1], [104, 334]];
const LIP = [[70, 312], [110, 314], [150, 316], [186, 308]];
// the crown: bone spikes on a band over the brow
const BAND = [[196, 244], [224, 220], [256, 204], [294, 196]];

/** A teardrop, its point up, centred on the round end (x, y). */
const drop = (x, y, r) => `M${F(x)},${F(y - r * 2.6)}C${F(x + r * 0.4)},${F(y - r * 1.6)} ${F(x + r)},${F(y - r * 0.8)} ${F(x + r)},${F(y)}A${F(r)},${F(r)} 0 0 1 ${F(x - r)},${F(y)}C${F(x - r)},${F(y - r * 0.8)} ${F(x - r * 0.4)},${F(y - r * 1.6)} ${F(x)},${F(y - r * 2.6)}Z`;

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="wolffather-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${rx}" cy="${ry}" r="${rr + 12}" fill="#000"/></mask>`;
  blue += `<path mask="url(#wolffather-sky)" fill="${PAPER}" d="${lines(52, 540, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - ry) / 340) * 2.4)}"/>`;
  // the dark moon: a black disc ringed with light
  blue += `<circle cx="${rx}" cy="${ry}" r="${rr}" fill="none" stroke="${PAPER}" stroke-width="5"/>`;
  for (let i = 1; i < 5; i++) blue += `<circle cx="${rx}" cy="${ry}" r="${rr + 4 + i * 9}" fill="none" stroke="${PAPER}" stroke-width="${F(2.6 - i * 0.4)}" stroke-dasharray="${F(24 + R() * 30)} ${F(5 + R() * 6)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 444, 300], [[rx, ry, rr + 50], [120, 300, 80]])}" fill="${PAPER}"/>`;
  // rocky ground where the blood falls
  blue += `<path d="M30,512C70,500 120,506 170,498L190,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += carve([[[60, 530], [86, 524]], [[110, 540], [140, 532]]], 2.4);

  // the crown: bone thorns, curved and sharp, behind a twisted band on his brow
  const band = [[186, 248], [212, 224], [246, 204], [282, 190], [312, 184]];
  const along = (t) => {
    const f = t * (band.length - 1), k = Math.min(band.length - 2, Math.floor(f)), u = f - k;
    return [band[k][0] + (band[k + 1][0] - band[k][0]) * u, band[k][1] + (band[k + 1][1] - band[k][1]) * u];
  };
  let bones = '';
  // [where on the band, length, lean (radians from straight up), base width]
  for (const [t, len, lean, w] of [[0.08, 50, -0.4, 16], [0.3, 80, -0.2, 18], [0.52, 104, 0.02, 19], [0.74, 80, 0.24, 18], [0.95, 50, 0.44, 16]]) {
    const [x, y] = along(t);
    const pts = [0, 0.35, 0.7, 1].map((u, i) => {
      const a = -Math.PI / 2 + lean + u * u * 0.12;
      return [x + Math.cos(a) * len * u, y + Math.sin(a) * len * u, [w, w * 0.8, w * 0.5, 1][i]];
    });
    bones += limb(pts, true, 0.18);
  }
  blue += `<path d="${bones}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${bones}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3" stroke-linejoin="round"/>`;
  const bandD = limb(band.map(([x, y]) => [x, y, 20]), true);

  const head = smooth(HEAD, true, 0.18);
  blue += cutout(head);
  blue += `<clipPath id="wolffather-head"><path d="${head}"/></clipPath><g clip-path="url(#wolffather-head)">`;
  // the mane: long grizzled strands flowing down the neck
  const mane = [];
  for (let i = 0; i < 8; i++) {
    const x0 = 318 + i * 15, y0 = 214 + i * 8;
    mane.push([[x0, y0], [x0 + 20 + R() * 10, y0 + 90], [x0 + 26 + R() * 14, y0 + 200], [x0 + 20, y0 + 330]]);
  }
  blue += carve(mane, 3.2);
  blue += carve(mane.map((m) => m.map(([x, y]) => [x - 9, y + 26])).slice(1), 1.8);
  // short grizzled fur on the cheek and the jaw, the ear's inner edge
  blue += carve([[[300, 196], [336, 168]], [[312, 200], [342, 176]]], 2.4);
  const tufts = [[250, 270], [236, 304], [262, 298], [216, 336], [244, 334], [212, 380], [250, 380], [232, 420], [200, 440], [262, 420], [222, 470], [256, 470], [214, 510], [250, 520]];
  // the line of the cheek, where the mane begins
  blue += carve([[[306, 204], [304, 262], [280, 322], [232, 366], [206, 372]]], 3.6);
  blue += carve(tufts.map(([x, y]) => [[x, y], [x + 10, y + 12], [x + 16, y + 28]]), 2.4);
  blue += carve([[[96, 290], [140, 282], [180, 270]], [[150, 300], [176, 296]]], 2.4);
  blue += `</g>`;
  // the band of the crown, twisted
  blue += cutout(bandD, 6);
  blue += `<clipPath id="wolffather-band"><path d="${bandD}"/></clipPath><g clip-path="url(#wolffather-band)">`;
  for (let t = 0.04; t < 1; t += 0.07) { const [x, y] = along(t); blue += `<path d="M${F(x - 7)},${F(y + 10)}L${F(x + 7)},${F(y - 10)}" stroke="${PAPER}" stroke-width="2.6"/>`; }
  blue += `</g>`;
  // the nose, the lip, the fang hanging over the jaw
  blue += `<path d="M58,296C62,284 76,282 86,290C84,302 72,308 60,306Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += carve([LIP], 3.4);
  const fang = smooth(FANG, true, 0.2);
  blue += `<path d="${fang}" fill="${PAPER}" stroke="${PAPER}" stroke-width="7" stroke-linejoin="round"/><path d="${fang}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3" stroke-linejoin="round"/>`;
  // the brow, heavy over the eye; three old claw scars raked across it
  blue += carve([[[172, 236], [198, 230], [232, 236]]], 5);
  const scars = [[[236, 252], [190, 316]], [[254, 258], [208, 322]], [[272, 264], [228, 326]]];
  blue += `<path d="${scars.map(([[a, b], [c, d]]) => limb([[a, b, 1], [a + (c - a) * 0.3, b + (d - b) * 0.3, 6], [a + (c - a) * 0.7, b + (d - b) * 0.7, 5], [c, d, 1]], true)).join('')}" fill="${PAPER}"/>`;
  const eye = `M${ex - 24},${ey + 6}Q${ex - 4},${ey - 14} ${ex + 22},${ey - 8}Q${ex + 6},${ey + 12} ${ex - 24},${ey + 6}Z`;
  blue += `<path d="${eye}" fill="${PAPER}" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/><circle cx="${ex + 1}" cy="${ey - 1}" r="4.6" fill="${BLUE}"/>`;

  // the blood: a drop at the fang's tip, one falling
  const drops = drop(106, 364, 5) + drop(102, 420, 8) + drop(108, 468, 4);
  blue += `<path d="${drops}" fill="${PAPER}"/>`;

  let pink = `<path d="${eye}${drops}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(3.4 * Math.max(0, 1 - Math.hypot(x - ex, y - ey) / 110), 3 * Math.max(0, 1 - Math.hypot((x - 104) * 1.4, y - 420) / 130)))}"/>`;
  void polyD;
  return { blue, pink };
}
