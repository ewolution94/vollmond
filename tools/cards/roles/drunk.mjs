// The Drunk: a round man swaying on his feet, a huge tankard raised and slopping over, his head in a spin.
import { BLUE, PAPER, PINK, F, smooth, limb, carve, cutout } from '../kit.mjs';

export const seed = 155;

const TILT = 'rotate(-8 250 620)'; // the whole man leans
const [hx, hy] = [236, 236]; // his face
const [nx, ny, nr] = [hx + 8, hy + 8, 17]; // his nose
const [tx, ty] = [384, 172]; // the tankard's centre

const BODY = [[92, 560, 1], [86, 480], [100, 410], [138, 360], [190, 334], [240, 328], [290, 334], [336, 356], [372, 400], [392, 470], [390, 560, 1]];
const FACE = [[hx - 50, hy - 30], [hx - 26, hy - 58], [hx + 8, hy - 64], [hx + 42, hy - 52], [hx + 60, hy - 20], [hx + 60, hy + 20], [hx + 46, hy + 52], [hx + 14, hy + 70], [hx - 20, hy + 66], [hx - 46, hy + 44], [hx - 58, hy + 10]];
// a floppy cap slipping off to one side, its tip flopped down with a tassel
const CAP = [[hx - 58, hy - 18, 1], [hx - 44, hy - 62], [hx - 4, hy - 86], [hx + 40, hy - 80], [hx + 64, hy - 50], [hx + 62, hy - 28, 1], [hx + 20, hy - 48], [hx - 20, hy - 42]];
const CAP_TIP = [[hx - 30, hy - 70, 40], [hx - 70, hy - 84, 30], [hx - 104, hy - 64, 20], [hx - 116, hy - 30, 12]];
const ARM_UP = [[318, 370, 50], [362, 336, 42], [370, 282, 36], [338, 214, 30]];
const ARM_OUT = [[150, 368, 48], [116, 398, 40], [92, 384, 32], [80, 356, 28]];
const HAND_OUT = [[66, 352], [68, 330], [84, 322], [98, 334], [96, 354], [80, 362]];
const MUG = [[tx - 40, ty - 44, 1], [tx + 40, ty - 44, 1], [tx + 36, ty + 52, 1], [tx - 36, ty + 52, 1]];
const HANDLE = `M${tx - 36},${ty - 24}C${tx - 76},${ty - 30} ${tx - 80},${ty + 30} ${tx - 34},${ty + 30}`;
// the foam heaped over the rim and slopping down one side
const FOAM = [
  [tx - 52, ty - 42], [tx - 60, ty - 62], [tx - 44, ty - 80], [tx - 22, ty - 82], [tx - 8, ty - 100], [tx + 18, ty - 98], [tx + 30, ty - 82], [tx + 50, ty - 84], [tx + 60, ty - 64], [tx + 48, ty - 42],
  [tx + 30, ty - 36], [tx + 12, ty - 40], [tx - 6, ty - 34], [tx - 16, ty - 8], [tx - 28, ty - 4], [tx - 34, ty - 30],
];

/** A spiral of `turns` turns out to radius r, as a list of points. */
const spiral = (cx, cy, r, turns, dir = 1) => {
  const pts = [];
  for (let i = 0; i <= turns * 14; i++) {
    const t = i / (turns * 14), a = dir * t * turns * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t]);
  }
  return pts;
};

