// The Thief: a hooded thief in a domino mask, a finger to his lips, two cards hidden behind his back.
import { BLUE, PAPER, PINK, F, smooth, limb, almond, carve, cutout } from '../kit.mjs';

export const seed = 101;

const [fx, fy] = [196, 222]; // the face's centre
const [px, py] = [382, 458]; // the hand behind his back, where the two cards fan out
const CARDS = [-20, 16]; // their tilt, in degrees
const [gx, gy] = [400, 392]; // the glow

const CLOAK = [
  [52, 560, 1], [62, 486], [84, 410], [116, 352], [150, 318], [196, 304], [244, 308], [286, 324], [322, 356], [344, 410], [356, 478], [362, 560, 1],
];
// the hood: a soft peak falling back to the right, open round the face
const HOOD = [
  [112, 352, 1], [118, 292], [126, 230], [140, 172], [164, 128], [198, 104], [236, 98], [270, 104, 1], [262, 124], [272, 160], [280, 210], [284, 262], [298, 312], [322, 352, 1],
  [270, 346], [240, 300], [244, 250], [240, 196], [226, 166], [196, 158], [166, 170], [152, 204], [150, 252], [154, 300], [148, 338],
];
const FACE = [[fx - 42, fy - 30], [fx - 24, fy - 58], [fx + 6, fy - 64], [fx + 34, fy - 52], [fx + 46, fy - 20], [fx + 44, fy + 22], [fx + 30, fy + 50], [fx + 4, fy + 62], [fx - 24, fy + 54], [fx - 40, fy + 26]];
// the domino mask, a little wider than the face, with a notch at the bridge of the nose
const MASK = [
  [fx - 56, fy - 14, 1], [fx - 34, fy - 26], [fx - 14, fy - 24], [fx, fy - 16, 1], [fx + 14, fy - 24], [fx + 34, fy - 26], [fx + 56, fy - 16, 1],
  [fx + 52, fy + 2], [fx + 34, fy + 12], [fx + 14, fy + 8], [fx, fy + 2, 1], [fx - 14, fy + 8], [fx - 34, fy + 12], [fx - 52, fy + 2],
];
const EYES = [[fx - 26, fy - 8], [fx + 26, fy - 8]];
// the near arm folded up, the finger at his lips
const ARM = [[136, 344, 44], [118, 400, 40], [140, 428, 36], [176, 380, 32], [194, 340, 28]];
const FIST = [[176, 334], [180, 312], [200, 304], [218, 312], [220, 334], [204, 348], [184, 346]];
const FINGER = [[204, 312, 13], [205, 286, 12], [205, 262, 11]];
// the far arm behind his back: only the hand shows past the cloak, round the cards
const HAND = [[px - 24, py - 6], [px - 10, py - 14], [px + 12, py - 14], [px + 26, py - 4], [px + 24, py + 14], [px + 6, py + 22], [px - 16, py + 18]];

