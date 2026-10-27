import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGames, mergeSettings, DEFAULT_SETTINGS, villageName, cleanAvatar } from '../server/game.mjs';
import { seeded } from './helpers.mjs';

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

test('a room has a village name and a code', () => {
  const { games, host } = setup();
  const v = games.view(host.code, host.player);
  assert.match(host.code, /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/);
  assert.equal(v.village, villageName(host.code));
  assert.equal(v.phase, 'lobby');
  assert.equal(v.players.length, 1);
  assert.ok(cleanAvatar(v.players[0].avatar));
});

test('the lobby suggests a deck for the table, and won\'t start with too few', () => {
  const { games, host, act } = setup();
  assert.equal(games.view(host.code, host.player).lobby.problem, 'too-few');
  assert.throws(() => act('start'), /too-few/);
  for (let i = 0; i < 6; i++) act('bot');
  const lobby = games.view(host.code, host.player).lobby;
  assert.equal(lobby.problem, null);
  assert.equal(lobby.size, 7);
  assert.equal(lobby.deck.werewolf, 2);
  // A hand-built deck that doesn't fit is refused.
  act('settings', { deck: { werewolf: 1, villager: 2 } });
  assert.equal(games.view(host.code, host.player).lobby.problem, 'deck-size');
  act('settings', { deck: { werewolf: 4, villager: 3 } });
  assert.equal(games.view(host.code, host.player).lobby.problem, 'too-many-wolves');
  act('settings', { deck: null });
  assert.equal(games.view(host.code, host.player).lobby.problem, null);
});

test('only the host changes settings, and a quick game brings its clocks', () => {
  const { games, host, act } = setup();
  const guest = games.join(host.code, { name: 'Anna' });
  assert.throws(() => games.act(host.code, guest.token, 'settings', { night: 20 }), /not-host/);
  act('settings', { mode: 'quick' });
  const s = games.view(host.code).settings;
  assert.equal(s.night, 30);
  assert.equal(s.debate, 120);
  assert.equal(s.captain, false);
  assert.deepEqual(mergeSettings(DEFAULT_SETTINGS, { night: 7, reveal: 'everything', ghosts: 'yes' }), DEFAULT_SETTINGS);
});

test('every stream gets its own view: a card never reaches another page', () => {
  const { games, host, act } = setup();
  const anna = games.join(host.code, { name: 'Anna' });
  for (let i = 0; i < 5; i++) act('bot');
  const seen = { host: [], anna: [], screen: [] };
  games.subscribe(host.code, host.player, (j) => seen.host.push(JSON.parse(j)));
  games.subscribe(host.code, anna.player, (j) => seen.anna.push(JSON.parse(j)));
  games.subscribe(host.code, null, (j) => seen.screen.push(JSON.parse(j)));
  act('start');
  const h = seen.host.at(-1).game, a = seen.anna.at(-1).game, s = seen.screen.at(-1).game;
  assert.equal(h.me.id, host.player);
  assert.equal(a.me.id, anna.player);
  assert.equal(s.me, null);
  // The screen's seats carry no roles.
  assert.ok(s.seats.every((x) => x.role === null));
  // Anna's page doesn't carry the host's role anywhere.
  const annaSeat = a.seats.find((x) => x.id === host.player);
  assert.equal(annaSeat.role, null);
});

test('someone joining mid-game watches, then plays the next one', () => {
  const { games, host, act } = setup();
  for (let i = 0; i < 5; i++) act('bot');
  act('start');
  const late = games.join(host.code, { name: 'Late' });
  const v = games.view(host.code, late.player);
  assert.equal(v.game.me, null);
  assert.equal(v.players.length, 7);
});

test('the host can pause the game and abort it', () => {
  const { clock, games, host, act } = setup();
  for (let i = 0; i < 5; i++) act('bot');
  act('start');
  act('control', { command: 'pause' });
  const phase = games.view(host.code).game.phase;
  clock.run(120_000);
  assert.equal(games.view(host.code).game.phase, phase);
  act('control', { command: 'resume' });
  act('abort');
  assert.equal(games.view(host.code).phase, 'lobby');
});

