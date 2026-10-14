// Vollmond QA: a host and a guest, bots for the rest of the village, walked through every screen a game
// reaches: home (Settings, the arms), the join page, the lobby (the link, the QR code, the deck), the
// deal, every night step and day phase the two seats are asked about (a pick chosen, then confirmed),
// the moments (night, dawn, the verdict) once they've settled, the end with its chronicle open, and the
// big screen beside them. Each shot checks for anything past the right edge and console errors;
// AUDIT=1 also checks that every label, and every stack of lines, sits in the middle of its box
// (tools/text-audit.mjs, development/plans/text-centering.md). Not part of CI: Playwright is borrowed
// from Folio's checkout next door (the workspace's `folio/node_modules`, WebKit already installed).
//
//   npm run build && node server/server.mjs --port 6011     (or the vollmond-prod preview)
//   node tools/qa.mjs [base] [outdir]      W=390 H=844 LANG_UI=en THEME=dark WHERE=call by default
//   MODES=classic,onenight …               the modes played, one game each (classic, quick, onenight)
//   SCREEN=1920x1080 …                     the big screen's size (1280x720 by default)
//   ENGINE=chromium …                      Chromium instead of WebKit; it lays text out at whole CSS
//                                          pixels under an emulated scale, so its audit wobbles by up to
//                                          1 px (the list that counts is WebKit's, the iPhone's engine)
//   AUDIT=1 node tools/qa.mjs …            plus the text audits at every shot
import { mkdirSync } from 'node:fs';
import { digitAudit, stackAudit, textAudit } from './text-audit.mjs';

const { webkit, chromium } = await import(process.env.PLAYWRIGHT ?? new URL('../../folio/node_modules/playwright/index.mjs', import.meta.url).href);

const BASE = process.argv[2] ?? 'http://localhost:6011';
const OUT = process.argv[3] ?? '/tmp/vollmond-qa/';
const W = Number(process.env.W ?? 390), H = Number(process.env.H ?? 844);
const LANG = process.env.LANG_UI ?? 'en';
const THEME = process.env.THEME ?? 'dark';
const WHERE = process.env.WHERE ?? 'call';
const MODES = (process.env.MODES ?? 'classic,onenight').split(',');
const [SW, SH] = (process.env.SCREEN ?? '1280x720').split('x').map(Number);
/** Text off its box's middle by this many px or more, at every shot (tools/text-audit.mjs). */
const AUDIT = process.env.AUDIT ? Number(process.env.AUDIT) : 0;
// Not centred on purpose:
// - a card's face is a print: its name stands under the drawn block, and its side band is set in the
//   card's own units, 2.4 px in the lobby's fan (tools/cards, Card.svelte);
// - a seat on the ring is a figure, the arms with their marks pinned on (the crown above, a heart on a
//   corner) over the name; the button draws no box of its own (Village.svelte);
// - an award is a card read from the top: its badge in line with its neighbours', then the winner's row,
//   which ends in their arms (First to fall has no count line under it: 1.8 px high by its text, 2 px
//   low by its ink; Ending.svelte).
const AUDIT_SKIP = ['.face', '.face *', 'button.seat', '.awards li'];
const offCentre = new Map();
const offStack = new Map();
const oldDigits = new Map();
mkdirSync(OUT, { recursive: true });

const problems = [];
const say = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await (process.env.ENGINE === 'chromium' ? chromium : webkit).launch();

async function person(name, viewport = { width: W, height: H }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: THEME === 'light' ? 'light' : 'dark' });
  await context.addInitScript(
    ([lang, theme]) => {
      try {
        localStorage.setItem('ewo:lang', lang);
        localStorage.setItem('ewo:theme', theme);
        localStorage.setItem('vollmond:sounds', '0');
        localStorage.setItem('vollmond:voice', '0');
      } catch {}
    },
    [LANG, THEME],
  );
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`${name}: console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`${name}: page error: ${e.message}`));
  return { name, context, page, seat: null, last: '', chosen: new Set(), moments: new Set() };
}

let n = 0;
async function shot(p, label, settle = 700) {
  await sleep(settle); // entrances and the stream's next view
  const file = `${OUT}${String(++n).padStart(3, '0')}-${p.name}-${label}.png`;
  await p.page.screenshot({ path: file, fullPage: true });
  const wide = await p.page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    // The home hand clips at the screen's edges, and the night's fog drifts in a sky twice as wide.
    return [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > w + 0.5 && !e.closest('.hero, .sky, svg'))
      .slice(0, 4)
      .map((e) => e.tagName.toLowerCase() + '.' + [...e.classList].join('.'));
  });
  if (wide.length) problems.push(`${p.name} ${label}: past the right edge: ${wide.join(', ')}`);
  if (AUDIT) {
    for (const row of await p.page.evaluate(textAudit, { min: AUDIT, skip: AUDIT_SKIP })) {
      const key = `${row.where} | ${row.text.replace(/\d+/g, '#')}`;
      if (!offCentre.has(key)) offCentre.set(key, { ...row, at: `${p.name} ${label}` });
    }
    for (const row of await p.page.evaluate(stackAudit, { min: AUDIT, skip: AUDIT_SKIP })) {
      const key = `${row.where} | ${row.text.replace(/\d+/g, '#')}`;
      if (!offStack.has(key)) offStack.set(key, { ...row, at: `${p.name} ${label}` });
    }
    for (const row of await p.page.evaluate(digitAudit)) {
      const key = `${row.where} | ${row.text.replace(/\d+/g, '#')}`;
      if (!oldDigits.has(key)) oldDigits.set(key, { ...row, at: `${p.name} ${label}` });
    }
  }
  say(`  shot ${file.slice(OUT.length)}`);
}

let code = '';
/** A move with the seat's token, as the page sends it. */
async function act(p, action, body = {}) {
  const res = await fetch(`${BASE}/api/rooms/${code}/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vollmond-token': p.seat.token },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${p.name} ${action}: ${res.status} ${await res.text()}`);
}

