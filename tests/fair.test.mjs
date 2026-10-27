// Fair draws: the deal, the ties and every "at random when time runs out" take a whole randomInt(n),
// node:crypto's in production (exactly uniform, by rejection), a seeded one here. The statistics on
// the real source are in fair.sim.mjs (npm run test:sim); learnings/randomness.md in the workspace
// has the why.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, shuffle } from '../server/rules.mjs';
import { createOneNight } from '../server/onenight.mjs';
import { createGames } from '../server/game.mjs';
import { fairInt, seeded, SETTINGS } from './helpers.mjs';

const DECK = { werewolf: 2, seer: 1, witch: 1, hunter: 1, villager: 4 };
const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));

/** The chi-square value df degrees of freedom stay under with probability 1 - 1e-6 (Wilson–Hilferty). */
function bound(df) {
  const z = 4.753;
  return df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3;
}
const chi = (count) => {
  const total = count.reduce((a, b) => a + b, 0);
  const e = total / count.length;
  return count.reduce((s, c) => s + (c - e) ** 2 / e, 0);
};

/** Runs fn with Math.random throwing, so anything that still reaches for it fails the test. */
function withoutMathRandom(fn) {
  const real = Math.random;
  Math.random = () => {
    throw new Error('an outcome came from Math.random');
  };
  try {
    return fn();
  } finally {
    Math.random = real;
  }
}

test('the seeded source owns the same count of words per number and draws again past the limit', () => {
  for (const n of [1, 2, 3, 5, 7, 9, 12, 24]) {
    const limit = Math.floor(2 ** 32 / n) * n;
    assert.equal(limit % n, 0);
    assert.ok(2 ** 32 - limit < n, 'fewer than n words are ever redrawn');
    const seq = (...ws) => () => ws.shift();
    assert.equal(fairInt(n, seq(limit - 1)), (limit - 1) % n, 'the last word kept');
    if (limit < 2 ** 32) assert.equal(fairInt(n, seq(limit, 2 ** 32 - 1, 4)), 4 % n, 'a word past the limit is drawn again');
  }
  assert.throws(() => fairInt(0, () => 0), RangeError);
  assert.throws(() => fairInt(2.5, () => 0), RangeError);
});

test('shuffle is Fisher–Yates on whole numbers: one randomInt per card, from the top down', () => {
  const asked = [];
  const top = (n) => (asked.push(n), n - 1);
  assert.deepEqual(shuffle([0, 1, 2, 3, 4], top), [0, 1, 2, 3, 4], 'the top of every range keeps the order');
  assert.deepEqual(asked, [5, 4, 3, 2]);
  assert.deepEqual(shuffle([0, 1, 2, 3, 4], () => 0), [1, 2, 3, 4, 0], 'the bottom of every range');
  assert.deepEqual(shuffle([], top), []);
});

test('every order of four cards is equally likely (chi-square on a seeded source)', () => {
  const randomInt = seeded(11);
  const orders = new Map();
  const rounds = 48_000;
  for (let i = 0; i < rounds; i++) {
    const key = shuffle(['a', 'b', 'c', 'd'], randomInt).join('');
    orders.set(key, (orders.get(key) ?? 0) + 1);
  }
  assert.equal(orders.size, 24);
  const c = chi([...orders.values()]);
  assert.ok(c < bound(23), `chi-square ${c.toFixed(1)} with 23 degrees of freedom`);
});

test('a deal gives every seat the same chance of each card (chi-square on a seeded source)', () => {
  const randomInt = seeded(5);
  const bySeat = Object.fromEntries(Object.keys(DECK).map((role) => [role, new Array(9).fill(0)]));
  for (let i = 0; i < 18_000; i++) {
    const g = createGame({ players: players(9), settings: SETTINGS, deck: DECK, randomInt, now: 0 });
    g.seats.forEach((s, k) => bySeat[s.role][k]++);
  }
  for (const [role, count] of Object.entries(bySeat)) {
    assert.ok(chi(count) < bound(8), `${role}: chi-square ${chi(count).toFixed(1)} with 8 degrees of freedom`);
  }
});

test('without a source of their own, the rules and the rooms deal from node:crypto, never Math.random', () => {
  withoutMathRandom(() => {
    const g = createGame({ players: players(9), settings: SETTINGS, deck: DECK, now: 0 });
    const dealt = {};
    for (const s of g.seats) dealt[s.role] = (dealt[s.role] ?? 0) + 1;
    assert.deepEqual(dealt, DECK);

    const deck = { werewolf: 2, seer: 1, robber: 1, troublemaker: 1, drunk: 1, villager: 2 };
    const n = createOneNight({ players: players(5), settings: { ...SETTINGS, mode: 'onenight' }, deck, now: 0 });
    assert.equal(n.center.length, 3);
    assert.deepEqual([...n.seats.map((s) => s.card), ...n.center].sort(), Object.entries(deck).flatMap(([r, k]) => Array(k).fill(r)).sort());

    // The rooms: a village with bots, started; the bots' first moves are scheduled from the same source.
    const clock = { now: () => 0, setTimeout: () => 0, clearTimeout() {} };
    const games = createGames({ clock });
    const host = games.create({ name: 'Eric' });
    for (let i = 0; i < 6; i++) games.act(host.code, host.token, 'bot');
    games.act(host.code, host.token, 'start');
    assert.ok(games.view(host.code, host.player).game.me.role);
  });
});
