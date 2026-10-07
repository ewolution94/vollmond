// The woodcut kit: the two inks, the paper, and the cuts every card is made of.
//
// Every card is drawn in one 500 × 700 space (the card's own size), and the art is the woodblock
// inside it, 40..460 × 40..548. The block's file keeps that space and crops to the block with its
// viewBox, so a figure can be placed by the same numbers on every card.
//
// Two plates, printed on paper:
//   blue  the key block: everything carved, BLUE where the wood stays, PAPER where it's cut away
//   pink  the fluorescent second ink, printed over it (multiply) a little off register
// Pink shows only where the blue plate left paper: the moon, a lantern, the carved lines near a glow.

export const PAPER = '#f1e8d4';
export const BLUE = '#1f2668';
export const PINK = '#ff4d9d';
export const BLOCK_BOX = [40, 40, 460, 548];

export const F = (n) => Math.round(n * 10) / 10;

/** mulberry32: the same cuts for the same seed, so a rebuild changes nothing. */
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom through points [x, y, corner?]; a corner point gets sharp tangents. */
export function smooth(pts, closed = true, k = 0.2) {
  const n = pts.length;
  const P = (i) => pts[(i + n) % n];
  let d = `M${F(pts[0][0])},${F(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const s1 = p1[2] || (!closed && i === 0);
    const s2 = p2[2] || (!closed && i === n - 2);
    const c1 = s1 ? p1 : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = s2 ? p2 : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${F(c1[0])},${F(c1[1])} ${F(c2[0])},${F(c2[1])} ${F(p2[0])},${F(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

/** Scales and moves a list of points (a figure drawn in its own 500 × 700 space). */
export const tx = (pts, s, dx, dy) => pts.map(([x, y, c]) => [x * s + dx, y * s + dy, c]);
export const polyD = (p) => 'M' + p.map((v) => `${F(v[0])},${F(v[1])}`).join('L') + 'Z';
export const circleD = (cx, cy, r) => `M${F(cx - r)},${F(cy)}a${F(r)},${F(r)} 0 1 0 ${F(2 * r)},0a${F(r)},${F(r)} 0 1 0 ${F(-2 * r)},0Z`;
export const almond = (cx, cy, w, h) => `M${cx - w},${cy}Q${cx},${cy - h * 2} ${cx + w},${cy}Q${cx},${cy + h * 2} ${cx - w},${cy}Z`;

export function star4(x, y, r) {
  const k = r * 0.28;
  return `M${F(x)},${F(y - r)}L${F(x + k)},${F(y - k)}L${F(x + r)},${F(y)}L${F(x + k)},${F(y + k)}L${F(x)},${F(y + r)}L${F(x - k)},${F(y + k)}L${F(x - r)},${F(y)}L${F(x - k)},${F(y - k)}Z`;
}

/** A heart, its point at the bottom, centred on (x, y), r wide each side. */
export function heart(x, y, r) {
  return `M${F(x)},${F(y + r * 0.9)}C${F(x - r * 1.2)},${F(y + r * 0.1)} ${F(x - r * 1.1)},${F(y - r * 0.9)} ${F(x)},${F(y - r * 0.35)}C${F(x + r * 1.1)},${F(y - r * 0.9)} ${F(x + r * 1.2)},${F(y + r * 0.1)} ${F(x)},${F(y + r * 0.9)}Z`;
}

/**
 * A tapered band around a centre line of [x, y, width] points: an arm, a staff, a braid, a feather.
 * The ends are cut square; `round` rounds them instead.
 */
export function limb(pts, round = false, k = 0.2) {
  const left = [], right = [];
  pts.forEach(([x, y, w], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    const end = !round && (i === 0 || i === pts.length - 1) ? 1 : 0;
    left.push([x + (nx * w) / 2, y + (ny * w) / 2, end]);
    right.push([x - (nx * w) / 2, y - (ny * w) / 2, end]);
  });
  return smooth([...left, ...right.reverse()], true, k);
}

/** Fir trees: [x, base, height, width] each. */
export function firs(list) {
  return list
    .map(([x, base, h, w]) =>
      polyD([
        [x, base - h], [x + w * 0.32, base - h * 0.62], [x + w * 0.16, base - h * 0.62], [x + w * 0.42, base - h * 0.3],
        [x + w * 0.22, base - h * 0.3], [x + w * 0.5, base], [x - w * 0.5, base], [x - w * 0.22, base - h * 0.3],
        [x - w * 0.42, base - h * 0.3], [x - w * 0.16, base - h * 0.62], [x - w * 0.32, base - h * 0.62],
      ]),
    )
    .join('');
}

/**
 * The tools a card's drawing gets, all seeded by that card.
 * @param {number} seed
 */
export function kit(seed) {
  const R = rng(seed);
  return {
    R,
    /** The block's outline: a hand-cut edge that wanders a little. */
    block(x0 = 40, y0 = 40, x1 = 460, y1 = 548, amp = 2.6) {
      const pts = [];
      const edge = (ax, ay, bx, by) => {
        const len = Math.hypot(bx - ax, by - ay), steps = Math.round(len / 18);
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          pts.push([ax + (bx - ax) * t + (R() - 0.5) * amp, ay + (by - ay) * t + (R() - 0.5) * amp]);
        }
      };
      edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
      return polyD(pts);
    },
    /**
     * Carved horizontal lines (a woodcut sky): tapered slivers of paper, one every `step`, each
     * `wfn(y)` thick in the middle.
     */
    lines(y0, y1, step, wfn, x0 = 30, x1 = 470) {
      let d = '';
      for (let y = y0; y < y1; y += step) {
        const w = wfn(y);
        if (w <= 0.2) continue;
        const wob = (R() - 0.5) * 1.6;
        d += `M${x0},${F(y + wob)}C${x0 + 140},${F(y - w / 2 + wob)} ${x1 - 140},${F(y - w / 2 - wob)} ${x1},${F(y - wob)}C${x1 - 140},${F(y + w / 2 - wob)} ${x0 + 140},${F(y + w / 2 + wob)} ${x0},${F(y + wob)}Z`;
      }
      return d;
    },
    /** Rays from a point: tapered slivers out to r1. */
    rays(cx, cy, r0, r1, count, width = 3) {
      let d = '';
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + R() * 0.04;
        const w = width * (0.6 + (i % 2) * 0.8);
        const ca = Math.cos(a), sa = Math.sin(a);
        d += `M${F(cx + ca * r0)},${F(cy + sa * r0)}L${F(cx + ca * r1 - sa * w)},${F(cy + sa * r1 + ca * w)}L${F(cx + ca * r1 + sa * w)},${F(cy + sa * r1 - ca * w)}Z`;
      }
      return d;
    },
    /** Halftone dots in a box, each `rfn(x, y)` big (none below a third of a unit). */
    halftone(box, pitch, rfn) {
      let d = '';
      for (let y = box[1]; y <= box[3]; y += pitch) {
        for (let x = box[0] + ((y / pitch) % 2) * pitch * 0.5; x <= box[2]; x += pitch) {
          const r = rfn(x, y);
          if (r > 0.35) d += circleD(x, y, Math.min(r, pitch * 0.62));
        }
      }
      return d;
    },
    /** Stars cut into the sky, kept clear of the given circles [x, y, r]. */
    stars(n, box, avoid = []) {
      let d = '';
      for (let i = 0; i < n * 3 && n > 0; i++) {
        const x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]);
        if (avoid.some(([ax, ay, ar]) => Math.hypot(x - ax, y - ay) < ar)) continue;
        d += star4(x, y, 4 + R() * 6);
        n--;
      }
      return d;
    },
  };
}

/** A shape cut free of what's behind it: a paper gap around it, then the shape in ink. */
export const cutout = (d, gap = 10, fill = BLUE) =>
  `<path d="${d}" fill="${fill}" stroke="${PAPER}" stroke-width="${gap}" stroke-linejoin="round"/><path d="${d}" fill="${fill}"/>`;

/** Carved lines (open curves through points) inside a shape. */
export const carve = (list, w = 3, color = PAPER) =>
  list.map((l) => `<path d="${smooth(l, false)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`).join('');

/**
 * A finished woodblock file: paper, the blue plate, the pink plate over it, the grain.
 * @param {{ id: string, blue: string, pink: string, block: string, viewBox?: string, frame?: boolean }} art
 */
export function print({ id, blue, pink, block, viewBox = '40 40 420 508' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
<defs>
<clipPath id="${id}-blk"><path d="${block}"/></clipPath>
<filter id="${id}-ink" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.32" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
<filter id="${id}-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.16 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<rect x="0" y="0" width="500" height="700" fill="${PAPER}"/>
<g filter="url(#${id}-ink)"><g clip-path="url(#${id}-blk)">${blue}</g></g>
<g style="mix-blend-mode:multiply" transform="translate(3.5 2.5)" opacity="0.92" filter="url(#${id}-ink)"><g clip-path="url(#${id}-blk)">${pink}</g></g>
<rect x="0" y="0" width="500" height="700" fill="#fff" filter="url(#${id}-paper)"/>
</svg>
`;
}
