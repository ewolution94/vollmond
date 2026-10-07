// Shared test helpers: a seeded random, the default settings, and a driver for one game's rules.

import { act, advance, createGame, view } from '../server/rules.mjs';

/** mulberry32: the same sequence for the same seed. */
export function seeded(seed = 1) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SETTINGS = Object.freeze({
  mode: 'classic',
  where: 'call',
  night: 45,
  debate: 180,
  reveal: 'role',
  votes: 'open',
  tie: 'none',
  captain: false,
  parity: true,
  firstNight: 'hunt',
  seer: 'role',
  witchSelf: true,
  ghosts: true,
  mystery: false,
});

/**
 * A game with a fixed deal: cards[i] goes to player `p<i>`.
 * @param {string[]} cards
 * @param {Partial<typeof SETTINGS>} [over]
 */
export function table(cards, over = {}, seed = 1, extra = []) {
  const players = cards.map((_, i) => ({ id: `p${i}` }));
  const deck = {};
  for (const c of [...cards, ...extra]) deck[c] = (deck[c] ?? 0) + 1;
  let now = 0;
  const g = createGame({ players, settings: { ...SETTINGS, ...over }, deck, rng: seeded(seed), now, cards, extra });
  const t = {
    g,
    get now() {
      return now;
    },
    /** Whoever holds a role (the first, if several). */
    who: (role) => g.seats.find((s) => s.role === role)?.id,
    all: (role) => g.seats.filter((s) => s.role === role).map((s) => s.id),
    act(id, move) {
      act(g, id, move, now);
    },
    /** Lets the clock run to the phase's deadline (or by ms). */
    wait(ms) {
      now = ms === undefined ? (g.deadline ?? now) : now + ms;
      advance(g, now);
    },
    view: (id = null) => view(g, id),
    /** Everyone taps "ready" and the deal ends. */
    deal() {
      for (const id of g.prompts.keys()) act(g, id, { kind: 'ready' }, now);
      t.wait();
    },
    /**
     * Plays the night's steps until dawn. `picks`: wolf, seer, guard, cupid [a, b], heal, poison, peek.
     * Anyone else answers their decoy with their first option.
     */
    night(picks = {}) {
      for (let guard = 0; guard < 5 && ['dusk', 'night', 'witch'].includes(g.phase); guard++) t.step(picks);
    },
    /** Plays one step of the night (see night()). */
    step(picks = {}) {
      {
        for (const [id, p] of [...g.prompts]) {
          if (g.acts.has(id)) continue;
          if (p.kind === 'wolf') {
            if (picks.wolf) act(g, id, { kind: 'pick', target: picks.wolf }, now);
            if (p.extras?.second && picks.second) act(g, id, { kind: 'second', target: picks.second }, now);
            if (p.extras?.infect && picks.infect) act(g, id, { kind: 'infect', on: true }, now);
            if (p.extras?.white && picks.white) act(g, id, { kind: 'white', target: picks.white }, now);
          } else if (p.kind === 'seer') {
            if (picks.seer) act(g, id, { kind: 'pick', target: picks.seer }, now);
          } else if (p.kind === 'guard') {
            if (picks.guard) act(g, id, { kind: 'pick', target: picks.guard }, now);
          } else if (p.kind === 'cupid') {
            if (picks.cupid) act(g, id, { kind: 'pair', a: picks.cupid[0], b: picks.cupid[1] }, now);
          } else if (p.kind === 'witch') {
            act(g, id, { kind: 'witch', heal: Boolean(picks.heal), poison: picks.poison ?? null }, now);
          } else if (p.kind === 'girl') {
            act(g, id, { kind: 'peek', peek: Boolean(picks.peek) }, now);
          } else if (p.kind === 'thief') {
            if (picks.take !== undefined) act(g, id, { kind: 'take', index: picks.take }, now);
          } else if (p.kind === 'model') {
            if (picks.model) act(g, id, { kind: 'pick', target: picks.model }, now);
          } else if (p.kind === 'fox') {
            if (picks.fox) act(g, id, { kind: 'pick', target: picks.fox }, now);
          } else if (p.kind === 'raven') {
            act(g, id, { kind: 'pick', target: picks.raven ?? null }, now);
          } else if (p.kind === 'piper') {
            if (picks.charm) act(g, id, { kind: 'charm', a: picks.charm[0], b: picks.charm[1] }, now);
          } else if (p.options?.length) {
            act(g, id, { kind: 'pick', target: p.options[0] }, now);
          }
        }
        t.wait();
      }
    },
    /** Everyone votes as told ({ voter: target }); the rest abstain. */
    vote(votes = {}) {
      if (g.phase === 'debate') t.wait();
      for (const id of g.prompts.keys()) act(g, id, { kind: 'pick', target: votes[id] ?? null }, now);
      t.wait();
    },
  };
  return t;
}
