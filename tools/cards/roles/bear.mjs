// The Bear Tamer: a great bear up on its hind legs, roaring, chained by the collar to its small tamer.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, almond, carve, cutout } from '../kit.mjs';

export const seed = 106;

const [hx, hy, ha] = [292, 166, -20]; // the head: centre and tilt (degrees, snout up)
const rot = (pts) => {
  const a = (ha * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  // a shorter muzzle than drawn: everything in front of the brow pulled back a fifth
  return pts.map(([x0, y, k]) => {
    const x = x0 < -46 ? -46 + (x0 + 46) * 0.8 : x0;
    return [hx + x * c - y * s, hy + x * s + y * c, k];
  });
};
const P = (x, y) => rot([[x, y]])[0];

// the head, facing left, its jaws wide open (drawn level, then tilted up)
const HEAD = rot([
  [66, 26], [66, -24], [44, -62], [6, -80], [-30, -72], [-50, -54], [-62, -42], [-90, -36], [-112, -32], [-120, -22, 1], [-116, -10], [-106, -6, 1],
  [-46, 12, 1],
  [-102, 50, 1], [-100, 62], [-72, 74], [-30, 78], [18, 76], [54, 58],
]);
const MOUTH = rot([[-108, -8, 1], [-46, 12, 1], [-102, 50, 1], [-112, 24]]);
const FANGS = [[-98, -6, -92, 12, -84, -4], [-72, 2, -68, 16, -60, 4], [-96, 46, -90, 28, -82, 42], [-72, 36, -66, 22, -58, 32]];

const BODY = [
  [214, 560, 1], [206, 500], [214, 440], [226, 380], [232, 320], [246, 268], [270, 228], [316, 216], [356, 226], [382, 258], [398, 320], [406, 400], [398, 460], [404, 520], [410, 560, 1],
];
const ARM_NEAR = [[254, 282, 62], [212, 318, 52], [172, 318, 46], [146, 306, 42]];
const ARM_FAR = [[372, 256, 60], [414, 228, 50], [430, 180, 44]];

/** A paw with claws, centred on (x, y), its claws pointing along angle a. */
function paw(x, y, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const pad = smooth([[-24, -18], [0, -24], [22, -16], [26, 6], [12, 22], [-12, 22], [-26, 4]].map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]).map(([px, py]) => [px, py]));
  let claws = '';
  for (const o of [-18, -6, 6, 18]) {
    const b = [x + c * 18 - s * o, y + s * 18 + c * o];
    claws += polyD([[b[0] - s * 6.5, b[1] + c * 6.5], [b[0] + c * 30 - s * (o * 0.3), b[1] + s * 30 + c * (o * 0.3)], [b[0] + s * 6.5, b[1] - c * 6.5]]);
  }
  return { pad, claws };
}