/** One view of the village as the server sends it to `p` (the first event of a fresh stream). */
async function view(p) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    const res = await fetch(`${BASE}/api/rooms/${code}/events${p?.seat ? `?p=${p.seat.player}` : ''}`, { signal: abort.signal });
    const reader = res.body.getReader();
    let text = '';
    for (;;) {
      const { value } = await reader.read();
      text += new TextDecoder().decode(value);
      const m = text.match(/^data: (.*)\n\n/m);
      if (m) return JSON.parse(m[1]);
    }
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}

const seatOf = (p) => p.page.evaluate((c) => JSON.parse(localStorage.getItem(`vollmond:seat:${c}`) ?? 'null'), code);

/** A moment over the page (night falls, dawn, the verdict): shot once it has settled, then tapped away. */
async function moment(p, key) {
  const m = p.page.locator('.moment');
  if (!(await m.count()) || p.moments.has(key)) return;
  p.moments.add(key);
  await sleep(1200);
  await shot(p, `moment-${key.split(':')[0]}`);
  await m.first().click({ force: true, timeout: 2000 }).catch(() => {});
  await sleep(400);
}

/** Whatever `p` is asked right now, answered through the page like a person. */
async function answer(p, kind) {
  const A = p.page.locator('.action');
  const tap = async (sel) => {
    const l = A.locator(sel);
    if (!(await l.count())) return false;
    await l.first().click({ timeout: 3000 }).catch(() => {});
    return true;
  };
  if (kind === 'ready' || kind === 'hurry') return tap('.btn.block');
  if (kind === 'girl') return tap('.pair .btn.secondary');
  if (kind === 'thief') await tap('.spare-card');
  else if (kind === 'lone' || kind === 'drink') await tap('.pile');
  else if (kind !== 'witch') {
    const names = A.locator('ul.names:not(.small) button.name:not([disabled])');
    const count = await names.count();
    const others = [];
    for (let i = 0; i < count; i++) if (!(await names.nth(i).locator('.you').count())) others.push(i);
    const need = ['cupid', 'piper', 'swap'].includes(kind) ? 2 : 1;
    const order = [...others, ...[...Array(count).keys()].filter((i) => !others.includes(i))];
    for (const i of order.slice(0, need)) await names.nth(i).click({ timeout: 3000 }).catch(() => {});
  }
  // A final pick waits for its confirm: shot chosen, then confirmed.
  const confirm = p.page.locator('.action > .btn.primary.block:not([disabled])');
  if (await confirm.count()) {
    if (!p.chosen.has(kind)) {
      p.chosen.add(kind);
      await shot(p, `${kind}-chosen`, 300);
    }
    await confirm.first().click({ timeout: 3000 }).catch(() => {});
  }
}

/** One look at `p`'s seat: a shot when something new is asked or done, then the answer. */
async function step(p) {
  const v = await view(p);
  const g = v.game;
  if (!g || g.phase === 'end') return g?.phase;
  await moment(p, `${g.phase}:${g.night}:${g.day}`);
  const me = g.me;
  const prompt = me?.prompt ?? null;
  const kind = prompt?.kind ?? null;
  const key = `${g.phase}:${g.night}:${g.day}:${kind}:${Boolean(me?.act)}:${me?.hurried}:${me?.alive}`;
  if (p.last !== key) {
    p.last = key;
    await shot(p, `${g.phase}${kind ? `-${kind}` : ''}${me?.act || me?.hurried ? '-done' : ''}${me && !me.alive ? '-dead' : ''}`);
  }
  // A wolf whispers once, so the pack's chat and its field are shot too.
  if (g.phase === 'night' && !p.whispered && (await p.page.locator('.say input').count())) {
    p.whispered = true;
    await p.page.locator('.say input').fill('Der Schmied?');
    await shot(p, 'whisper-typed', 200);
    await p.page.locator('.say button').click().catch(() => {});
    await shot(p, 'whispered');
  }
  if (!prompt || (me.act && kind !== 'hurry') || (kind === 'hurry' && me.hurried)) return g.phase;
  await answer(p, kind);
  return g.phase;
}

