// The Piper: a slim piper in a pointed cap and motley, playing a long pipe; the notes swirl out round him
// and down to the rats that follow.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 111;

const GROUND = 480;
const [hx, hy] = [204, 176]; // the head
// the notes: [x, y, size, tilt, kind] along a loop from the pipe's end, over his cap, down to the rats
const NOTES = [
  [70, 342, 0.8, -10, 1], [58, 270, 1, 8, 2], [84, 196, 1.05, -6, 1], [128, 130, 1.1, 10, 2], [212, 70, 1, -8, 1],
  [330, 96, 1.15, 12, 2], [392, 168, 1, -10, 1], [418, 250, 1.05, 6, 2], [400, 338, 0.9, -12, 1], [380, 420, 0.8, 8, 1],
];

function note(x, y, s, a, kind, fill) {
  const head = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="7" transform="rotate(-22 ${cx} ${cy})"/>`;
  let g = head(0, 0) + `<rect x="6" y="-40" width="3.6" height="38"/>`;
  if (kind === 1) g += `<path d="M9.6,-40C14,-30 26,-28 24,-12C21,-20 15,-23 9.6,-25Z"/>`;
  else g += head(26, -7) + `<rect x="32" y="-48" width="3.6" height="40"/><path d="M6,-40L35.6,-48L35.6,-39L6,-31Z"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})" fill="${fill}" stroke="${fill}" stroke-width="${fill === PAPER ? 0 : 1.5}">${g}</g>`;
}

