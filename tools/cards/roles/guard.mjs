// The Guard: a guard in a nasal helm and mail behind a tall kite shield, a halberd at his side.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, almond, carve, cutout } from '../kit.mjs';

export const seed = 61;

const [cx, cy] = [236, 214]; // the helm's brim, centred
const [ox, oy, or] = [236, 250, 176]; // the protective arc around him
const SX = 392; // the halberd's shaft

const COIF = [
  [84, 560, 1], [90, 450], [104, 380], [136, 336], [170, 312], [178, 272], [cx - 64, cy - 6], [cx, cy - 20], [cx + 64, cy - 6], [294, 272], [302, 312], [336, 336], [368, 380], [382, 450], [388, 560, 1],
];
const HELM = [[cx - 66, cy + 8, 1], [cx - 60, cy - 30], [cx - 40, cy - 74], [cx - 8, cy - 112], [cx, cy - 118, 1], [cx + 8, cy - 112], [cx + 40, cy - 74], [cx + 60, cy - 30], [cx + 66, cy + 8, 1]];
const FACE = [[cx - 44, cy + 6, 1], [cx + 44, cy + 6, 1], [cx + 42, cy + 40], [cx + 28, cy + 68], [cx, cy + 80], [cx - 28, cy + 68], [cx - 42, cy + 40]];
const SHIELD = [[132, 318, 1], [236, 300], [340, 318, 1], [338, 390], [320, 452], [284, 508], [236, 556, 1], [188, 508], [152, 452], [134, 390]];
const ARM = [[340, 356, 46], [364, 380, 40], [380, 384, 34]];
const FIST = [[366, 362], [380, 350], [404, 350], [414, 366], [410, 392], [392, 400], [372, 396]];

