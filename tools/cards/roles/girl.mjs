// The Little Girl: a girl with braids peeking out from behind a great tree; far off in the dark
// forest, two eyes look back.
import { BLUE, PAPER, PINK, F, smooth, limb, almond, firs, carve, cutout } from '../kit.mjs';

export const seed = 67;

const [wx, wy] = [376, 408]; // between the wolf's eyes
const [gx, gy] = [214, 300]; // the girl's head

const TRUNK = [
  [20, 30, 1], [150, 30, 1], [160, 90], [176, 140], [208, 96], [236, 30, 1], [270, 30, 1], [236, 110], [204, 180],
  [196, 250], [194, 330], [200, 410], [214, 470], [244, 516], [300, 560, 1], [20, 560, 1],
];
const HAIR = [[gx - 34, gy - 26, 1], [gx - 16, gy - 50], [gx + 18, gy - 56], [gx + 46, gy - 40], [gx + 58, gy - 10], [gx + 58, gy + 22], [gx + 48, gy + 2], [gx + 34, gy - 14], [gx + 8, gy - 20], [gx - 20, gy - 16]];
const FACE = [[gx - 34, gy - 30, 1], [gx + 8, gy - 26], [gx + 40, gy - 14], [gx + 56, gy + 14], [gx + 52, gy + 38], [gx + 36, gy + 54], [gx + 8, gy + 60], [gx - 34, gy + 60, 1]];
const BRAID = [[gx + 54, gy + 12, 20], [gx + 64, gy + 52, 22], [gx + 66, gy + 92, 20], [gx + 62, gy + 130, 14]];
const DRESS = [[160, 380, 1], [210, 364], [250, 372], [276, 410], [286, 480], [294, 560, 1], [160, 560, 1]];

