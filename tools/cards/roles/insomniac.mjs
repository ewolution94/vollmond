// The Insomniac: a woman sitting bolt upright in bed, wide awake, by the light of one candle; the
// clock on the wall ticks on.
import { BLUE, PAPER, PINK, F, smooth, limb, polyD, carve, cutout } from '../kit.mjs';

export const seed = 157;

const [hx, hy] = [190, 268]; // her face
const [cx, cy] = [392, 300]; // the candle flame's foot... its centre
const [kx, ky, kr] = [372, 132, 54]; // the clock

const FACE = [[hx - 42, hy - 18], [hx - 30, hy - 44], [hx, hy - 52], [hx + 30, hy - 44], [hx + 42, hy - 18], [hx + 42, hy + 12], [hx + 32, hy + 40], [hx + 14, hy + 54], [hx, hy + 56], [hx - 14, hy + 54], [hx - 32, hy + 40], [hx - 42, hy + 12]];
// a nightcap, its long tip flopped over with a tassel
const CAP = [[hx - 52, hy - 8, 1], [hx - 50, hy - 46], [hx - 24, hy - 72], [hx + 16, hy - 76], [hx + 48, hy - 56], [hx + 56, hy - 18, 1], [hx + 30, hy - 38], [hx, hy - 44], [hx - 30, hy - 38]];
const CAP_TIP = [[hx + 10, hy - 70, 44], [hx + 56, hy - 92, 30], [hx + 92, hy - 76, 18], [hx + 104, hy - 46, 8]];
const HAIR = [[hx - 52, hy - 12], [hx - 62, hy + 30], [hx - 54, hy + 70], [hx - 40, hy + 50], [hx - 40, hy + 10]];
const BODY = [[96, 470, 1], [100, 400], [118, 356], [150, 332], [190, 324], [230, 332], [262, 356], [280, 400], [284, 470, 1]];
const BLANKET = [[30, 560, 1], [30, 452], [80, 430], [140, 424], [200, 432], [260, 424], [306, 434], [334, 460], [342, 560, 1]];
const HEADBOARD = 'M58,480L58,262C58,206 120,178 190,178C260,178 322,206 322,262L322,480Z';
const FIST = (x) => [[x - 20, 440], [x - 22, 418], [x - 8, 406], [x + 12, 408], [x + 20, 422], [x + 16, 442], [x, 448]];