export default function draw({ halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // a woozy sky: the carved lines wave
  let waves = '';
  for (let y = 52, i = 0; y < 560; y += 9, i++) {
    const w = 0.7 + Math.max(0, 1 - Math.abs(y - 150) / 320) * 2.3;
    const top = [], bot = [];
    for (let x = 30; x <= 470; x += 44) {
      const t = (x - 30) / 440, taper = Math.sin(Math.PI * t) ** 0.6;
      const yy = y + Math.sin(x / 38 + i * 0.7) * 5 + (R() - 0.5) * 0.8;
      top.push([x, yy - (w * taper) / 2]);
      bot.push([x, yy + (w * taper) / 2]);
    }
    waves += smooth([...top, ...bot.reverse()], true, 0.16);
  }
  blue += `<mask id="drunk-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${tx}" cy="${ty - 60}" r="70" fill="#000"/></mask>`;
  blue += `<path mask="url(#drunk-sky)" fill="${PAPER}" d="${waves}"/>`;
  blue += `<path d="${stars(8, [56, 56, 444, 260], [[tx, ty - 40, 110], [hx, hy - 60, 110]])}" fill="${PAPER}"/>`;

  blue += `<g transform="${TILT}">`;
  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="drunk-body"><path d="${body}"/></clipPath><g clip-path="url(#drunk-body)">`;
  // a jerkin straining over the belly: its laces, a belt sliding down
  blue += carve([[[240, 360], [244, 420], [240, 470]], [[150, 420], [140, 480], [144, 560]], [[330, 420], [344, 480], [344, 560]]], 3);
  blue += `<path d="M232,380L250,392M230,404L250,414M232,428L250,436M248,380L230,392M250,404L230,414M250,428L232,436" stroke="${PAPER}" stroke-width="2.4"/>`;
  blue += `<path d="M88,490C180,512 300,512 394,486" fill="none" stroke="${PAPER}" stroke-width="16"/><path d="M88,490C180,512 300,512 394,486" fill="none" stroke="${BLUE}" stroke-width="8"/>`;
  blue += `<rect x="222" y="492" width="30" height="24" rx="3" fill="none" stroke="${PAPER}" stroke-width="3.4"/>`;
  blue += `</g>`;

  // the arm flung out for balance
  blue += cutout(limb(ARM_OUT, true), 8);
  blue += cutout(smooth(HAND_OUT), 6);
  blue += carve([[[126, 384], [108, 392]]], 2.6);

  // the head: the cap sliding off, droopy eyes, the big nose, a loose grin
  blue += cutout(limb(CAP_TIP, true), 7);
  blue += `<circle cx="${hx - 118}" cy="${hy - 18}" r="14" fill="${PAPER}" stroke="${BLUE}" stroke-width="3"/>`;
  blue += carve([[[hx - 124, hy - 28], [hx - 118, hy - 18], [hx - 112, hy - 6]], [[hx - 130, hy - 16], [hx - 106, hy - 20]]], 2, BLUE);
  const face = smooth(FACE);
  blue += cutout(face, 7);
  blue += cutout(smooth(CAP, true, 0.18), 6);
  blue += carve([[[hx - 50, hy - 30], [hx, hy - 52], [hx + 56, hy - 34]]], 2.6);
  // eyes half shut under heavy lids
  for (const ex of [hx - 20, hx + 34]) {
    blue += `<path d="M${ex - 13},${hy - 8}Q${ex},${hy + 6} ${ex + 13},${hy - 8}Z" fill="${PAPER}"/>`;
    blue += `<path d="M${ex - 15},${hy - 9}H${ex + 15}" stroke="${PAPER}" stroke-width="3.6" stroke-linecap="round"/>`;
    blue += `<circle cx="${ex + 2}" cy="${hy - 4}" r="3.6" fill="${BLUE}"/>`;
  }
  blue += carve([[[hx - 34, hy - 24], [hx - 20, hy - 20], [hx - 6, hy - 22]], [[hx + 20, hy - 22], [hx + 34, hy - 26], [hx + 48, hy - 20]]], 2.6);
  // the grin, lopsided, and the stubble
  const grin = `M${hx - 22},${hy + 36}C${hx},${hy + 44} ${hx + 26},${hy + 42} ${hx + 42},${hy + 30}C${hx + 36},${hy + 58} ${hx - 10},${hy + 64} ${hx - 22},${hy + 36}Z`;
  blue += `<path d="${grin}" fill="${PAPER}"/><path d="M${hx - 16},${hy + 44}C${hx + 4},${hy + 50} ${hx + 24},${hy + 46} ${hx + 38},${hy + 38}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
  let stubble = '';
  for (const [x, y] of [[-30, 52], [-38, 40], [-24, 62], [-8, 70], [8, 72], [26, 66], [40, 56], [50, 44], [-44, 26], [54, 28]]) stubble += `M${hx + x - 1.6},${hy + y}a1.6,1.6 0 1 0 3.2,0a1.6,1.6 0 1 0 -3.2,0Z`;
  blue += `<path d="${stubble}" fill="${PAPER}"/>`;
  const nose = `M${nx - nr},${ny}a${nr},${nr} 0 1 0 ${nr * 2},0a${nr},${nr} 0 1 0 ${-nr * 2},0Z`;
  blue += `<path d="${nose}" fill="${PAPER}" stroke="${BLUE}" stroke-width="10"/><path d="${nose}" fill="${PAPER}" stroke="${PAPER}" stroke-width="3"/><path d="${nose}" fill="none" stroke="${BLUE}" stroke-width="3"/>`;
  blue += `<path d="M${nx - 8},${ny + 7}q3,4 7,2" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`;

  // the raised arm and the tankard, slopping
  blue += cutout(limb(ARM_UP, true), 9);
  blue += carve([[[330, 352], [356, 320], [360, 280]]], 2.6);
  blue += `<path d="${HANDLE}" fill="none" stroke="${PAPER}" stroke-width="26" stroke-linecap="round"/><path d="${HANDLE}" fill="none" stroke="${BLUE}" stroke-width="14" stroke-linecap="round"/>`;
  const mug = smooth(MUG, true);
  blue += cutout(mug, 9);
  blue += carve([[[tx - 38, ty - 22], [tx, ty - 24], [tx + 38, ty - 22]], [[tx - 36, ty + 34], [tx, ty + 32], [tx + 36, ty + 34]]], 3.4);
  blue += carve([[[tx - 18, ty - 12], [tx - 18, ty + 24]], [[tx + 2, ty - 12], [tx + 2, ty + 24]], [[tx + 22, ty - 12], [tx + 22, ty + 24]]], 2.4);
  // his fist round the handle
  const fist = smooth([[tx - 82, ty + 22], [tx - 84, ty - 2], [tx - 68, ty - 14], [tx - 48, ty - 10], [tx - 40, ty + 8], [tx - 46, ty + 28], [tx - 64, ty + 34]]);
  blue += cutout(fist, 6);
  blue += carve([[[tx - 76, ty], [tx - 62, ty - 2], [tx - 48, ty + 2]], [[tx - 78, ty + 14], [tx - 62, ty + 12], [tx - 48, ty + 16]]], 2.2);
  const foam = smooth(FOAM, true, 0.22);
  const splash = [[tx - 70, ty - 112, 7], [tx - 40, ty - 128, 5], [tx + 6, ty - 134, 6], [tx + 48, ty - 120, 5], [tx + 70, ty - 100, 4], [tx - 84, ty - 76, 4.5]];
  let drops = '';
  for (const [x, y, r] of splash) drops += `M${x - r},${y}a${r},${r} 0 1 0 ${r * 2},0a${r},${r} 0 1 0 ${-r * 2},0Z`;
  blue += `<path d="${foam}" fill="${PAPER}" stroke="${BLUE}" stroke-width="8" stroke-linejoin="round"/><path d="${foam}${drops}" fill="${PAPER}"/>`;
  blue += `<path d="M${tx - 30},${ty - 62}a5,5 0 1 0 10,0a5,5 0 1 0 -10,0ZM${tx + 14},${ty - 72}a4,4 0 1 0 8,0a4,4 0 1 0 -8,0ZM${tx + 30},${ty - 54}a3.4,3.4 0 1 0 6.8,0a3.4,3.4 0 1 0 -6.8,0Z" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
  blue += `</g>`;

  // his head in a spin
  const spins = [spiral(hx - 64, hy - 128, 26, 2.2), spiral(hx + 40, hy - 150, 20, 2, -1), spiral(hx - 136, hy - 88, 16, 1.8, -1)];
  blue += carve(spins, 3.2);
  blue += `<path d="M${hx - 10},${hy - 120}l3,-9l3,9l9,3l-9,3l-3,9l-3,-9l-9,-3Z" fill="${PAPER}"/>`;

  let pink = `<g transform="${TILT}"><path d="${foam}${drops}${nose}" fill="${PINK}"/></g>`;
  const [gx, gy] = [tx - 20, ty - 80];
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - gx, y - gy) / 180))}"/>`;
  void F;
  return { blue, pink };
}
