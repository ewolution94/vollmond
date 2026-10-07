// The Witch: a witch in profile under a crooked hat, holding up her two potions: one heals, one kills.
import { BLUE, PAPER, PINK, F, smooth, limb, almond, heart, carve, cutout } from '../kit.mjs';

export const seed = 53;

const BODY = [
  [58, 560, 1], [70, 480], [88, 412], [102, 386, 1], [96, 360, 1], [116, 350, 1], [106, 318, 1], [126, 306, 1], [124, 276, 1], [146, 262],
  [196, 250], [230, 252], [238, 266, 1], [252, 282], [276, 302], [298, 330, 1], [284, 332], [262, 318, 1], [260, 328], [252, 334, 1], [262, 342],
  [280, 350, 1], [256, 366], [238, 372, 1], [256, 392], [270, 440], [282, 500], [294, 560, 1],
];
const HAT = [
  // the brim, then the crown leaning back with a kink, the tip flopping over
  [104, 254, 1], [150, 236], [204, 230], [262, 226], [306, 230, 1], [262, 244], [204, 250], [150, 256],
];
const CROWN = [[164, 240, 1], [176, 186], [182, 140], [174, 112, 1], [150, 86], [118, 70], [92, 76, 1], [124, 70], [156, 72], [196, 98, 1], [214, 150], [232, 196], [244, 238, 1]];
const ARM_FAR = [[236, 410, 36], [292, 388, 32], [326, 344, 30], [340, 304, 32], [346, 280, 34]];
const ARM_NEAR = [[172, 396, 50], [196, 444, 48], [250, 456, 42], [318, 428, 36], [362, 402, 30]];
const HAND_FAR = [[334, 266], [334, 246], [354, 238], [372, 246], [370, 264], [350, 276]];
const HAND_NEAR = [[354, 410], [364, 388], [386, 380], [400, 394], [392, 412], [370, 418]];

// The potions: a round flask (healing) and a square bottle (poison).
const [ax, ay, ar] = [358, 198, 40];
const [bx, by] = [410, 356];