function card(angle, fill, id) {
  const t = `translate(${px} ${py}) rotate(${angle})`;
  const r = `<rect x="-34" y="-112" width="68" height="100" rx="7"/>`;
  if (fill === PINK) return `<g transform="${t}" fill="${PINK}">${r}</g>`;
  let lat = '';
  for (let k = -160; k < 160; k += 14) lat += `M${k},-120L${k + 120},0M${k + 120},-120L${k},0`;
  return `<g transform="${t}">
<rect x="-34" y="-112" width="68" height="100" rx="7" fill="${PAPER}" stroke="${PAPER}" stroke-width="12"/>
<rect x="-34" y="-112" width="68" height="100" rx="7" fill="${PAPER}" stroke="${BLUE}" stroke-width="4.4"/>
<clipPath id="thief-${id}"><rect x="-25" y="-103" width="50" height="82" rx="3"/></clipPath>
<path clip-path="url(#thief-${id})" d="${lat}" stroke="${BLUE}" stroke-width="2.4" fill="none"/>
<rect x="-25" y="-103" width="50" height="82" rx="3" fill="none" stroke="${BLUE}" stroke-width="2.6"/>
<path d="${'M0,-76L12,-62L0,-48L-12,-62Z'}" fill="${BLUE}"/><path d="M0,-69L5,-62L0,-55L-5,-62Z" fill="${PAPER}"/>
</g>`;
}

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // the night over the rooftops, and a thin moon
  blue += `<path fill="${PAPER}" d="${lines(52, 300, 9, (y) => 0.6 + Math.max(0, 1 - (y - 52) / 260) * 2.2)}"/>`;
  blue += `<mask id="thief-moon"><circle cx="384" cy="118" r="40" fill="#fff"/><circle cx="368" cy="106" r="36" fill="#000"/></mask><rect mask="url(#thief-moon)" x="320" y="60" width="140" height="120" fill="${PAPER}"/>`;
  blue += `<path d="${stars(9, [56, 56, 450, 270], [[fx, 190, 120], [384, 118, 56]])}" fill="${PAPER}"/>`;
  // the wall he leans by: a coping of stones and courses of brick
  const top = 312;
  blue += `<path d="M30,${top - 14}H470V${top}H30Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="3.4"/>`;
  let mortar = '';
  for (let x = 30 + R() * 20; x < 470; x += 56 + R() * 16) mortar += `M${F(x)},${top - 12}V${top - 2}`;
  for (let y = top + 30, row = 0; y < 560; y += 30, row++) {
    mortar += `M30,${y}H470`;
    for (let x = 30 + (row % 2) * 32 + R() * 6; x < 470; x += 64) mortar += `M${F(x)},${y - 28}V${y - 2}`;
  }
  blue += `<path d="${mortar}" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;
  // a few bricks chipped
  for (const [x, y] of [[66, 372], [432, 492], [96, 522], [424, 344]]) blue += `<path d="M${x},${y}l8,-5l6,4l-4,6Z" fill="${PAPER}"/>`;

  // the far arm, going round behind him
  blue += cutout(limb([[310, 360, 40], [336, 410, 36], [352, 446, 32], [px - 16, py, 28]], true), 8);

  const cloak = smooth(CLOAK);
  blue += cutout(cloak);
  blue += `<clipPath id="thief-cloak"><path d="${cloak}"/></clipPath><g clip-path="url(#thief-cloak)">`;
  blue += carve([[[96, 452], [86, 506], [80, 560]], [[156, 456], [152, 510], [150, 560]], [[230, 420], [240, 490], [244, 560]], [[296, 430], [306, 494], [310, 560]], [[276, 360], [292, 400], [298, 440]]], 3);
  // a belt and a heavy purse
  blue += `<path d="M60,474C150,486 270,486 360,470" fill="none" stroke="${PAPER}" stroke-width="10"/><path d="M60,474C150,486 270,486 360,470" fill="none" stroke="${BLUE}" stroke-width="4"/>`;
  blue += `</g>`;
  const purse = smooth([[262, 486, 1], [284, 486, 1], [296, 512], [292, 534], [272, 540], [252, 532], [250, 510]]);
  blue += cutout(purse, 6);
  blue += carve([[[256, 496], [272, 500], [290, 494]], [[262, 516], [270, 524]]], 2.4);
  blue += `<circle cx="273" cy="482" r="5" fill="${PAPER}"/>`;

  // the hood, and the pale face inside it
  const hood = smooth(HOOD);
  blue += cutout(hood, 9);
  blue += `<clipPath id="thief-hood"><path d="${hood}"/></clipPath><g clip-path="url(#thief-hood)">`;
  blue += carve([[[214, 112], [252, 128], [262, 170], [266, 230], [272, 290]], [[140, 200], [132, 250], [132, 310]], [[176, 120], [156, 150], [146, 190]]], 3);
  blue += `</g>`;
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${PAPER}"/>`;
  blue += `<path d="${face}" fill="none" stroke="${BLUE}" stroke-width="4"/>`;
  // the brows, raised; the nose; the lips either side of the finger
  blue += carve([[[fx - 40, fy - 38], [fx - 24, fy - 46], [fx - 8, fy - 40]], [[fx + 8, fy - 40], [fx + 26, fy - 48], [fx + 42, fy - 38]]], 3.4, BLUE);
  blue += carve([[[fx + 2, fy + 6], [fx + 10, fy + 24], [fx, fy + 28]]], 3, BLUE);
  blue += carve([[[fx - 22, fy + 40], [fx - 12, fy + 42]], [[fx + 20, fy + 40], [fx + 30, fy + 37]]], 3, BLUE);

  // the mask
  const mask = smooth(MASK, true, 0.18);
  blue += cutout(mask, 7);
  const eyes = EYES.map(([x, y], i) => almond(x, y, 14, 5)).join('');
  blue += `<path d="${eyes}" fill="${PAPER}"/>`;
  blue += EYES.map(([x, y]) => `<circle cx="${x - 3}" cy="${y}" r="3.4" fill="${BLUE}"/>`).join('');

  blue += cutout(limb(ARM, true), 8);
  blue += carve([[[128, 368], [118, 398], [128, 414]]], 2.6);
  blue += cutout(limb(FINGER, true), 5);
  blue += cutout(smooth(FIST), 6);
  blue += carve([[[182, 324], [198, 322], [214, 326]], [[184, 336], [198, 336], [210, 338]]], 2.2);

  // the cards and the hand holding them
  blue += CARDS.map((a, i) => card(a, PAPER, `card${i}`)).join('');
  // the hand behind his back: palm out, fingers curled over the cards' edge
  blue += cutout(smooth(HAND), 7);
  const fingers = [-16, -5, 6, 17].map((dx, i) => limb([[px + dx, py - 4, 11], [px + dx + 1, py - 20 - (i === 1 || i === 2 ? 4 : 0), 10]], true)).join('');
  blue += cutout(fingers, 5);
  blue += carve([[[px - 20, py + 4], [px, py + 8], [px + 20, py + 4]]], 2.2);

  let pink = CARDS.map((a) => card(a, PINK)).join('');
  pink += `<path d="${eyes}" fill="${PINK}"/>`;
  pink += `<mask id="thief-glow"><rect width="500" height="700" fill="#fff"/><path d="${face}" fill="#000" stroke="#000" stroke-width="12"/></mask>`;
  pink += `<path mask="url(#thief-glow)" fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - gx, y - gy) / 210))}"/>`;
  return { blue, pink };
}
