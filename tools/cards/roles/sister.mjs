// The Two Sisters: two girls side by side holding hands, one ribbon tied in a bow round their hands.
import { BLUE, PAPER, PINK, F, smooth, limb, heart, carve, cutout } from '../kit.mjs';

export const seed = 103;

const [kx, ky] = [250, 424]; // the bow's knot, on their clasped hands
const HY = 220; // the faces' centre line
const SIS = [170, 330];

/** One sister, centred on x; `s` is the side her sister stands on (+1 right, -1 left). */
function sister(cx, s, pass) {
  const X = (dx) => cx + dx * s; // dx > 0 is toward her sister
  let out = '';
  if (pass === 'body') {
    const dress = smooth([
      [X(-56), 318], [X(-36), 300], [X(0), 296], [X(36), 300], [X(56), 318], [X(48), 360], [X(34), 402], [X(58), 470], [X(80), 560, 1],
      [X(-84), 560, 1], [X(-62), 470], [X(-36), 402], [X(-48), 360],
    ]);
    out += cutout(dress, 9);
    const id = `sister-dress${cx}`;
    out += `<clipPath id="${id}"><path d="${dress}"/></clipPath><g clip-path="url(#${id})">`;
    out += `<path d="M${X(-60)},${404}C${X(-20)},${414} ${X(20)},${414} ${X(60)},${404}" fill="none" stroke="${PAPER}" stroke-width="9"/><path d="M${X(-60)},${404}C${X(-20)},${414} ${X(20)},${414} ${X(60)},${404}" fill="none" stroke="${BLUE}" stroke-width="3.4"/>`;
    if (s > 0) {
      out += carve([[[X(-40), 430], [X(-52), 490], [X(-62), 560]], [[X(-12), 430], [X(-16), 490], [X(-20), 560]], [[X(16), 430], [X(22), 490], [X(28), 560]], [[X(42), 430], [X(56), 490], [X(66), 560]]], 2.8);
    } else {
      let dots = '';
      for (let y = 432, r = 0; y < 560; y += 22, r++) for (let x = cx - 90 + (r % 2) * 11; x < cx + 90; x += 22) dots += `M${x - 3.4},${y}a3.4,3.4 0 1 0 6.8,0a3.4,3.4 0 1 0 -6.8,0Z`;
      out += `<path d="${dots}" fill="${PAPER}"/>`;
    }
    out += carve([[[X(-74), 536], [X(0), 544], [X(74), 536]]], 3);
    out += carve([[[X(-24), 334], [X(-20), 372], [X(-24), 396]], [[X(22), 334], [X(18), 372], [X(22), 396]]], 2.4);
    out += `</g>`;
    // a round collar
    out += `<path d="M${cx - 34},${302}C${cx - 32},${326} ${cx - 6},${330} ${cx},${306}C${cx + 6},${330} ${cx + 32},${326} ${cx + 34},${302}C${cx + 12},${296} ${cx - 12},${296} ${cx - 34},${302}Z" fill="${PAPER}" stroke="${BLUE}" stroke-width="3"/>`;
    // the outer arm, hanging, and its hand
    out += cutout(limb([[X(-52), 316, 32], [X(-66), 376, 28], [X(-72), 432, 24]], true), 7);
    out += cutout(smooth([[X(-84), 430], [X(-72), 420], [X(-58), 428], [X(-58), 448], [X(-70), 458], [X(-84), 450]]), 6);
    out += carve([[[X(-58), 324], [X(-50), 340]]], 2.4);
  }
  if (pass === 'arm') {
    out += cutout(limb([[X(46), 318, 30], [X(58), 370, 26], [X(74), ky - 6, 22]], true), 7);
  }
  if (pass === 'head') {
    // the outer braid, over her shoulder, a little bow at its end
    const outer = [[X(-42), HY + 20, 20], [X(-50), HY + 66, 22], [X(-52), HY + 112, 20], [X(-50), HY + 146, 14]];
    out += cutout(limb(outer, true), 6);
    out += braidCuts(outer);
    const [bx, by] = [X(-50), HY + 156];
    out += `<path d="M${bx},${by}L${bx - 16},${by - 10}L${bx - 14},${by + 10}ZM${bx},${by}L${bx + 16},${by - 10}L${bx + 14},${by + 10}Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>`;
    // the face
    const face = smooth([[cx - 38, HY - 20], [cx, HY - 40], [cx + 38, HY - 20], [cx + 36, HY + 18], [cx + 22, HY + 42], [cx, HY + 50], [cx - 22, HY + 42], [cx - 36, HY + 18]]);
    out += `<path d="${face}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10"/><path d="${face}" fill="${PAPER}" stroke="${BLUE}" stroke-width="4"/>`;
    // hair parted in the middle, falling into the braids
    const hair = smooth([
      [cx - 46, HY + 24, 1], [cx - 48, HY - 14], [cx - 36, HY - 46], [cx, HY - 58], [cx + 36, HY - 46], [cx + 48, HY - 14], [cx + 46, HY + 24, 1],
      [cx + 36, HY + 6], [cx + 30, HY - 18], [cx + 14, HY - 28], [cx, HY - 22, 1], [cx - 14, HY - 28], [cx - 30, HY - 18], [cx - 36, HY + 6],
    ]);
    out += cutout(hair, 7);
    out += carve([[[cx - 6, HY - 50], [cx - 22, HY - 40], [cx - 36, HY - 12]], [[cx + 6, HY - 50], [cx + 22, HY - 40], [cx + 36, HY - 12]], [[cx, HY - 56], [cx, HY - 26]]], 2.4);
    // eyes closed in a smile, a small mouth, cheeks
    out += carve([[[cx - 22, HY + 10], [cx - 14, HY + 4], [cx - 6, HY + 10]], [[cx + 6, HY + 10], [cx + 14, HY + 4], [cx + 22, HY + 10]]], 3.4, BLUE);
    out += carve([[[cx - 9, HY + 28], [cx, HY + 33], [cx + 9, HY + 28]]], 3, BLUE);
    for (const d of [-24, 24]) out += `<circle cx="${cx + d}" cy="${HY + 24}" r="6" fill="none" stroke="${BLUE}" stroke-width="1.8" stroke-dasharray="3 3"/>`;
  }
  if (pass === 'braid') {
    const inner = [[X(42), HY + 20, 20], [X(48), HY + 66, 22], [X(48), HY + 112, 20], [X(46), HY + 146, 14]];
    out += cutout(limb(inner, true), 6);
    out += braidCuts(inner);
    const [bx, by] = [X(46), HY + 156];
    out += `<path d="M${bx},${by}L${bx - 16},${by - 10}L${bx - 14},${by + 10}ZM${bx},${by}L${bx + 16},${by - 10}L${bx + 14},${by + 10}Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return out;
}

function braidCuts(pts) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const t = 0.1 + i * 0.18, k = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), f = t * (pts.length - 1) - k;
    const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
    out += carve([[[x - 8, y - 4], [x, y + 5], [x + 8, y - 4]]], 2.4);
  }
  return out;
}

export default function draw({ rays, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path d="${rays(kx, ky, 40, 560, 44, 2.2)}" fill="${PAPER}"/>`;
  for (let i = 0; i < 3; i++) blue += `<circle cx="${kx}" cy="${ky}" r="${74 + i * 10}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.7)}" stroke-dasharray="${F(24 + R() * 20)} ${F(4 + R() * 5)}"/>`;
  blue += `<path d="${stars(10, [56, 56, 444, 200], [[kx, ky, 150], [SIS[0], HY, 70], [SIS[1], HY, 70]])}" fill="${PAPER}"/>`;
  // a meadow under them
  blue += `<path d="M30,512C150,500 340,500 470,510L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  let grass = '';
  for (const [x, y] of [[54, 530], [450, 528], [62, 548]]) grass += `M${x - 10},${y}L${x - 4},${y - 16}L${x},${y}L${x + 5},${y - 20}L${x + 9},${y}L${x + 14},${y - 12}L${x + 16},${y}Z`;
  blue += `<path d="${grass}" fill="${PAPER}"/>`;

  for (const pass of ['body', 'arm']) blue += sister(SIS[0], 1, pass) + sister(SIS[1], -1, pass);
  // the clasped hands
  blue += cutout(smooth([[kx - 22, ky + 6], [kx - 14, ky - 12], [kx + 4, ky - 16], [kx + 22, ky - 6], [kx + 22, ky + 18], [kx + 8, ky + 28], [kx - 12, ky + 26]]), 7);
  for (const pass of ['head', 'braid']) blue += sister(SIS[0], 1, pass) + sister(SIS[1], -1, pass);

  // the bow that ties their braids together
  const loops = `M${kx},${ky}C${kx - 20},${ky - 30} ${kx - 50},${ky - 30} ${kx - 52},${ky - 8}C${kx - 54},${ky + 14} ${kx - 26},${ky + 18} ${kx},${ky}Z` +
    `M${kx},${ky}C${kx + 20},${ky - 30} ${kx + 50},${ky - 30} ${kx + 52},${ky - 8}C${kx + 54},${ky + 14} ${kx + 26},${ky + 18} ${kx},${ky}Z`;
  const tails = `M${kx - 4},${ky + 4}L${kx - 22},${ky + 52}L${kx - 12},${ky + 46}L${kx - 6},${ky + 58}L${kx + 4},${ky + 6}Z` +
    `M${kx + 4},${ky + 4}L${kx + 26},${ky + 50}L${kx + 14},${ky + 46}L${kx + 10},${ky + 58}L${kx - 2},${ky + 6}Z`;
  const knot = heart(kx, ky + 1, 13);
  const bow = tails + loops + knot;
  blue += `<path d="${bow}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/>`;
  blue += `<path d="${tails}${loops}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4" stroke-linejoin="round"/>`;
  blue += carve([[[kx - 18, ky - 8], [kx - 32, ky - 12], [kx - 42, ky - 6]], [[kx + 18, ky - 8], [kx + 32, ky - 12], [kx + 42, ky - 6]]], 2.2, BLUE);
  blue += `<path d="${knot}" fill="${PAPER}" stroke="${BLUE}" stroke-width="3.4"/>`;

  let pink = `<path d="${bow}" fill="${PINK}"/>`;
  pink += `<mask id="sister-glow"><rect width="500" height="700" fill="#fff"/>${SIS.map((x) => `<ellipse cx="${x}" cy="${HY + 6}" rx="48" ry="56" fill="#000"/>`).join('')}</mask>`;
  pink += `<path mask="url(#sister-glow)" fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - kx, y - ky) / 200))}"/>`;
  return { blue, pink };
}