async function game(mode) {
  say(`${mode}: found a village`);
  const host = await person(`host-${mode}`);
  await host.page.goto(BASE, { waitUntil: 'load' });
  await host.page.locator('form.you input').fill('Eva');
  await host.page.locator('form.you .btn.primary').click();
  await host.page.waitForURL(/\/[A-Z]{4}$/);
  code = new URL(host.page.url()).pathname.slice(1);
  host.seat = await seatOf(host);
  say(`  village ${code}`);

  const guest = await person(`guest-${mode}`);
  await guest.page.goto(`${BASE}/${code}`, { waitUntil: 'load' });
  await guest.page.waitForSelector('form.you input');
  await shot(guest, 'join');
  await guest.page.locator('form.you input').fill('Ben');
  await guest.page.locator('form.you .btn.primary').click();
  await guest.page.waitForFunction((c) => localStorage.getItem(`vollmond:seat:${c}`), code);
  guest.seat = await seatOf(guest);

  await act(host, 'settings', { mode, where: WHERE, night: 20, debate: 60 });
  for (let i = 0; i < (mode === 'onenight' ? 4 : 7); i++) await act(host, 'bot');
  await shot(host, 'lobby');
  await shot(guest, 'lobby');
  const qr = host.page.locator('button[aria-expanded]', { hasText: 'QR' });
  if (await qr.count()) {
    await qr.click();
    await shot(host, 'lobby-qr');
    await qr.click();
  }
  await host.page.locator('button.own').click();
  await shot(host, 'arms');
  await host.page.keyboard.press('Escape');
  await sleep(500);

  const screen = await person(`screen-${mode}`, { width: SW, height: SH });
  await screen.page.goto(`${BASE}/${code}/screen`, { waitUntil: 'load' });
  await shot(screen, 'lobby');

  await host.page.locator('.btn.primary.big').click();
  let settings = false;
  let screenAt = '';
  const end = Date.now() + 8 * 60_000;
  while (Date.now() < end) {
    const phase = await step(host);
    if (phase === 'end') break;
    await step(guest);
    const v = await view(null);
    const at = `${v.game?.phase}:${v.game?.night}:${v.game?.day}`;
    if (at !== screenAt) {
      screenAt = at;
      await shot(screen, v.game?.phase ?? 'lobby', 1500);
    }
    // The settings sheet in a game: ending it, leaving it.
    if (!settings && phase === 'night') {
      settings = true;
      await host.page.locator('ewo-settings-button').click();
      await shot(host, 'settings');
      await host.page.keyboard.press('Escape');
      await sleep(500);
    }
    // The host moves the talking phases on, as the skip button does.
    if (['deal', 'dawn', 'verdict', 'debate'].includes(phase)) await act(host, 'control', { command: 'next' }).catch(() => {});
    await sleep(300);
  }
  if ((await view(host)).game?.phase !== 'end') {
    problems.push(`${mode}: no winner after eight minutes; ended early`);
    await act(host, 'end');
  }
  say(`  the end`);
  await shot(host, 'end', 2500);
  await shot(guest, 'end');
  await shot(screen, 'end');
  const chronicle = host.page.locator('details.chronicle summary');
  if (await chronicle.count()) {
    await chronicle.click();
    await shot(host, 'chronicle');
  }
  for (const p of [host, guest, screen]) await p.context.close();
}

try {
  // The screens no game passes through: home, Settings, the arms.
  const p = await person('home');
  await p.page.goto(BASE, { waitUntil: 'load' });
  await shot(p, 'home', 1500);
  await p.page.locator('ewo-settings-button').click();
  await shot(p, 'settings');
  await p.page.keyboard.press('Escape');
  await sleep(500);
  await p.page.locator('form.you button.arms').click();
  await shot(p, 'arms');
  await p.context.close();
  for (const mode of MODES) await game(mode);
} catch (error) {
  problems.push(`stopped: ${error.stack ?? error.message}`);
}
await browser.close();

if (offCentre.size)
  problems.push(
    `text off the middle of its box in ${offCentre.size} places (px, + low, − high; bias: the font's own share):\n  ${[...offCentre.values()]
      .sort((a, b) => Math.abs(b.off) - Math.abs(a.off))
      .map((r) => `${r.off > 0 ? '+' : ''}${r.off} (bias ${r.bias}) ${r.where} "${r.text}" ${r.font} h${r.height} @${r.at}`)
      .join('\n  ')}`,
  );
if (offStack.size)
  problems.push(
    `stacked lines off the middle of their box in ${offStack.size} places (px, + low, − high):\n  ${[...offStack.values()]
      .sort((a, b) => Math.abs(b.off) - Math.abs(a.off))
      .map((r) => `${r.off > 0 ? '+' : ''}${r.off} ${r.where} "${r.text}" ${r.lines} lines h${r.height} @${r.at}`)
      .join('\n  ')}`,
  );
if (oldDigits.size)
  problems.push(`old-style digits (a font: shorthand drops lining-nums) in ${oldDigits.size} places:\n  ${[...oldDigits.values()].map((r) => `${r.where} "${r.text}" ${r.font} [${r.numeric}] @${r.at}`).join('\n  ')}`);
say(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
process.exit(problems.length ? 1 : 0);