export default function draw({ lines, halftone, stars, R }) {
  let blue = `<rect x="0" y="0" width="500" height="700" fill="${BLUE}"/>`;
  // the wall, carved in lines that thicken toward the light
  blue += `<mask id="insomniac-wall"><rect width="500" height="700" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="58" fill="#000"/><circle cx="${kx}" cy="${ky}" r="${kr + 14}" fill="#000"/></mask>`;
  blue += `<path mask="url(#insomniac-wall)" fill="${PAPER}" d="${lines(52, 470, 9, (y) => 0.6 + Math.max(0, 1 - Math.abs(y - cy) / 300) * 2.4)}"/>`;
  for (let i = 0; i < 5; i++) blue += `<circle cx="${cx}" cy="${cy}" r="${44 + i * 10}" fill="none" stroke="${PAPER}" stroke-width="${F(3 - i * 0.45)}" stroke-dasharray="${F(22 + R() * 26)} ${F(4 + R() * 6)}"/>`;
  // a little window: the night outside, stars in it
  blue += `<path d="M64,170V96C64,70 84,56 106,56C128,56 148,70 148,96V170Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="7"/>`;
  blue += `<path d="${stars(4, [74, 70, 140, 162])}" fill="${PAPER}"/><path d="M106,60V170M66,118H146" stroke="${PAPER}" stroke-width="3.4"/>`;

  // the clock: a wooden rim, a dark face with carved hours, hands at a quarter to three
  blue += `<circle cx="${kx}" cy="${ky}" r="${kr}" fill="${BLUE}" stroke="${PAPER}" stroke-width="8"/><circle cx="${kx}" cy="${ky}" r="${kr - 10}" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, l = i % 3 === 0 ? 12 : 6;
    blue += `<path d="M${F(kx + Math.cos(a) * (kr - 16))},${F(ky + Math.sin(a) * (kr - 16))}L${F(kx + Math.cos(a) * (kr - 16 - l))},${F(ky + Math.sin(a) * (kr - 16 - l))}" stroke="${PAPER}" stroke-width="${i % 3 === 0 ? 4 : 2.6}" stroke-linecap="round"/>`;
  }
  blue += `<path d="M${kx},${ky}L${kx + 22},${ky - 12}M${kx},${ky}L${kx - 30},${ky - 4}" stroke="${PAPER}" stroke-width="5" stroke-linecap="round"/><circle cx="${kx}" cy="${ky}" r="5" fill="${PAPER}"/>`;
  blue += `<path d="M${kx - 8},${ky + kr + 4}L${kx},${ky + kr + 30}L${kx + 8},${ky + kr + 4}Z" fill="${PAPER}"/>`;

  // the bed's headboard, carved with an arch
  blue += cutout(HEADBOARD, 8);
  blue += `<path d="M84,470V276C84,232 132,206 190,206C248,206 296,232 296,276V470" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
  // the pillow behind her
  blue += cutout(smooth([[100, 360], [116, 320], [190, 312], [264, 320], [280, 360], [262, 392], [190, 398], [118, 392]]), 7);

  // her in her nightgown, hair loose under the cap
  const body = smooth(BODY);
  blue += cutout(body);
  blue += carve([[[160, 340], [190, 360], [220, 340]], [[150, 380], [144, 440]], [[230, 380], [236, 440]]], 3);
  blue += cutout(smooth(HAIR) + smooth(HAIR.map(([x, y]) => [2 * hx - x, y])), 6);
  blue += `<path d="${limb([[hx, hy + 40, 30], [hx, hy + 70, 34]], true)}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  const face = smooth(FACE);
  blue += `<path d="${face}" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  blue += cutout(limb(CAP_TIP, true), 6);
  blue += `<circle cx="${hx + 108}" cy="${hy - 38}" r="11" fill="${PAPER}" stroke="${BLUE}" stroke-width="3"/>`;
  const cap = smooth(CAP, true, 0.18);
  blue += cutout(cap, 6);
  blue += carve([[[hx - 48, hy - 20], [hx, hy - 38], [hx + 52, hy - 22]]], 2.6);
  blue += carve([[[hx + 20, hy - 74], [hx + 56, hy - 84]], [[hx + 70, hy - 84], [hx + 90, hy - 66]]], 2.2);
  // wide, staring eyes, dark rings under them; brows raised; a tight little mouth
  for (const ex of [hx - 18, hx + 18]) {
    blue += `<circle cx="${ex}" cy="${hy}" r="12" fill="${PAPER}"/><circle cx="${ex}" cy="${hy}" r="5" fill="${BLUE}"/>`;
    blue += carve([[[ex - 11, hy + 19], [ex, hy + 23], [ex + 11, hy + 19]]], 2.2);
    blue += carve([[[ex - 13, hy - 22], [ex, hy - 28], [ex + 13, hy - 22]]], 3);
  }
  blue += carve([[[hx, hy + 6], [hx + 3, hy + 22], [hx - 2, hy + 26]]], 2.4);
  blue += `<path d="M${hx - 9},${hy + 40}H${hx + 9}" stroke="${PAPER}" stroke-width="3.4" stroke-linecap="round"/>`;

  // the quilt pulled up, and her fists clutching it
  const blanket = smooth(BLANKET);
  blue += cutout(blanket);
  blue += `<clipPath id="insomniac-quilt"><path d="${blanket}"/></clipPath><g clip-path="url(#insomniac-quilt)">`;
  let quilt = '';
  for (let k = -300; k < 400; k += 40) quilt += `M${k},440L${k + 160},600M${k + 160},440L${k},600`;
  blue += `<path d="${quilt}" stroke="${PAPER}" stroke-width="2" fill="none"/>`;
  blue += `<path d="M30,462C90,446 200,450 340,470" fill="none" stroke="${PAPER}" stroke-width="10"/><path d="M30,462C90,446 200,450 340,470" fill="none" stroke="${BLUE}" stroke-width="4"/>`;
  blue += `</g>`;
  for (const x of [158, 222]) {
    blue += cutout(smooth(FIST(x)), 6);
    blue += carve([[[x - 16, 420], [x, 418], [x + 14, 424]], [[x - 18, 432], [x - 2, 432], [x + 14, 436]]], 2.2);
  }

  // the night table and the candle on it
  blue += `<path d="M340,402H456V422H340Z" fill="${BLUE}" stroke="${PAPER}" stroke-width="5"/>`;
  blue += `<path d="M352,422V560M444,422V560" stroke="${PAPER}" stroke-width="18"/><path d="M352,422V560M444,422V560" stroke="${BLUE}" stroke-width="10"/>`;
  blue += cutout(`M350,436H446V490H350Z`, 6);
  blue += `<circle cx="398" cy="462" r="5" fill="${PAPER}"/>`;
  const dish = `M${cx - 38},${392}C${cx - 30},${404} ${cx + 30},${404} ${cx + 38},${392}Z`;
  blue += cutout(dish, 6);
  blue += `<path d="M${cx + 38},${394}c18,-4 22,14 6,16" fill="none" stroke="${PAPER}" stroke-width="12"/><path d="M${cx + 38},${394}c18,-4 22,14 6,16" fill="none" stroke="${BLUE}" stroke-width="5"/>`;
  const candle = `M${cx - 13},${394}V${cy + 42}C${cx - 6},${cy + 36} ${cx + 6},${cy + 38} ${cx + 13},${cy + 42}V${394}Z`;
  blue += `<path d="${candle}" fill="${BLUE}" stroke="${PAPER}" stroke-width="4"/>`;
  blue += carve([[[cx + 6, cy + 44], [cx + 8, cy + 58], [cx + 5, cy + 66]]], 3);
  blue += `<path d="M${cx},${cy + 38}V${cy + 30}" stroke="${PAPER}" stroke-width="2.6"/>`;
  const flame = smooth([[cx, cy + 28, 1], [cx - 14, cy + 14], [cx - 14, cy - 6], [cx - 4, cy - 26], [cx, cy - 44, 1], [cx + 8, cy - 22], [cx + 15, cy - 2], [cx + 14, cy + 16]]);
  const core = smooth([[cx, cy + 22, 1], [cx - 6, cy + 12], [cx - 5, cy], [cx, cy - 14, 1], [cx + 6, cy], [cx + 6, cy + 12]]);
  blue += `<path d="${flame}" fill="${PAPER}"/>`;

  let pink = `<path d="${flame}${core}" fill="${PINK}" fill-rule="evenodd"/>`;
  pink += `<mask id="insomniac-flame"><rect width="500" height="700" fill="#fff"/><path d="${flame}" fill="#000" stroke="#000" stroke-width="4"/></mask>`;
  pink += `<path mask="url(#insomniac-flame)" fill="${PINK}" d="${halftone([40, 40, 460, 548], 7, (x, y) => 3.6 * Math.max(0, 1 - Math.hypot(x - cx, y - cy) / 210))}"/>`;
  void polyD;
  return { blue, pink };
}
