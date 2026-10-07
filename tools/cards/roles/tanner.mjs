// The Tanner: a gloomy tanner beside a pelt laced into its frame, a fresh splash of dye running down it.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 161;

const [hx, hy] = [128, 292]; // his face
const [P1, P2] = [250, 448]; // the frame's posts
const [TOP, FOOT] = [96, 486]; // the frame's crossbars

// a pelt, legs splayed to the corners, laced into the frame
const HC = (P1 + P2) / 2;
const HIDE_R = [[HC, 132], [HC + 18, 138], [HC + 34, 158], [HC + 84, 126, 1], [HC + 54, 182], [HC + 46, 212], [HC + 52, 262], [HC + 46, 316], [HC + 52, 368], [HC + 44, 400], [HC + 86, 462, 1], [HC + 30, 432], [HC + 16, 448], [HC + 7, 454], [HC, 484, 1]];
const HIDE = [...HIDE_R, ...HIDE_R.slice(1, -1).reverse().map(([x, y, c]) => [2 * HC - x, y, c])];
const [sx, sy] = [HC + 2, 262]; // the dye splash

const BODY = [[30, 560, 1], [34, 460], [50, 404], [84, 370], [128, 358], [172, 370], [204, 404], [220, 460], [226, 560, 1]];
const APRON = [[64, 560, 1], [68, 460], [76, 418], [104, 406], [152, 406], [178, 418], [186, 460], [190, 560, 1]];
const FACE = [[hx - 38, hy - 24], [hx - 26, hy - 46], [hx, hy - 52], [hx + 26, hy - 46], [hx + 38, hy - 24], [hx + 38, hy + 8], [hx + 30, hy + 36], [hx + 14, hy + 52], [hx, hy + 56], [hx - 14, hy + 52], [hx - 30, hy + 36], [hx - 38, hy + 8]];
// lank, ragged hair
const HAIR = [[hx - 44, hy + 10, 1], [hx - 48, hy - 28], [hx - 34, hy - 56], [hx, hy - 66], [hx + 34, hy - 56], [hx + 48, hy - 28], [hx + 44, hy + 10, 1], [hx + 38, hy - 14, 1], [hx + 30, hy - 4, 1], [hx + 26, hy - 30], [hx + 14, hy - 22, 1], [hx + 4, hy - 34], [hx - 8, hy - 22, 1], [hx - 18, hy - 34], [hx - 28, hy - 18, 1], [hx - 34, hy - 6, 1], [hx - 38, hy - 16, 1]];