test('One night refuses a table too big or too small', () => {
  const { games, host, act } = setup();
  act('settings', { mode: 'onenight' });
  act('bot');
  assert.equal(games.view(host.code).lobby.problem, 'too-few');
  for (let i = 0; i < 10; i++) act('bot');
  assert.equal(games.view(host.code).lobby.problem, 'too-many');
});

test('a retried "found a village" or join with the same key gets the same seat, not a second one', () => {
  const clock = fakeClock();
  const games = createGames({ clock, randomInt: seeded(3) });
  const a = games.create({ name: 'Eric', key: 'try-1234-abcd' });
  const b = games.create({ name: 'Eric', key: 'try-1234-abcd' });
  assert.deepEqual(b, a, 'the same village and seat');
  assert.equal(games.size, 1);
  const j1 = games.join(a.code, { name: 'Anna', key: 'join-5678-efgh' });
  const j2 = games.join(a.code, { name: 'Anna', key: 'join-5678-efgh' });
  assert.deepEqual(j2, j1);
  assert.equal(games.view(a.code, a.player).players.length, 2, 'Anna sits once');
  // After a minute a key is forgotten: a new tap is a new request.
  clock.run(61_000);
  const c = games.create({ name: 'Eric', key: 'try-1234-abcd' });
  assert.notEqual(c.code, a.code);
  // A key that isn't one is ignored.
  assert.notEqual(games.create({ name: 'X', key: 'short' }).code, games.create({ name: 'X', key: 'short' }).code);
});

test('the host ends a running game: everyone sees every card and the chronicle, marked ended early', () => {
  const { games, host, act } = setup(5);
  const guest = games.join(host.code, { name: 'Anna' });
  for (let i = 0; i < 5; i++) act('bot');
  assert.throws(() => act('end'), /wrong-phase/, 'nothing to end in the lobby');
  act('start');
  assert.throws(() => games.act(host.code, guest.token, 'end'), /not-host/, 'only the host ends it');
  act('end');
  const v = games.view(host.code, guest.player);
  assert.equal(v.game.phase, 'end');
  assert.deepEqual(v.game.ended, { by: host.player });
  assert.equal(v.game.winner, null);
  assert.equal(v.game.awards, null);
  assert.ok(v.game.seats.every((s) => s.role), 'every card turned over');
  assert.equal(v.game.log.at(-1).type, 'ended');
  assert.equal(games.view(host.code).game.ended.by, host.player, 'the big screen too');
  assert.throws(() => act('end'), /wrong-phase/, 'nothing left to end');
  act('rematch');
  assert.equal(games.view(host.code, host.player).phase, 'lobby', 'play again: the lobby, the tape gone');
});

test('the host ends a One night game too', () => {
  const { games, host, act } = setup(6);
  act('settings', { mode: 'onenight' });
  for (let i = 0; i < 3; i++) act('bot');
  act('start');
  act('end');
  const v = games.view(host.code, host.player);
  assert.equal(v.game.mode, 'onenight');
  assert.equal(v.game.phase, 'end');
  assert.deepEqual(v.game.ended, { by: host.player });
  assert.equal(v.game.winner, null);
  assert.ok(v.game.seats.every((s) => s.role) && v.game.center, 'every card and the middle');
});

test('someone who leaves during a game keeps their name on the ring, and is gone from the next', () => {
  const { games, host, act } = setup(8);
  const guest = games.join(host.code, { name: 'Anna' });
  for (let i = 0; i < 5; i++) act('bot');
  act('start');
  games.act(host.code, guest.token, 'leave');
  const anna = games.view(host.code, host.player).players.find((p) => p.id === guest.player);
  assert.equal(anna?.name, 'Anna');
  assert.equal(anna?.left, true);
  act('end');
  act('rematch');
  assert.ok(!games.view(host.code, host.player).players.some((p) => p.id === guest.player), 'gone from the lobby');
});