export default function draw({ halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // a sky of rings spreading from him, like the ward he keeps
  for (let r = or + 30, i = 0; r < 560; r += 12, i++) {
    blue += `<circle cx="${ox}" cy="${oy}" r="${r}" fill="none" stroke="${PAPER}" stroke-width="${F(Math.max(0.7, 3 - (r - or) / 110))}" stroke-dasharray="${F(40 + R() * 80)} ${F(5 + R() * 8)}"/>`;
  }
  blue += `<circle cx="${ox}" cy="${oy}" r="${or}" fill="none" stroke="${PAPER}" stroke-width="18"/>`;
  blue += `<circle cx="${ox}" cy="${oy}" r="${or + 16}" fill="none" stroke="${PAPER}" stroke-width="3"/><circle cx="${ox}" cy="${oy}" r="${or - 16}" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `<path d="${stars(8, [56, 56, 444, 300], [[ox, oy, or + 40]])}" fill="${PAPER}"/>`;

  // the halberd, behind his arm: shaft, spike, axe blade, back hook
  blue += cutout(limb([[SX, 560, 14], [SX, 118, 12]]), 9);
  const blade = smooth([[SX + 6, 112, 1], [SX + 36, 104], [SX + 58, 92, 1], [SX + 54, 130], [SX + 56, 170, 1], [SX + 34, 162], [SX + 6, 160, 1]]);
  const spike = polyD([[SX - 7, 118], [SX - 6, 70], [SX, 34], [SX + 6, 70], [SX + 7, 118]]);
  const hook = polyD([[SX - 6, 124], [SX - 34, 112], [SX - 46, 96], [SX - 26, 134], [SX - 6, 146]]);
  blue += cutout(blade + spike + hook, 8);
  blue += carve([[[SX + 14, 118], [SX + 34, 114], [SX + 48, 104]], [[SX + 14, 152], [SX + 34, 152], [SX + 46, 160]]], 2.4);
  blue += `<path d="M${SX - 9},${176}H${SX + 9}M${SX - 9},${186}H${SX + 9}" stroke="${PAPER}" stroke-width="3"/>`;

  // mail: the coif and shoulders, scalloped rings carved row by row
  const coif = smooth(COIF);
  blue += cutout(coif);
  blue += `<clipPath id="guard-coif"><path d="${coif}"/></clipPath><g clip-path="url(#guard-coif)">`;
  let mail = '';
  for (let y = 230, row = 0; y < 560; y += 11, row++) {
    for (let x = 84 + (row % 2) * 7; x < 392; x += 14) mail += `M${x - 6},${y}a6,6 0 0 0 12,0`;
  }
  blue += `<path d="${mail}" fill="none" stroke="${PAPER}" stroke-width="2"/>`;
  blue += `</g>`;
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  for (const ex of [cx - 22, cx + 22]) blue += `<path d="${almond(ex, cy + 30, 10, 3.6)}" fill="${PAPER}"/>`;
  blue += carve([[[cx - 14, cy + 62], [cx, cy + 60], [cx + 14, cy + 62]], [[cx - 36, cy + 18], [cx - 22, cy + 14], [cx - 8, cy + 18]], [[cx + 8, cy + 18], [cx + 22, cy + 14], [cx + 36, cy + 18]]], 3);

  // the helm: a cone with a nasal, a band and a ridge
  const helm = smooth(HELM, true, 0.18);
  blue += cutout(helm, 8);
  blue += carve([[[cx - 62, cy - 8], [cx, cy - 16], [cx + 62, cy - 8]], [[cx - 60, cy - 20], [cx, cy - 28], [cx + 60, cy - 20]]], 3);
  blue += carve([[[cx, cy - 104], [cx + 2, cy - 64], [cx + 1, cy - 34]], [[cx - 30, cy - 76], [cx - 44, cy - 40]]], 2.6);
  blue += cutout(polyD([[cx - 7, cy - 18], [cx + 7, cy - 18], [cx + 6, cy + 50], [cx, cy + 56], [cx - 6, cy + 50]]), 5);
  for (const x of [-48, -24, 24, 48]) blue += `<circle cx="${cx + x}" cy="${F(cy - 14 - (48 - Math.abs(x)) * 0.12)}" r="2.6" fill="${BLUE}"/>`;

  blue += cutout(limb(ARM, true), 8);
  blue += cutout(smooth(FIST), 7);
  blue += carve([[[372, 368], [390, 366], [408, 370]], [[372, 382], [390, 380], [408, 384]]], 2.4);

  // the shield: a rim with rivets, the moon on its face
  const shield = smooth(SHIELD);
  blue += cutout(shield, 10);
  blue += `<path d="${smooth(SHIELD.map(([x, y, c]) => [236 + (x - 236) * 0.86, 318 + (y - 318) * 0.9 + 10, c]))}" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  for (const [x, y] of [[152, 328], [194, 316], [278, 316], [320, 328], [150, 400], [322, 400], [176, 470], [296, 470], [236, 530]]) blue += `<circle cx="${x}" cy="${y}" r="3.4" fill="${PAPER}"/>`;
  // the crescent moon on its face
  const [mx, my] = [228, 410];
  const moon = (id, fill) => `<mask id="guard-${id}"><circle cx="${mx}" cy="${my}" r="58" fill="#fff"/><circle cx="${mx + 28}" cy="${my - 12}" r="50" fill="#000"/></mask><rect mask="url(#guard-${id})" x="${mx - 60}" y="${my - 60}" width="120" height="120" fill="${fill}"/>`;
  blue += moon('moon-b', PAPER);

  // pink: the moon, and the ring of the ward around him, kept off his figure
  let pink = moon('moon-p', PINK);
  pink += `<mask id="guard-ward"><rect width="500" height="700" fill="#fff"/><g fill="#000" stroke="#000" stroke-width="10"><path d="${coif}"/><path d="${helm}"/><path d="${shield}"/></g></mask>`;
  pink += `<circle mask="url(#guard-ward)" cx="${ox}" cy="${oy}" r="${or}" fill="none" stroke="${PINK}" stroke-width="18"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => { const d = Math.abs(Math.hypot(x - ox, y - oy) - or); return 3.4 * Math.max(0, 1 - d / 76); })}"/>`;
  return { blue, pink };
}