export default function draw({ lines, halftone, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // the night sky over the forest, its lines thinning down into the dark
  blue += `<path fill="${PAPER}" d="${lines(52, 476, 9, (y) => 0.7 + Math.max(0, 1 - (y - 52) / 300) * 2.4)}"/>`;
  // the forest: a ridge of firs, and under it the dark wood
  blue += `<path d="${firs([[262, 352, 120, 70], [312, 346, 150, 84], [362, 352, 104, 64], [414, 340, 170, 90], [466, 350, 130, 76], [236, 360, 80, 50]])}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.6" stroke-linejoin="round"/>`;
  blue += `<path d="M180,478C260,470 360,474 470,464L470,560L180,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  let grass = '';
  for (const [x, y] of [[310, 508], [362, 498], [424, 512], [392, 540], [450, 492]]) grass += `M${x - 10},${y}L${x - 4},${y - 16}L${x},${y}L${x + 5},${y - 20}L${x + 9},${y}L${x + 14},${y - 12}L${x + 16},${y}Z`;
  blue += `<path d="${grass}" fill="${PAPER}"/>`;

  // fireflies and, in the dark, the eyes
  const flies = [[300, 236, 3], [438, 196, 2.6], [312, 448, 2.8], [450, 400, 2.4], [272, 380, 2.4], [400, 330, 2.2], [352, 168, 2.4], [430, 460, 2.2]];
  for (const [x, y, r] of flies) blue += `<circle cx="${x}" cy="${y}" r="${r + 2.4}" fill="${PAPER}"/>`;
  const eye = (x, y, m) => `M${x - 20 * m},${y + 6}Q${x - 4 * m},${y - 12} ${x + 20 * m},${y - 8}Q${x + 6 * m},${y + 12} ${x - 20 * m},${y + 6}Z`;
  const eyes = eye(wx - 32, wy, 1) + eye(wx + 32, wy, -1);
  blue += `<path d="${eyes}" fill="${PAPER}" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>`;
  blue += `<path d="M${wx - 32},${wy - 7}L${wx - 29},${wy + 7}M${wx + 32},${wy - 7}L${wx + 29},${wy + 7}" stroke="${BLUE}" stroke-width="4" stroke-linecap="round"/>`;

  // the girl, behind the tree: her dress, her braid with a bow, her pale face
  blue += cutout(smooth(DRESS), 8);
  blue += carve([[[226, 420], [232, 490], [234, 560]], [[260, 420], [266, 490], [270, 560]]], 2.6);
  blue += carve([[[204, 380], [230, 388], [252, 384]]], 3);
  blue += cutout(limb(BRAID, true), 7);
  for (let i = 0; i < 5; i++) {
    const t = 0.08 + i * 0.18, k = Math.min(2, Math.floor(t * 3)), f = t * 3 - k;
    const x = BRAID[k][0] + (BRAID[k + 1][0] - BRAID[k][0]) * f, y = BRAID[k][1] + (BRAID[k + 1][1] - BRAID[k][1]) * f;
    blue += carve([[[x - 8, y - 4], [x, y + 6], [x + 8, y - 2]]], 2.4);
  }
  const [bx, by] = [BRAID[3][0], BRAID[3][1] + 6];
  blue += `<path d="M${bx},${by}L${bx - 22},${by - 14}L${bx - 20},${by + 14}ZM${bx},${by}L${bx + 22},${by - 12}L${bx + 20},${by + 16}Z" fill="${PAPER}" stroke="${BLUE}" stroke-width="3" stroke-linejoin="round"/><circle cx="${bx}" cy="${by}" r="5" fill="${BLUE}"/>`;
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10"/><path d="${face}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4"/>`;
  blue += cutout(smooth(HAIR), 5);
  blue += carve([[[gx - 4, gy - 46], [gx + 20, gy - 34], [gx + 40, gy - 14]], [[gx - 18, gy - 34], [gx + 10, gy - 26], [gx + 32, gy - 10]]], 2.2);
  // one wide eye looking out toward the dark, a raised brow, a small round mouth
  blue += `<path d="${almond(gx + 22, gy + 12, 13, 5.6)}" fill="${BLUE}"/><path d="${almond(gx + 22, gy + 12, 9.5, 3.6)}" fill="${PAPER}"/><circle cx="${gx + 28}" cy="${gy + 12}" r="5.2" fill="${BLUE}"/>`;
  blue += carve([[[gx + 8, gy - 6], [gx + 22, gy - 12], [gx + 38, gy - 6]]], 3.2, BLUE);
  blue += `<ellipse cx="${gx + 30}" cy="${gy + 40}" rx="4.4" ry="5.6" fill="${BLUE}"/>`;
  blue += `<circle cx="${gx + 4}" cy="${gy + 30}" r="7" fill="none" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="3 3"/>`;

  // the great tree in front of her, and her fingers round its edge
  const trunk = smooth(TRUNK);
  blue += cutout(trunk);
  blue += `<clipPath id="girl-trunk"><path d="${trunk}"/></clipPath><g clip-path="url(#girl-trunk)">`;
  blue += carve([[[56, 40], [66, 200], [54, 380], [70, 560]], [[104, 40], [116, 180], [108, 320], [124, 470], [146, 560]], [[148, 120], [160, 230], [164, 330], [172, 440], [214, 560]], [[30, 140], [36, 300], [28, 460]], [[178, 150], [200, 110], [228, 50]]], 3);
  blue += carve([[[84, 90], [88, 160]], [[132, 240], [138, 300]], [[86, 420], [92, 500]], [[168, 480], [190, 530]]], 2);
  blue += `<ellipse cx="116" cy="372" rx="14" ry="24" fill="${PAPER}"/><ellipse cx="118" cy="374" rx="7" ry="15" fill="${BLUE}"/>`;
  blue += `</g>`;
  for (const [y, l] of [[356, 20], [370, 22], [384, 20], [397, 16]]) {
    const f = limb([[186, y, 11], [190 + l, y + 2, 11]], true);
    blue += `<path d="${f}" fill="${PAPER}" stroke="${PAPER}" stroke-width="6"/><path d="${f}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3"/>`;
  }

  let pink = `<path d="${eyes}" fill="${PINK}"/>`;
  for (const [x, y, r] of flies) pink += `<circle cx="${x}" cy="${y}" r="${r + 2.4}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => {
    let v = 3.8 * Math.max(0, 1 - Math.hypot((x - wx) * 0.7, y - wy) / 180);
    for (const [fx, fy] of flies) v = Math.max(v, 2.4 * Math.max(0, 1 - Math.hypot(x - fx, y - fy) / 26));
    return v;
  })}"/>`;
  return { blue, pink };
}
