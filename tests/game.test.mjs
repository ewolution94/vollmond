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
  const games = createGames({ clock, rng: seeded(seed), botDelay: [500, 1500] });
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