export default function draw({ rays, halftone, stars, R }) {
  const [mx, my] = P(-110, 20); // the mouth
  // the roar: arcs flung out of the open jaws
  let roar = '';
  for (const [r, w, a0, a1] of [[40, 7, 2.6, 3.9], [68, 6, 2.55, 3.95], [96, 5, 2.6, 3.9]]) {
    roar += `<path d="M${F(mx + Math.cos(a0) * r)},${F(my + Math.sin(a0) * r)}A${r},${r} 0 0 1 ${F(mx + Math.cos(a1) * r)},${F(my + Math.sin(a1) * r)}" fill="none" stroke="COLOR" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<mask id="bear-roar"><rect width="500" height="700" fill="#fff"/>${roar.replaceAll('COLOR', '#000').replaceAll(/stroke-width="(\d+)"/g, (m, w) => `stroke-width="${+w + 12}"`).replaceAll(/stroke-dasharray="[^"]*"/g, '')}</mask>`;
  blue += `<path mask="url(#bear-roar)" d="${rays(mx, my, 70, 640, 52, 2.2)}" fill="${PAPER}"/>`;
  blue += `<path d="${stars(6, [250, 56, 450, 140], [[mx, my, 150]])}" fill="${PAPER}"/>`;
  // the ground of the fair
  blue += `<path d="M30,536C150,530 330,532 470,526L470,560L30,560Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3"/>`;
  void R;

  // the far arm, raised, behind the body
  blue += cutout(limb(ARM_FAR, true), 9);
  const pf = paw(434, 168, -1.5);
  blue += `<path d="${pf.claws}" fill="${PAPER}"/>`;
  blue += cutout(pf.pad, 7);

  // the body: up on its hind legs
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="bear-body"><path d="${body}"/></clipPath><g clip-path="url(#bear-body)">`;
  // the belly, the legs, tufts of fur
  blue += carve([[[262, 330], [250, 400], [262, 470]], [[364, 330], [376, 400], [366, 470]]], 3);
  blue += `<path d="M300,486C296,516 302,540 310,560" fill="none" stroke="${PAPER}" stroke-width="4"/>`;
  let tufts = [];
  for (let y = 300, row = 0; y < 520; y += 38, row++) for (let x = 244 + (row % 2) * 22 + R() * 8; x < 396; x += 44) tufts.push([[x - 8, y - 5], [x, y + 4], [x + 8, y - 5]]);
  blue += carve(tufts, 2.6);
  blue += `</g>`;
  // feet with claws
  for (const x of [228, 392]) {
    blue += cutout(smooth([[x - 32, 538, 1], [x - 28, 514], [x, 504], [x + 28, 514], [x + 32, 538, 1]]), 6);
    blue += `<path d="${[-18, -6, 6, 18].map((o) => polyD([[x + o - 5, 536], [x + o + 1, 550], [x + o + 5, 536]])).join('')}" fill="${PAPER}"/>`;
  }

  // the head: ears, skull, jaws
  for (const [x, y, r] of [[4, -84, 21], [42, -68, 19]]) {
    const [ex, ey] = P(x, y);
    blue += `<circle cx="${F(ex)}" cy="${F(ey)}" r="${r}" fill="${BLUE}" stroke="${PAPER}" stroke-width="9"/><circle cx="${F(ex)}" cy="${F(ey)}" r="${r}" fill="${BLUE}"/><circle cx="${F(ex)}" cy="${F(ey)}" r="${r - 7}" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;
  }
  const head = smooth(HEAD, true, 0.16);
  blue += cutout(head, 9);
  const mouth = smooth(MOUTH, true, 0.16);
  blue += `<path d="${mouth}" fill="${PAPER}" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>`;
  blue += `<path d="${FANGS.map(([a, b, c, d, e, f]) => polyD(rot([[a, b], [c, d], [e, f]]))).join('')}" fill="${BLUE}"/>`;
  blue += `<clipPath id="bear-head"><path d="${head}"/></clipPath><g clip-path="url(#bear-head)">`;
  blue += carve([rot([[-46, -44], [-26, -38], [-8, -44]]), rot([[30, -24], [46, 4], [42, 34]]), rot([[-24, 62], [6, 54], [34, 56]]), rot([[-70, -26], [-52, -20]])], 2.8);
  blue += `</g>`;
  const [ex, ey] = P(-36, -34);
  blue += `<path d="${almond(ex, ey, 9, 3.4)}" fill="${PAPER}" transform="rotate(${ha + 12} ${F(ex)} ${F(ey)})"/>`;
  const [nx, ny] = P(-110, -24);
  blue += `<circle cx="${F(nx)}" cy="${F(ny)}" r="5" fill="${PAPER}"/>`;

  // the collar and its ring
  const collar = `M246,226C270,248 330,250 362,226L366,242C334,268 266,266 242,244Z`;
  blue += cutout(collar, 6);
  for (const x of [262, 290, 318, 344]) blue += `<circle cx="${x}" cy="${F(242 + (x - 300) * (x - 300) * -0.002 + 6)}" r="3" fill="${PAPER}"/>`;
  const [rx, ry] = [254, 252];
  blue += `<circle cx="${rx}" cy="${ry}" r="11" fill="none" stroke="${PAPER}" stroke-width="12"/><circle cx="${rx}" cy="${ry}" r="11" fill="none" stroke="${BLUE}" stroke-width="5"/>`;

  // the near arm, reaching out, its paw up
  blue += cutout(limb(ARM_NEAR, true), 9);
  blue += carve([[[244, 300], [214, 326], [180, 330]]], 2.8);
  const pn = paw(132, 300, -2.9);
  blue += `<path d="${pn.claws}" fill="${PAPER}"/>`;
  blue += cutout(pn.pad, 7);

  // the tamer: small, in a pointed cap, hauling on the chain
  const [tx, ty] = [92, 420]; // his head
  blue += cutout(smooth([[tx - 40, 540, 1], [tx - 34, 490], [tx - 24, ty + 34], [tx, ty + 26], [tx + 24, ty + 34], [tx + 34, 490], [tx + 40, 540, 1]]), 7);
  blue += carve([[[tx - 30, 498], [tx, 504], [tx + 30, 498]], [[tx, ty + 40], [tx, 494]]], 2.6);
  blue += cutout(`M${tx - 18},540L${tx - 16},552L${tx - 4},552L${tx - 4},540ZM${tx + 4},540L${tx + 4},552L${tx + 16},552L${tx + 18},540Z`, 4);
  blue += cutout(limb([[tx + 20, ty + 40, 16], [tx + 38, ty + 24, 13], [tx + 46, ty + 4, 12]], true), 6);
  blue += cutout(limb([[tx - 20, ty + 40, 16], [tx - 34, ty + 70, 13], [tx - 30, ty + 92, 12]], true), 6);
  blue += cutout(limb([[tx - 30, ty + 92, 6], [tx - 36, ty + 128, 5]], true), 4);
  const face = smooth([[tx - 18, ty - 6], [tx, ty - 14], [tx + 18, ty - 6], [tx + 18, ty + 10], [tx + 8, ty + 22], [tx - 8, ty + 22], [tx - 18, ty + 10]]);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += `<path d="${almond(tx + 7, ty + 4, 5, 2)}${almond(tx - 7, ty + 4, 5, 2)}" fill="${PAPER}"/>`;
  blue += carve([[[tx - 5, ty + 14], [tx, ty + 16], [tx + 5, ty + 14]]], 2);
  const cap = smooth([[tx - 22, ty - 4, 1], [tx - 16, ty - 26], [tx + 4, ty - 44], [tx + 26, ty - 58, 1], [tx + 18, ty - 32], [tx + 22, ty - 4, 1]]);
  blue += cutout(cap, 6);
  blue += `<circle cx="${tx + 28}" cy="${ty - 62}" r="6" fill="${PAPER}"/>`;

  // the chain, from his fist up to the ring
  const [cx0, cy0] = [tx + 48, ty - 2];
  let links = '';
  const N = 15;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = cx0 + (rx - cx0) * t, y = cy0 + (ry - cy0) * t + Math.sin(Math.PI * t) * 26;
    const dx = rx - cx0, dy = ry - cy0 + Math.cos(Math.PI * t) * 26 * Math.PI;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    links += i % 2
      ? `<ellipse cx="${F(x)}" cy="${F(y)}" rx="8" ry="2.4" transform="rotate(${F(ang)} ${F(x)} ${F(y)})" fill="${PAPER}"/>`
      : `<ellipse cx="${F(x)}" cy="${F(y)}" rx="8.5" ry="5.4" transform="rotate(${F(ang)} ${F(x)} ${F(y)})" fill="none" stroke="${BLUE}" stroke-width="9"/><ellipse cx="${F(x)}" cy="${F(y)}" rx="8.5" ry="5.4" transform="rotate(${F(ang)} ${F(x)} ${F(y)})" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
  }
  blue += links;
  blue += cutout(smooth([[cx0 - 10, cy0 + 4], [cx0 - 8, cy0 - 10], [cx0 + 6, cy0 - 12], [cx0 + 12, cy0], [cx0 + 6, cy0 + 12], [cx0 - 6, cy0 + 12]]), 5);

  blue += roar.replaceAll('COLOR', PAPER);

  let pink = `<path d="${mouth}" fill="${PINK}"/>`;
  pink += roar.replaceAll('COLOR', PINK);
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - mx + 30, y - my + 10) / 200))}"/>`;
  return { blue, pink };
}