export default function draw({ halftone, stars, R }) {
  const [gx, gy] = [372, 270];
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // a sky of wavy carved lines, rippling as if stirred
  let waves = '';
  for (let y = 52, i = 0; y < 552; y += 9, i++) {
    const w = 0.7 + Math.max(0, 1 - Math.hypot(0, y - gy) / 300) * 2.4;
    const top = [], bot = [];
    for (let x = 30; x <= 470; x += 55) {
      const t = (x - 30) / 440, taper = Math.sin(Math.PI * t) ** 0.6;
      const yy = y + Math.sin(x / 46 + i * 0.5) * 4 + (R() - 0.5) * 0.8;
      top.push([x, yy - (w * taper) / 2]);
      bot.push([x, yy + (w * taper) / 2]);
    }
    waves += smooth([...top, ...bot.reverse()], true, 0.16);
  }
  blue += `<mask id="witch-sky"><rect width="500" height="700" fill="#fff"/><circle cx="${ax}" cy="${ay}" r="${ar + 30}" fill="#000"/><circle cx="${bx}" cy="${by}" r="70" fill="#000"/></mask>`;
  blue += `<path mask="url(#witch-sky)" fill="${PAPER}" d="${waves}"/>`;
  // a crescent moon behind the hat
  blue += `<mask id="witch-moon"><circle cx="404" cy="98" r="44" fill="#fff"/><circle cx="386" cy="86" r="40" fill="#000"/></mask><rect mask="url(#witch-moon)" x="300" y="40" width="200" height="120" fill="${PAPER}"/>`;
  blue += `<path d="${stars(10, [60, 56, 450, 200], [[150, 130, 90], [404, 98, 60], [ax, ay, 90]])}" fill="${PAPER}"/>`;

  // the far arm reaches out from behind the body
  blue += cutout(limb(ARM_FAR), 8);
  blue += carve([[[326, 300], [340, 306], [354, 304]]], 3);

  const body = smooth(BODY);
  blue += cutout(body);
  blue += `<clipPath id="witch-body"><path d="${body}"/></clipPath><g clip-path="url(#witch-body)">`;
  blue += carve([[[132, 300], [118, 350], [96, 420]], [[150, 296], [138, 360], [122, 440]], [[170, 300], [162, 350], [150, 400]], [[130, 460], [126, 510], [118, 560]], [[200, 470], [210, 520], [214, 560]], [[250, 452], [262, 506], [266, 560]]], 3);
  blue += `</g>`;
  blue += `<path d="${almond(236, 284, 8, 3)}" fill="${PAPER}"/><path d="M220,272Q234,264 250,272" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>`;
  blue += `<circle cx="276" cy="306" r="3.2" fill="${PAPER}"/>`;
  blue += carve([[[236, 300], [248, 316], [250, 330]]], 2.4);

  const crown = smooth(CROWN), hat = smooth(HAT);
  blue += cutout(crown, 9);
  blue += `<clipPath id="witch-crown"><path d="${crown}"/></clipPath><g clip-path="url(#witch-crown)">`;
  blue += carve([[[166, 214], [204, 208], [244, 214]], [[166, 226], [204, 220], [244, 226]]], 3);
  blue += carve([[[190, 196], [186, 150], [176, 120]], [[150, 90], [128, 78]]], 2.4);
  blue += `<rect x="194" y="210" width="16" height="18" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
  blue += `</g>`;
  blue += cutout(hat, 8);
  blue += carve([[[132, 248], [200, 240], [280, 234]]], 2.4);

  // the flask in the far hand
  const flask = smooth([[ax - 9, ay - ar - 26, 1], [ax + 9, ay - ar - 26, 1], [ax + 10, ay - ar + 4, 1], [ax + ar * 0.8, ay - ar * 0.55], [ax + ar, ay + 4], [ax + ar * 0.72, ay + ar * 0.74], [ax, ay + ar], [ax - ar * 0.72, ay + ar * 0.74], [ax - ar, ay + 4], [ax - ar * 0.8, ay - ar * 0.55], [ax - 10, ay - ar + 4, 1]]);
  blue += `<path d="${flask}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${flask}" fill="${PAPER}" stroke="${BLUE}" stroke-width="5" stroke-linejoin="round"/>`;
  blue += `<rect x="${ax - 14}" y="${ay - ar - 30}" width="28" height="7" rx="3" fill="${BLUE}"/>`;
  blue += `<path d="${heart(ax, ay + 10, 15)}" fill="${BLUE}"/>`;
  blue += `<path d="M${ax - ar + 12},${ay - 8}Q${ax},${ay - 14} ${ax + ar - 12},${ay - 8}" fill="none" stroke="${BLUE}" stroke-width="2.4"/>`;
  blue += cutout(smooth(HAND_FAR), 6);
  blue += carve([[[338, 248], [342, 258]], [[350, 246], [353, 258]], [[362, 248], [363, 258]]], 2.2);

  // the near arm and the bottle
  blue += cutout(limb(ARM_NEAR), 9);
  blue += carve([[[194, 420], [224, 442], [266, 440], [316, 412]]], 2.6);
  const bottle = `M${bx - 8},${by - 72}L${bx + 8},${by - 72}L${bx + 8},${by - 52}L${bx + 30},${by - 36}L${bx + 30},${by + 40}L${bx - 30},${by + 40}L${bx - 30},${by - 36}L${bx - 8},${by - 52}Z`;
  blue += `<path d="${bottle}" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/><path d="${bottle}" fill="${PAPER}" stroke="${BLUE}" stroke-width="5" stroke-linejoin="round"/>`;
  blue += `<rect x="${bx - 12}" y="${by - 82}" width="24" height="12" rx="2" fill="${BLUE}"/>`;
  // the skull: a dome, two eye holes, teeth
  blue += `<path d="M${bx - 14},${by + 6}C${bx - 18},${by - 22} ${bx + 18},${by - 22} ${bx + 14},${by + 6}L${bx + 9},${by + 10}L${bx + 9},${by + 18}L${bx - 9},${by + 18}L${bx - 9},${by + 10}Z" fill="${BLUE}"/>`;
  blue += `<circle cx="${bx - 6}" cy="${by - 2}" r="4.4" fill="${PAPER}"/><circle cx="${bx + 6}" cy="${by - 2}" r="4.4" fill="${PAPER}"/><path d="M${bx - 3},${by + 12}V${by + 18}M${bx + 3},${by + 12}V${by + 18}" stroke="${PAPER}" stroke-width="1.8"/>`;
  blue += `<path d="M${bx - 22},${by + 30}L${bx + 22},${by + 22}M${bx - 22},${by + 22}L${bx + 22},${by + 30}" stroke="${BLUE}" stroke-width="3.6" stroke-linecap="round"/>`;
  blue += cutout(smooth(HAND_NEAR), 6);
  blue += carve([[[368, 392], [382, 398], [394, 396]], [[364, 404], [378, 410], [390, 408]]], 2.2);

  // the vapour: wisps rising from the flask
  const wisp = (dx, h, lift) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([ax + dx * (0.4 + t * 1.6) + Math.sin(t * Math.PI * 2.4) * 9 * (0.3 + t), ay - ar - 40 - lift - t * h, 6 - t * 4.4]);
    }
    return limb(pts, true);
  };
  const wisps = [wisp(-14, 76, 8), wisp(0, 104, 0), wisp(14, 80, 8)].join('');
  blue += `<path d="${wisps}" fill="${PAPER}"/>`;
  const bubbles = [[ax + 30, ay - ar - 22, 4], [ax - 28, ay - ar - 30, 3.4], [bx + 24, by - 88, 3.4], [bx + 8, by - 104, 2.6]];
  for (const [x, y, r] of bubbles) blue += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;

  let pink = `<clipPath id="witch-flask"><path d="${flask}"/></clipPath><rect clip-path="url(#witch-flask)" x="${ax - ar}" y="${ay - 8}" width="${ar * 2}" height="${ar + 8}" fill="${PINK}"/>`;
  pink += `<clipPath id="witch-bottle"><path d="${bottle}"/></clipPath><rect clip-path="url(#witch-bottle)" x="${bx - 30}" y="${by - 20}" width="60" height="60" fill="${PINK}"/>`;
  pink += `<g clip-path="url(#witch-flask)"><path fill="${PINK}" d="${halftone([ax - ar, ay - ar, ax + ar, ay - 8], 5, (x, y) => 2.4 * (1 - (ay - 8 - y) / ar))}"/></g>`;
  pink += `<path d="${wisps}" fill="${PINK}"/>`;
  for (const [x, y, r] of bubbles) pink += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${PINK}" stroke-width="2.4"/>`;
  pink += `<path fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - gx, y - gy) / 230))}"/>`;
  void F;
  return { blue, pink };
}