/** A round dot or drop. */
const dot = (x, y, r) => `M${F(x - r)},${F(y)}a${F(r)},${F(r)} 0 1 0 ${F(2 * r)},0a${F(r)},${F(r)} 0 1 0 ${F(-2 * r)},0Z`;

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  blue += `<path fill="${PAPER}" d="${lines(52, 560, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - sy) / 300) * 2.4)}"/>`;
  blue += `<path d="${stars(8, [56, 56, 230, 220], [[hx, hy, 90]])}" fill="${PAPER}"/>`;

  // the frame: two posts, a top bar and a foot bar, pegged
  const posts = `M${P1 - 11},${TOP}H${P1 + 11}V560H${P1 - 11}ZM${P2 - 11},${TOP}H${P2 + 11}V560H${P2 - 11}Z`;
  blue += cutout(posts, 7);
  blue += cutout(`M${P1 - 22},${TOP}H${P2 + 22}V${TOP + 20}H${P1 - 22}Z`, 6);
  blue += cutout(`M${P1},${FOOT}H${P2}V${FOOT + 20}H${P1}Z`, 6);
  blue += carve([[[P1 - 2, 150], [P1 + 2, 280], [P1 - 1, 420]], [[P2 + 2, 160], [P2 - 2, 300], [P2 + 1, 440]], [[P1 + 30, TOP + 9], [HC, TOP + 7], [P2 - 30, TOP + 10]]], 2.2);
  for (const x of [P1, P2]) blue += `<circle cx="${x}" cy="${TOP + 10}" r="4" fill="${PAPER}"/><circle cx="${x}" cy="${FOOT + 10}" r="4" fill="${PAPER}"/>`;

  // the hide stretched in it, laced to the wood, scraped
  const hide = smooth(HIDE, true, 0.18);
  let lace = '';
  for (const [i, toX, toY] of [[0, HC, TOP + 20], [3, HC + 84, TOP + 20], [3, P2, 126], [6, P2, 262], [8, P2, 368], [10, P2, 462], [10, HC + 86, FOOT], [14, HC, FOOT], [18, HC - 86, FOOT], [18, P1, 462], [20, P1, 368], [22, P1, 262], [25, P1, 126], [25, HC - 84, TOP + 20]]) {
    lace += `M${HIDE[i][0]},${HIDE[i][1]}L${toX},${toY}`;
  }
  blue += `<path d="${lace}" stroke="${PAPER}" stroke-width="3" fill="none"/>`;
  blue += cutout(hide, 7);
  blue += `<clipPath id="tanner-hide"><path d="${hide}"/></clipPath><g clip-path="url(#tanner-hide)">`;
  blue += carve([[[HC, 146], [HC - 3, 240], [HC + 2, 360], [HC, 470]], [[HC - 26, 200], [HC - 30, 270]], [[HC + 30, 330], [HC + 34, 400]], [[HC - 26, 340], [HC - 30, 410]], [[HC - 42, 168], [HC - 66, 140]], [[HC + 42, 168], [HC + 66, 140]], [[HC - 40, 418], [HC - 66, 448]], [[HC + 40, 418], [HC + 66, 448]]], 2.4);
  blue += `</g>`;

  // the splash of dye, still running: a burst, two drips, flecks thrown wide
  const burst = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, r = i % 2 ? 24 + R() * 6 : 34 + R() * 12;
    burst.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.9]);
  }
  const drips = limb([[sx - 12, sy + 20, 12], [sx - 13, sy + 56, 9], [sx - 12, sy + 84, 6]], true) + dot(sx - 12, sy + 92, 7)
    + limb([[sx + 14, sy + 18, 10], [sx + 15, sy + 44, 7], [sx + 14, sy + 58, 5]], true) + dot(sx + 14, sy + 64, 5.6);
  const flecks = [[sx - 50, sy - 26, 5], [sx + 50, sy - 34, 4], [sx + 46, sy + 30, 4.6], [sx - 40, sy + 40, 3.6], [sx + 12, sy - 54, 4]].map(([x, y, r]) => dot(x, y, r)).join('');
  const splash = smooth(burst, true, 0.2) + drips + flecks;
  blue += `<path d="${splash}" fill="${PAPER}"/>`;

  // the tanner: a leather apron, a long face gazing at the ruined hide
  const body = smooth(BODY);
  blue += cutout(body);
  const apron = smooth(APRON, true, 0.16);
  blue += `<path d="${apron}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="${smooth(APRON.map(([x, y, c]) => [128 + (x - 128) * 0.84, 406 + (y - 406) * 0.92 + 8, c]), true, 0.16)}" fill="none" stroke="${PAPER}" stroke-width="2" stroke-dasharray="5 5"/>`;
  blue += `<path d="M104,406L112,372M152,406L144,372" stroke="${PAPER}" stroke-width="4"/>`;
  blue += carve([[[50, 460], [46, 520], [46, 560]], [[206, 460], [212, 520], [212, 560]]], 3);
  blue += `<path d="${limb([[hx, hy + 40, 28], [hx, hy + 66, 32]], true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += `<path d="${smooth(FACE)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  blue += cutout(smooth(HAIR, true, 0.16), 6);
  blue += carve([[[hx - 30, hy - 40], [hx - 10, hy - 54]], [[hx + 8, hy - 52], [hx + 28, hy - 40]]], 2.2);
  // ears, and a day's stubble
  for (const s2 of [-1, 1]) blue += `<path d="M${hx + s2 * 38},${hy - 2}c${s2 * 12},-6 ${s2 * 14},18 ${s2 * 2},20" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;
  let stubble = '';
  for (const [x, y] of [[-26, 34], [-18, 44], [-6, 50], [6, 50], [18, 44], [26, 34], [-30, 22], [30, 22], [-12, 40], [12, 40]]) stubble += dot(hx + x, hy + y, 1.5);
  blue += `<path d="${stubble}" fill="${PAPER}"/>`;
  // sad brows, eyes turned to the hide, bags under them, a long frown
  blue += carve([[[hx - 28, hy - 14], [hx - 16, hy - 22], [hx - 4, hy - 28]], [[hx + 4, hy - 28], [hx + 16, hy - 22], [hx + 28, hy - 14]]], 3.4);
  for (const ex of [hx - 16, hx + 16]) {
    blue += `<path d="M${ex - 10},${hy - 2}Q${ex},${hy - 11} ${ex + 10},${hy - 2}Q${ex},${hy + 6} ${ex - 10},${hy - 2}Z" fill="${PAPER}"/><circle cx="${ex + 5}" cy="${hy - 2}" r="3.6" fill="${BLUE}"/>`;
    blue += carve([[[ex - 9, hy + 10], [ex, hy + 13], [ex + 9, hy + 10]]], 2);
  }
  blue += carve([[[hx + 2, hy + 4], [hx + 4, hy + 20], [hx - 2, hy + 24]]], 2.6);
  blue += `<path d="M${hx - 16},${hy + 40}C${hx - 6},${hy + 32} ${hx + 6},${hy + 32} ${hx + 16},${hy + 40}" fill="none" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;

  let pink = `<path d="${splash}" fill="${PINK}"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - sx, (y - sy - 20) * 0.85) / 180))}"/>`;
  return { blue, pink };
}