function rat(x, y, s) {
  const P = (dx, dy) => [x + dx * s, y + dy * s];
  const body = smooth([[...P(-46, 4), 1], [...P(-30, -8)], [...P(-12, -18)], [...P(12, -20)], [...P(30, -10)], [...P(36, 6), 1], [...P(-20, 8), 1]]);
  const tail = limb([[...P(32, 2), 7 * s], [...P(48, -10), 5.4 * s], [...P(54, -30), 4 * s], [...P(46, -46), 3 * s], [...P(32, -50), 2.2 * s], [...P(24, -42), 1.6 * s]], true);
  let out = cutout(tail, 4) + cutout(body, 6);
  const [ex, ey] = P(-18, -18);
  out += `<circle cx="${F(ex)}" cy="${F(ey)}" r="${F(8 * s)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  const [ix, iy] = P(-30, -4);
  out += `<circle cx="${F(ix)}" cy="${F(iy)}" r="${F(2.6 * s)}" fill="${PAPER}"/>`;
  const [nx, ny] = P(-46, 4);
  out += `<circle cx="${F(nx)}" cy="${F(ny)}" r="${F(3 * s)}" fill="${PAPER}"/>`;
  out += carve([[P(-48, 2), P(-60, -2)], [P(-48, 6), P(-60, 10)]], 1.4);
  out += carve([[P(-6, 8), P(-8, 14)], [P(22, 8), P(24, 14)]], 2.6);
  return out;
}

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="piper-sky"><rect width="500" height="700" fill="#fff"/>${NOTES.map(([x, y, s]) => `<circle cx="${x + 10 * s}" cy="${y - 18 * s}" r="${36 * s}" fill="#000"/>`).join('')}</mask>`;
  blue += `<path mask="url(#piper-sky)" fill="${PAPER}" d="${lines(52, GROUND - 4, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - 200) / 320) * 2.2)}"/>`;
  blue += `<path d="${stars(8, [56, 56, 450, 300], [[230, 200, 140], ...NOTES.map(([x, y]) => [x, y, 40])])}" fill="${PAPER}"/>`;
  // the street
  blue += `<path d="M30,${GROUND}C150,${GROUND - 4} 330,${GROUND - 2} 470,${GROUND - 6}L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path fill="${PAPER}" d="${lines(GROUND + 12, 556, 11, (y) => 0.8 + (y - GROUND) / 50, 40, 460)}"/>`;

  // the rats, following
  blue += rat(438, 498, 0.7) + rat(388, 516, 0.96) + rat(314, 536, 1.2);

  // the piper: the back leg, the front leg, the tunic, the far arm
  blue += cutout(limb([[230, 376, 24], [246, 440, 20], [268, 494, 16]], true), 7);
  blue += cutout(smooth([[256, 490], [272, 486], [290, 500], [300, 492, 1], [298, 508], [262, 510, 1]]), 5);
  const front = limb([[198, 376, 24], [178, 440, 20], [160, 500, 16]], true);
  blue += cutout(front, 7);
  blue += `<clipPath id="piper-leg"><path d="${front}"/></clipPath><path clip-path="url(#piper-leg)" d="${Array.from({ length: 12 }, (_, i) => `M140,${370 + i * 12}L230,${350 + i * 12}`).join('')}" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += cutout(smooth([[172, 496], [150, 498], [128, 504], [114, 494, 1], [118, 512], [170, 512, 1]]), 5);

  blue += cutout(limb([[214, 248, 26], [184, 270, 20], [156, 226, 16]], true), 7);
  const tunic = smooth([
    [190, 238], [214, 232], [240, 238], [246, 290], [240, 330], [256, 384, 1], [244, 374], [234, 392, 1], [222, 376], [210, 394, 1], [200, 378], [186, 392, 1], [178, 374], [166, 386, 1], [176, 330], [182, 290],
  ], true, 0.16);
  blue += cutout(tunic, 8);
  // motley: the front half striped, the back half plain
  blue += `<clipPath id="piper-tunic"><path d="${tunic}"/></clipPath><g clip-path="url(#piper-tunic)">`;
  blue += `<clipPath id="piper-half"><path d="M0,0H212V700H0Z"/></clipPath><path clip-path="url(#piper-half)" d="${Array.from({ length: 18 }, (_, i) => `M140,${230 + i * 12}L260,${190 + i * 12}`).join('')}" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += `<path d="M212,236V400" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path d="M176,330C196,338 226,338 244,330" fill="none" stroke="${PAPER}" stroke-width="9"/><path d="M176,330C196,338 226,338 244,330" fill="none" stroke="${BLUE}" stroke-width="3.6"/>`;
  blue += `</g>`;

  // the head in profile, cheeks puffed, eyes closed
  const head = smooth([[178, 152], [204, 142], [228, 152], [236, 178], [228, 204], [212, 216], [192, 214], [180, 204], [174, 192], [164, 184, 1], [170, 174], [172, 162]]);
  blue += cutout(limb([[212, 210, 20], [214, 240, 22]], false), 6);
  blue += cutout(head, 8);
  blue += carve([[[180, 170], [188, 166], [196, 170]]], 2.8);
  blue += `<circle cx="190" cy="194" r="9" fill="none" stroke="${PAPER}" stroke-width="2" stroke-dasharray="3 3"/>`;
  blue += carve([[[222, 176], [228, 186], [222, 196]]], 2.4);
  // the pointed cap, its tip flopping back, a feather in the band
  const cap = smooth([[166, 162, 1], [176, 126], [200, 102], [238, 84], [280, 76], [312, 84, 1], [276, 94], [250, 112], [240, 140], [238, 166, 1], [204, 152]], true, 0.18);
  const feather = limb([[236, 138, 4], [262, 126, 14], [296, 128, 16], [324, 142, 10], [336, 154, 2]], true);
  blue += `<path d="${feather}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10"/><path d="${feather}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3"/>`;
  blue += carve([[[244, 136], [276, 130], [306, 136], [330, 150]]], 2.2, BLUE);
  blue += cutout(cap, 8);
  blue += carve([[[172, 150], [204, 140], [238, 152]]], 3);
  blue += carve([[[196, 118], [224, 102], [256, 92]]], 2.2);

  // the pipe, and the near arm with both hands on it
  const [px0, py0, px1, py1] = [172, 198, 62, 318];
  const pipe = limb([[px0, py0, 9], [(px0 + px1) / 2, (py0 + py1) / 2, 10], [px1 + 8, py1 - 10, 12], [px1, py1, 20]], false);
  blue += cutout(pipe, 6);
  for (let t = 0.3; t < 0.75; t += 0.09) blue += `<circle cx="${F(px0 + (px1 - px0) * t)}" cy="${F(py0 + (py1 - py0) * t)}" r="2.6" fill="${PAPER}"/>`;
  blue += cutout(smooth([[146, 214], [156, 204], [170, 212], [168, 232], [152, 236]]), 5);
  blue += cutout(limb([[226, 252, 26], [216, 300, 22], [170, 288, 18], [126, 262, 15]], true), 7);
  blue += cutout(smooth([[110, 250], [122, 240], [138, 248], [136, 268], [120, 274]]), 5);
  blue += carve([[[118, 252], [130, 260]], [[114, 262], [126, 268]]], 1.8);

  // the notes
  blue += NOTES.map(([x, y, s, a, k]) => note(x, y, s, a, k, PAPER)).join('');

  let pink = NOTES.map(([x, y, s, a, k]) => note(x, y, s, a, k, PINK)).join('');
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => Math.max(...NOTES.map(([nx, ny, s]) => 3 * s * Math.max(0, 1 - Math.hypot(x - nx - 10, y - ny + 18) / 64))))}"/>`;
  return { blue, pink };
}
