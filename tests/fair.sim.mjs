// The deal on its real source, node:crypto's randomInt: every order of four cards, and every seat's
// chance of each card in a classic and a One night deal. Stochastic, so local only (npm run test:sim,
// the workspace's CLAUDE.md): a fair source fails these 1-in-a-million bounds once in a million runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { createGame, shuffle } from '../server/rules.mjs';
import { createOneNight } from '../server/onenight.mjs';
import { SETTINGS } from './helpers.mjs';

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
const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));

test('node:crypto: a million shuffles of four cards land on every order evenly', () => {
  const orders = new Map();
  for (let i = 0; i < 1_000_000; i++) {
    const key = shuffle(['a', 'b', 'c', 'd'], (n) => randomInt(n)).join('');
    orders.set(key, (orders.get(key) ?? 0) + 1);
  }
  const c = chi([...orders.values()]);
  console.log(`  orders: chi-square ${c.toFixed(1)} (bound ${bound(23).toFixed(1)})`);
  assert.equal(orders.size, 24);
  assert.ok(c < bound(23));
});

test('node:crypto: in 200,000 classic deals every seat gets each card equally often', () => {
  const deck = { werewolf: 2, seer: 1, witch: 1, hunter: 1, villager: 4 };
  const bySeat = Object.fromEntries(Object.keys(deck).map((role) => [role, new Array(9).fill(0)]));
  for (let i = 0; i < 200_000; i++) {
    const g = createGame({ players: players(9), settings: SETTINGS, deck, now: 0 });
    g.seats.forEach((s, k) => bySeat[s.role][k]++);
  }
  for (const [role, count] of Object.entries(bySeat)) {
    console.log(`  ${role}: chi-square ${chi(count).toFixed(1)} (bound ${bound(8).toFixed(1)})`);
    assert.ok(chi(count) < bound(8), role);
  }
});

test('node:crypto: in 200,000 One night deals every seat and middle card gets each card equally often', () => {
  const deck = { werewolf: 2, seer: 1, robber: 1, troublemaker: 1, drunk: 1, villager: 2 };
  const byPlace = Object.fromEntries(Object.keys(deck).map((role) => [role, new Array(8).fill(0)]));
  for (let i = 0; i < 200_000; i++) {
    const g = createOneNight({ players: players(5), settings: { ...SETTINGS, mode: 'onenight' }, deck, now: 0 });
    [...g.seats.map((s) => s.card), ...g.center].forEach((role, k) => byPlace[role][k]++);
  }
  for (const [role, count] of Object.entries(byPlace)) {
    console.log(`  ${role}: chi-square ${chi(count).toFixed(1)} (bound ${bound(7).toFixed(1)})`);
    assert.ok(chi(count) < bound(7), role);
  }
});
