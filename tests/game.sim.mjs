// Simulated games for the rooms: whole games played to a winner by bots on the fake clock, both modes.
// Not in CI (the user, 2026-10-20: "rely on simpler (unit) tests there"); run them with `npm run test:sim`.

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGames, mergeSettings, DEFAULT_SETTINGS, villageName, cleanAvatar } from '../server/game.mjs';
import { seeded } from './helpers.mjs';

// Every outcome comes from the rooms' randomInt: a game that still reached for Math.random fails here.
const realRandom = Math.random;
before(() => {
  Math.random = () => {
    throw new Error('an outcome came from Math.random');
  };
});
after(() => {
  Math.random = realRandom;
});

/** A clock the test moves by hand; timers run in order. */
function fakeClock() {
  let now = 1_000_000;
  let id = 0;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, ms) {
      timers.set(++id, { at: now + ms, fn });
      return id;
    },
    clearTimeout(h) {
      timers.delete(h);
    },
    /** Runs the clock forward by ms, firing due timers one at a time. */
    run(ms) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const [k, t] of timers) if (t.at <= end && (!next || t.at < next[1].at)) next = [k, t];
        if (!next) break;
        timers.delete(next[0]);
        now = Math.max(now, next[1].at);
        next[1].fn();
      }
      now = end;
    },
  };
}

function setup(seed = 1) {
  const clock = fakeClock();
  const games = createGames({ clock, randomInt: seeded(seed), botDelay: [500, 1500] });
  const host = games.create({ name: 'Eric' });
  return { clock, games, host, act: (action, body) => games.act(host.code, host.token, action, body) };
}

test('a whole game with bots plays itself to a winner', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { clock, games, host, act } = setup(seed);
    for (let i = 0; i < 8; i++) act('bot');
    act('settings', { debate: 60 });
    act('start');
    let v = games.view(host.code, host.player);
    assert.equal(v.phase, 'game');
    assert.equal(v.game.phase, 'deal');
    assert.ok(v.game.me.role);
    for (let i = 0; i < 400 && games.view(host.code).game?.phase !== 'end'; i++) clock.run(5_000);
    v = games.view(host.code, host.player);
    assert.equal(v.game.phase, 'end', `seed ${seed}`);
    assert.ok(['village', 'wolves', 'lovers', 'none'].includes(v.game.winner.side));
    assert.equal(v.games, 1);
    // A rematch goes back to the lobby with the same people.
    act('rematch');
    assert.equal(games.view(host.code).phase, 'lobby');
    assert.equal(games.view(host.code).players.length, 9);
  }
});

test('a kicked player and someone leaving mid-game are skipped', () => {
  const { clock, games, host, act } = setup();
  const anna = games.join(host.code, { name: 'Anna' });
  for (let i = 0; i < 5; i++) act('bot');
  act('kick', { player: anna.player });
  assert.equal(games.view(host.code).players.length, 6);
  assert.throws(() => games.act(host.code, anna.token, 'avatar', { avatar: { field: 1, charge: 1 } }), /no-player/);
  act('start');
  for (let i = 0; i < 400 && games.view(host.code).game?.phase !== 'end'; i++) clock.run(5_000);
  assert.equal(games.view(host.code).game.phase, 'end');
});

test('whole games with the release-2 roles play themselves to a winner', () => {
  // 13 players and the Thief's two: 15 cards.
  const deck = { werewolf: 1, bigwolf: 1, wolffather: 1, whitewolf: 1, thief: 1, wildchild: 1, fox: 1, bear: 1, raven: 1, knight: 1, scapegoat: 1, judge: 1, piper: 1, angel: 1, seer: 1 };
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const { clock, games, host, act } = setup(seed);
    for (let i = 0; i < 12; i++) act('bot');
    act('settings', { deck, debate: 60 });
    assert.equal(games.view(host.code).lobby.problem, null, `seed ${seed}: ${games.view(host.code).lobby.problem}`);
    act('start');
    for (let i = 0; i < 600 && games.view(host.code).game?.phase !== 'end'; i++) clock.run(5_000);
    const v = games.view(host.code, host.player);
    assert.equal(v.game.phase, 'end', `seed ${seed}`);
    assert.ok(['village', 'wolves', 'lovers', 'piper', 'angel', 'whitewolf', 'none'].includes(v.game.winner.side), v.game.winner.side);
  }
});

test('One night plays itself with bots: a night, a debate, a vote, every card shown', () => {
  for (const seed of [1, 2, 3, 4]) {
    const { clock, games, host, act } = setup(seed);
    for (let i = 0; i < 5; i++) act('bot');
    act('settings', { mode: 'onenight', debate: 60 });
    const lobby = games.view(host.code).lobby;
    assert.equal(lobby.problem, null);
    assert.equal(lobby.cards, 9);
    act('start');
    assert.equal(games.view(host.code, host.player).game.mode, 'onenight');
    for (let i = 0; i < 200 && games.view(host.code).game?.phase !== 'end'; i++) clock.run(5_000);
    const v = games.view(host.code);
    assert.equal(v.game.phase, 'end', `seed ${seed}`);
    assert.ok(v.game.seats.every((s) => s.role));
    assert.equal(v.game.center.now.length, 3);
  }
});
