// The rules of one game, from the deal to the winner. No I/O and no clock of its own: the room
// (server/game.mjs) passes `now` in, calls advance() when a deadline passes, and streams view() to
// each player. Tests drive it with a seeded random and a fake clock.
//
// Phases:
//   deal                  everyone looks at their card
//   dusk → night → witch  the night's steps (dusk only on the first night, witch only with a Witch
//                         in the deck); everyone acts at once inside a step, villagers without a
//                         power name a suspect, so no phone gives a role away
//   dawn                  the night's dead are announced
//   hunter, successor     interruptions after deaths: the Hunter shoots, a dead Captain names the next
//   election              day one, with the Captain on: the village elects one
//   debate → vote         talk, then vote someone out (runoff on a tie, if set)
//   verdict               the vote's outcome
//   end                   a side has won; every card is shown, with the chronicle
//
// A step ends when everyone it waits for has acted (and the pack agrees on a victim), or when its
// time runs out. A dead role's step still runs: the narrator calls it, nobody answers.

import { ROLES, deckList } from './roles.mjs';

export class RuleError extends Error {
  /** @param {string} code  @param {number} [status] */
  constructor(code, status = 409) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** Seconds per phase that don't come from the settings. */
export const FIXED = { deal: 30, dawn: 10, verdict: 10, hunter: 30, successor: 25, election: 60, vote: 60, runoff: 40 };
/** Once everyone has acted, the step ends this much later, so the last tap doesn't snap the screen away. */
export const GRACE = 1200;
/** How often the Little Girl is seen when she peeks. */
export const SPOT_CHANCE = 1 / 3;
const CHAT_MAX = 50;
const CHAT_LENGTH = 120;

const NIGHT = new Set(['dusk', 'night', 'witch']);
const VOTES = new Set(['election', 'vote', 'runoff']);
/** Phases in which the pack sees each other's picks and may whisper. */
const HUNT = new Set(['night']);

/**
 * @typedef {{ id: string, role: string, side: string, alive: boolean, lover: string | null,
 *   lives: number, voter: boolean, idiot: boolean, died: { cause: string, night: number, day: number } | null }} Seat
 */

/**
 * Deals and opens the game. `cards` fixes the deal in seat order (tests only).
 * @param {{ players: { id: string }[], settings: Record<string, any>, deck: Record<string, number>,
 *   rng?: () => number, now: number, cards?: string[] }} options
 */
export function createGame({ players, settings, deck, rng = Math.random, now, cards: fixed }) {
  const cards = fixed ? [...fixed] : shuffle(deckList(deck), rng);
  if (cards.length !== players.length) throw new RuleError('deck-size', 400);
  const g = {
    settings: { ...settings },
    deck: { ...deck },
    /** @type {Seat[]} */
    seats: players.map((p, i) => ({
      id: p.id,
      role: cards[i],
      side: ROLES[cards[i]].side,
      alive: true,
      lover: null,
      lives: cards[i] === 'elder' ? 2 : 1,
      voter: true,
      idiot: false,
      died: null,
    })),
    phase: 'deal',
    night: 0,
    day: 0,
    /** When the phase ends: its full time (`until`), or sooner once everyone has acted. */
    deadline: /** @type {number | null} */ (null),
    until: /** @type {number | null} */ (null),
    paused: /** @type {number | null} */ (null),
    /** @type {Map<string, Record<string, any>>} what each player is asked to do in this phase */
    prompts: new Map(),
    /** @type {Map<string, Record<string, any>>} what they did */
    acts: new Map(),
    hurry: new Set(),
    /** @type {string[]} tonight's steps still to come */
    queue: [],
    tonight: /** @type {Record<string, any> | null} */ (null),
    captain: /** @type {string | null} */ (null),
    potions: { heal: true, poison: true },
    guardLast: /** @type {string | null} */ (null),
    /** @type {Map<string, Record<string, any>[]>} what each player has learned (the Seer's looks, …) */
    knowledge: new Map(),
    /** @type {{ from: string, text: string, at: number, night: number }[]} the pack's whispers */
    chat: [],
    /** @type {{ kind: 'hunter' | 'successor', id: string }[]} interruptions after deaths */
    tasks: [],
    task: /** @type {{ kind: string, id: string } | null} */ (null),
    then: /** @type {'day' | 'night'} */ ('day'),
    powersLost: false,
    morning: /** @type {{ id: string, cause: string }[]} */ ([]),
    verdict: /** @type {Record<string, any> | null} */ (null),
    runoff: /** @type {string[] | null} */ (null),
    /** @type {Record<string, any>[]} the chronicle, shown at the end */
    log: [],
    winner: /** @type {{ side: string, players: string[] } | null} */ (null),
    awards: /** @type {{ id: string, player: string, count?: number }[]} */ ([]),
    /** Players who are offline: a step doesn't wait for them. Kept up to date by the room. */
    away: new Set(),
    rng,
  };
  for (const s of g.seats) if (s.side === 'wolves') learn(g, s.id, { type: 'pack', night: 0 });
  begin(g, 'deal', now);
  return g;
}

// ---- moves ------------------------------------------------------------------------------------

/**
 * A player's move in the current phase. Throws RuleError when it isn't theirs to make.
 * @param {ReturnType<typeof createGame>} g
 * @param {string} id
 * @param {Record<string, any>} move  { kind, target?, a?, b?, heal?, poison?, peek?, text? }
 */
export function act(g, id, move, now) {
  const s = seat(g, id);
  if (!s) throw new RuleError('no-seat', 403);
  if (g.phase === 'end') throw new RuleError('over');
  const kind = move?.kind;

  if (kind === 'chat') return whisper(g, s, move.text, now);

  const prompt = g.prompts.get(id);
  if (!prompt) throw new RuleError('not-your-turn');

  if (g.phase === 'debate') {
    if (kind !== 'hurry') throw new RuleError('move');
    if (move.on === false) g.hurry.delete(id);
    else g.hurry.add(id);
    return settle(g, now);
  }

  // Votes and the pack's pick may change until the phase ends; everything else is final.
  const changeable = prompt.kind === 'wolf' || VOTES.has(g.phase);
  if (g.acts.has(id) && !changeable) throw new RuleError('done');

  switch (prompt.kind) {
    case 'ready':
      if (kind !== 'ready') throw new RuleError('move');
      g.acts.set(id, {});
      break;
    case 'cupid': {
      const { a, b } = move;
      if (kind !== 'pair' || a === b || !prompt.options.includes(a) || !prompt.options.includes(b)) throw new RuleError('target');
      g.acts.set(id, { a, b });
      break;
    }
    case 'girl': {
      if (kind !== 'peek') throw new RuleError('move');
      g.acts.set(id, { peek: Boolean(move.peek) });
      if (move.peek) peek(g, s);
      break;
    }
    case 'witch': {
      if (kind !== 'witch') throw new RuleError('move');
      const heal = Boolean(move.heal) && prompt.heal;
      const poison = move.poison && prompt.poison && prompt.options.includes(move.poison) ? move.poison : null;
      if (move.heal && !prompt.heal) throw new RuleError('no-potion');
      if (move.poison && !poison) throw new RuleError('target');
      g.acts.set(id, { heal, poison });
      break;
    }
    case 'vote':
    case 'captain':
    case 'wolf': {
      if (kind !== 'pick') throw new RuleError('move');
      // A vote may be cast for nobody (abstain); the pack's and the election's need a name.
      if (move.target == null && prompt.kind === 'vote') g.acts.set(id, { target: null });
      else if (!prompt.options.includes(move.target)) throw new RuleError('target');
      else g.acts.set(id, { target: move.target });
      break;
    }
    default: {
      // seer, guard, suspect, trust, guess, shoot, successor: one name
      if (kind !== 'pick') throw new RuleError('move');
      if (!prompt.options.includes(move.target)) throw new RuleError('target');
      g.acts.set(id, { target: move.target });
      if (prompt.kind === 'seer') see(g, s, move.target);
    }
  }
  settle(g, now);
}

/** The host's controls: pause and resume the clock, or move past a phase nobody acts in. */
export function control(g, command, now) {
  if (g.phase === 'end') throw new RuleError('over');
  if (command === 'pause') {
    if (g.paused !== null || g.deadline === null) return;
    g.paused = Math.max(0, g.deadline - now);
    g.until = g.until === null ? null : Math.max(0, g.until - now);
    g.deadline = null;
    return;
  }
  if (command === 'resume') {
    if (g.paused === null) return;
    g.deadline = now + g.paused;
    g.until = g.until === null ? null : now + g.until;
    g.paused = null;
    return;
  }
  if (command === 'next') {
    if (!['debate', 'dawn', 'verdict', 'deal'].includes(g.phase)) throw new RuleError('wrong-phase');
    g.paused = null;
    finish(g, now);
    return;
  }
  throw new RuleError('move');
}

/** Moves the game on when its deadline has passed. Returns true when something changed. */
export function advance(g, now) {
  let changed = false;
  for (let i = 0; i < 20 && g.phase !== 'end' && g.deadline !== null && now >= g.deadline; i++) {
    finish(g, now);
    changed = true;
  }
  return changed;
}

/** Someone went offline or came back: a step no longer waits for an absent player. */
export function setAway(g, id, away, now) {
  if (away) g.away.add(id);
  else g.away.delete(id);
  settle(g, now);
}

// ---- phases -----------------------------------------------------------------------------------

function seconds(g, phase) {
  if (NIGHT.has(phase)) return g.settings.night;
  if (phase === 'debate') return g.settings.debate || null;
  return FIXED[phase];
}

function begin(g, phase, now) {
  g.phase = phase;
  g.prompts = new Map();
  g.acts = new Map();
  g.hurry = new Set();
  const secs = seconds(g, phase);
  g.until = secs ? now + secs * 1000 : null;
  g.deadline = g.until;
  g.paused = null;
  ask(g);
  settle(g, now);
}

/** Who is asked what in the phase that just began. */
function ask(g) {
  const alive = living(g);
  const ids = alive.map((s) => s.id);
  const others = (id) => ids.filter((x) => x !== id);
  const powered = (s, role) => s.role === role && !g.powersLost;
  const P = g.prompts;
  switch (g.phase) {
    case 'deal':
      for (const s of alive) P.set(s.id, { kind: 'ready' });
      break;
    case 'dusk':
      for (const s of alive) P.set(s.id, powered(s, 'cupid') ? { kind: 'cupid', options: ids } : { kind: 'trust', options: others(s.id) });
      break;
    case 'night': {
      const calm = g.night === 1 && g.settings.firstNight === 'calm';
      const prey = alive.filter((s) => s.side !== 'wolves').map((s) => s.id);
      for (const s of alive) {
        if (s.side === 'wolves' && !calm) P.set(s.id, { kind: 'wolf', options: prey });
        else if (powered(s, 'seer')) P.set(s.id, { kind: 'seer', options: others(s.id) });
        else if (powered(s, 'guard')) P.set(s.id, { kind: 'guard', options: ids.filter((x) => x !== g.guardLast) });
        else if (powered(s, 'girl')) P.set(s.id, { kind: 'girl' });
        else P.set(s.id, { kind: 'suspect', options: others(s.id) });
      }
      break;
    }
    case 'witch': {
      const victim = g.tonight?.attacked ?? null;
      for (const s of alive) {
        if (powered(s, 'witch')) {
          P.set(s.id, {
            kind: 'witch',
            victim,
            heal: g.potions.heal && Boolean(victim) && (g.settings.witchSelf || victim !== s.id),
            poison: g.potions.poison,
            options: others(s.id),
          });
        } else P.set(s.id, { kind: 'guess', options: ids });
      }
      break;
    }
    case 'hunter':
      P.set(g.task.id, { kind: 'shoot', options: ids.filter((x) => x !== g.task.id) });
      break;
    case 'successor':
      P.set(g.task.id, { kind: 'successor', options: ids });
      break;
    case 'election':
      for (const s of alive) P.set(s.id, { kind: 'captain', options: ids });
      break;
    case 'debate':
      for (const s of alive) P.set(s.id, { kind: 'hurry' });
      break;
    case 'vote':
      for (const s of alive) if (s.voter) P.set(s.id, { kind: 'vote', options: others(s.id) });
      break;
    case 'runoff':
      for (const s of alive) if (s.voter) P.set(s.id, { kind: 'vote', options: (g.runoff ?? []).filter((x) => x !== s.id) });
      break;
  }
}

/** Everyone the phase waits for has acted. */
function complete(g) {
  if (g.phase === 'debate') return g.hurry.size * 2 > living(g).length;
  if (!g.prompts.size) return false;
  for (const id of g.prompts.keys()) {
    if (!g.away.has(id) && !g.acts.has(id)) return false;
  }
  if (g.phase === 'night') {
    const picks = new Set();
    for (const [id, p] of g.prompts) if (p.kind === 'wolf' && g.acts.get(id)?.target) picks.add(g.acts.get(id).target);
    if (picks.size > 1) return false;
  }
  return true;
}

/** Shortens the deadline once everyone has acted, and restores it if that stops being true. */
function settle(g, now) {
  if (g.paused !== null) return;
  if (complete(g)) g.deadline = g.until === null ? now + GRACE : Math.min(g.until, now + GRACE);
  else g.deadline = g.until;
}

function finish(g, now) {
  switch (g.phase) {
    case 'deal':
      return startNight(g, now);
    case 'dusk':
      resolveDusk(g);
      return nextStep(g, now);
    case 'night':
      resolveNight(g);
      return nextStep(g, now);
    case 'witch':
      resolveWitch(g);
      return nextStep(g, now);
    case 'dawn':
      return runTasks(g, now, 'day');
    case 'hunter':
      resolveShot(g);
      return runTasks(g, now, g.then);
    case 'successor':
      resolveSuccessor(g);
      return runTasks(g, now, g.then);
    case 'election':
      resolveElection(g);
      return begin(g, 'debate', now);
    case 'debate':
      return begin(g, 'vote', now);
    case 'vote':
    case 'runoff':
      return resolveVote(g, now);
    case 'verdict':
      return runTasks(g, now, 'night');
  }
}

function startNight(g, now) {
  g.night++;
  g.tonight = { attacked: null, guarded: null, healed: false, poisoned: null };
  g.chat = g.chat.filter((m) => m.night >= g.night - 1);
  g.queue = [];
  if (g.night === 1 && g.deck.cupid) g.queue.push('dusk');
  g.queue.push('night');
  if (g.deck.witch) g.queue.push('witch');
  begin(g, g.queue.shift(), now);
}

function nextStep(g, now) {
  if (g.queue.length) return begin(g, g.queue.shift(), now);
  // Dawn: the night's attack, unless the Guard stood in front of it, the Witch healed it, or the Elder
  // had a life to spare; and the Witch's poison.
  const t = g.tonight;
  const deaths = [];
  if (t.attacked && t.attacked !== t.guarded && !t.healed) {
    const s = seat(g, t.attacked);
    if (s.role === 'elder' && s.lives > 1 && !g.powersLost) {
      s.lives--;
      g.log.push({ type: 'elder', night: g.night, id: s.id });
    } else deaths.push({ id: t.attacked, cause: 'wolves' });
  }
  if (t.poisoned) deaths.push({ id: t.poisoned, cause: 'poison' });
  g.morning = kill(g, deaths);
  if (!g.morning.length) g.log.push({ type: 'quiet', night: g.night });
  begin(g, 'dawn', now);
}

/** Interruptions first (the Hunter's shot, a new Captain), then the day or the night. */
function runTasks(g, now, then) {
  g.then = then;
  const task = g.tasks.shift();
  if (task) {
    g.task = task;
    return begin(g, task.kind, now);
  }
  g.task = null;
  const won = winner(g);
  if (won) return end(g, won, now);
  if (then === 'day') {
    g.day = g.night;
    g.verdict = null;
    g.runoff = null;
    if (g.day === 1 && g.settings.captain && !g.captain) return begin(g, 'election', now);
    return begin(g, 'debate', now);
  }
  return startNight(g, now);
}

function resolveDusk(g) {
  for (const [id, p] of g.prompts) {
    if (p.kind !== 'cupid') continue;
    let pair = g.acts.get(id);
    // Cupid has to bind someone: when the time runs out, the arrows fly anyway.
    if (!pair) {
      const [a, b] = shuffle(p.options, g.rng);
      pair = { a, b };
    }
    const a = seat(g, pair.a), b = seat(g, pair.b);
    a.lover = b.id;
    b.lover = a.id;
    learn(g, a.id, { type: 'lover', night: g.night, partner: b.id, side: b.side });
    learn(g, b.id, { type: 'lover', night: g.night, partner: a.id, side: a.side });
    learn(g, id, { type: 'bound', night: g.night, a: a.id, b: b.id });
    g.log.push({ type: 'cupid', night: g.night, actor: id, a: a.id, b: b.id });
  }
  logDecoys(g);
}

function resolveNight(g) {
  const t = g.tonight;
  const picks = {};
  for (const [id, p] of g.prompts) {
    const a = g.acts.get(id);
    if (p.kind === 'wolf' && a?.target) picks[id] = a.target;
    if (p.kind === 'guard') {
      t.guarded = a?.target ?? null;
      g.guardLast = t.guarded;
      if (a) g.log.push({ type: 'guard', night: g.night, actor: id, target: a.target });
    }
    if (p.kind === 'girl' && !a?.peek) g.log.push({ type: 'girl', night: g.night, actor: id, peek: false });
  }
  if (Object.keys(picks).length) {
    t.attacked = plurality(Object.values(picks), g.rng);
    g.log.push({ type: 'wolves', night: g.night, target: t.attacked, picks });
  }
  logDecoys(g);
}

function resolveWitch(g) {
  for (const [id, p] of g.prompts) {
    if (p.kind !== 'witch') continue;
    const a = g.acts.get(id);
    if (!a) continue;
    if (a.heal && p.heal) {
      g.tonight.healed = true;
      g.potions.heal = false;
      g.log.push({ type: 'heal', night: g.night, actor: id, target: p.victim });
    }
    if (a.poison && g.potions.poison) {
      g.tonight.poisoned = a.poison;
      g.potions.poison = false;
      g.log.push({ type: 'poison', night: g.night, actor: id, target: a.poison });
    }
  }
  logDecoys(g);
}

function resolveShot(g) {
  const a = g.acts.get(g.task.id);
  g.log.push({ type: 'shot', night: g.night, day: g.day, actor: g.task.id, target: a?.target ?? null });
  if (a?.target) g.morning = [...g.morning, ...kill(g, [{ id: a.target, cause: 'shot' }])];
  if (g.verdict && a?.target) g.verdict.shot = a.target;
}

function resolveSuccessor(g) {
  const options = living(g).map((s) => s.id);
  const pick = g.acts.get(g.task.id)?.target;
  g.captain = pick && seat(g, pick)?.alive ? pick : options.length ? options[Math.floor(g.rng() * options.length)] : null;
  g.log.push({ type: 'captain', night: g.night, day: g.day, id: g.captain, by: g.task.id, chosen: Boolean(pick) });
}

function resolveElection(g) {
  const votes = {};
  for (const [id, a] of g.acts) if (a.target) votes[id] = a.target;
  const targets = Object.values(votes);
  const ids = living(g).map((s) => s.id);
  g.captain = targets.length ? plurality(targets, g.rng) : ids[Math.floor(g.rng() * ids.length)] ?? null;
  g.log.push({ type: 'election', day: g.day, votes, id: g.captain });
}

function resolveVote(g, now) {
  const votes = {};
  const tally = {};
  for (const [id, a] of g.acts) {
    votes[id] = a.target ?? null;
    if (!a.target) continue;
    tally[a.target] = (tally[a.target] ?? 0) + (id === g.captain ? 2 : 1);
  }
  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max && max > 0);
  let out = top.length === 1 ? top[0] : null;
  if (top.length > 1) {
    // The Captain's vote breaks a tie, if it went to one of the tied.
    const cv = g.captain ? votes[g.captain] : null;
    if (cv && top.includes(cv)) out = cv;
    else if (g.settings.tie === 'runoff' && g.phase === 'vote') {
      g.log.push({ type: 'vote', day: g.day, runoff: false, votes, tally, out: null, tie: top });
      g.runoff = top;
      return begin(g, 'runoff', now);
    }
  }
  g.log.push({ type: 'vote', day: g.day, runoff: g.phase === 'runoff', votes, tally, out, tie: out ? null : top.length > 1 ? top : null });
  g.verdict = { out, votes, tally, tie: !out && top.length > 1 ? top : null, idiot: false, shot: null };
  if (out) {
    const s = seat(g, out);
    if (s.role === 'idiot' && !s.idiot && !g.powersLost) {
      // The Village Idiot is spared, shown, and votes no more.
      s.idiot = true;
      s.voter = false;
      g.verdict.idiot = true;
      g.log.push({ type: 'idiot', day: g.day, id: out });
    } else kill(g, [{ id: out, cause: 'vote' }]);
  }
  begin(g, 'verdict', now);
}

function end(g, won, now) {
  g.winner = won;
  g.phase = 'end';
  g.prompts = new Map();
  g.acts = new Map();
  g.deadline = null;
  g.until = null;
  g.paused = null;
  g.awards = awards(g);
  g.log.push({ type: 'end', night: g.night, day: g.day, side: won.side });
  void now;
}

// ---- deaths and wins --------------------------------------------------------------------------

/**
 * Kills, with everything a death sets off: a Lover dies of grief, a Hunter gets a shot, a Captain
 * names a successor, and the Elder killed by the village takes every village power with him.
 * @returns {{ id: string, cause: string }[]} everyone who died, in order
 */
function kill(g, list) {
  const queue = [...list];
  const dead = [];
  while (queue.length) {
    const { id, cause } = queue.shift();
    const s = seat(g, id);
    if (!s || !s.alive) continue;
    s.alive = false;
    s.died = { cause, night: g.night, day: g.day };
    dead.push({ id, cause });
    g.log.push({ type: 'death', night: g.night, day: g.day, id, cause });
    if (s.role === 'elder' && ['vote', 'poison', 'shot'].includes(cause) && !g.powersLost) {
      g.powersLost = true;
      g.log.push({ type: 'powers-lost', night: g.night, day: g.day, id });
    }
    if (s.role === 'hunter' && !g.powersLost) g.tasks.push({ kind: 'hunter', id });
    if (g.captain === id) g.tasks.push({ kind: 'successor', id });
    if (s.lover) {
      const l = seat(g, s.lover);
      if (l?.alive) queue.push({ id: l.id, cause: 'grief' });
    }
  }
  return dead;
}

/** The Lovers, when they're on different sides (then they play for themselves). */
function mixedLovers(g) {
  const a = g.seats.find((s) => s.lover);
  if (!a) return null;
  const b = seat(g, a.lover);
  return a.side !== b.side ? [a.id, b.id] : null;
}

/** Who has won, or null while the game goes on. */
export function winner(g) {
  const alive = living(g);
  if (!alive.length) return { side: 'none', players: [] };
  const couple = mixedLovers(g);
  const coupleAlive = Boolean(couple) && couple.every((id) => seat(g, id).alive);
  if (coupleAlive && alive.length === 2) return { side: 'lovers', players: couple };
  const team = (side) => g.seats.filter((s) => s.side === side && !(couple ?? []).includes(s.id)).map((s) => s.id);
  const wolves = alive.filter((s) => s.side === 'wolves').length;
  if (!wolves) return { side: 'village', players: team('village') };
  // A wolf in love with a villager no longer hunts for the pack.
  const pack = alive.filter((s) => s.side === 'wolves' && !(coupleAlive && couple.includes(s.id))).length;
  const rest = alive.length - pack;
  if (pack > 0 && (g.settings.parity ? pack >= rest : rest === 0)) return { side: 'wolves', players: team('wolves') };
  return null;
}

function awards(g) {
  const out = [];
  const deaths = g.log.filter((e) => e.type === 'death');
  if (deaths.length) out.push({ id: 'first', player: deaths[0].id });
  const wolf = (id) => seat(g, id)?.side === 'wolves';
  const count = (entries, key) => {
    const m = new Map();
    for (const e of entries) m.set(e[key], (m.get(e[key]) ?? 0) + 1);
    return m;
  };
  const best = (m, eligible) => {
    let top = null;
    for (const [id, n] of m) if (eligible(id) && (!top || n > top[1])) top = [id, n];
    return top;
  };
  // Sharpest hunch: night suspicions that named a wolf.
  const hunches = g.log.filter((e) => e.type === 'suspect' && wolf(e.target));
  const sharp = best(count(hunches, 'actor'), (id) => !wolf(id));
  if (sharp) out.push({ id: 'sharp', player: sharp[0], count: sharp[1] });
  // On target: day votes against wolves.
  const ballots = g.log.filter((e) => e.type === 'vote').flatMap((e) => Object.entries(e.votes).map(([actor, target]) => ({ actor, target })));
  const aimed = best(count(ballots.filter((b) => b.target && wolf(b.target)), 'actor'), (id) => !wolf(id));
  if (aimed) out.push({ id: 'aim', player: aimed[0], count: aimed[1] });
  // Best bluff: the wolf the village voted for least, among those who saw at least one vote.
  const against = count(ballots.filter((b) => b.target), 'target');
  let bluff = null;
  for (const s of g.seats) {
    if (s.side !== 'wolves') continue;
    const lasted = s.died ? s.died.day : g.day;
    if (lasted < 1) continue;
    const n = against.get(s.id) ?? 0;
    if (!bluff || n < bluff[1] || (n === bluff[1] && s.alive)) bluff = [s.id, n];
  }
  if (bluff) out.push({ id: 'bluff', player: bluff[0], count: bluff[1] });
  return out;
}

// ---- the night's powers ----------------------------------------------------------------------

function see(g, seer, target) {
  const t = seat(g, target);
  const entry = { type: 'seen', night: g.night, target, side: t.side };
  if (g.settings.seer !== 'side') entry.role = t.role;
  learn(g, seer.id, entry);
  g.log.push({ type: 'seer', night: g.night, actor: seer.id, target, role: t.role });
}

function peek(g, girl) {
  const wolves = living(g).filter((s) => s.side === 'wolves');
  const glimpse = wolves.length ? wolves[Math.floor(g.rng() * wolves.length)].id : null;
  const caught = g.rng() < SPOT_CHANCE;
  learn(g, girl.id, { type: 'glimpse', night: g.night, wolf: glimpse, caught });
  if (caught) for (const w of wolves) learn(g, w.id, { type: 'spotted', night: g.night, girl: girl.id });
  g.log.push({ type: 'girl', night: g.night, actor: girl.id, peek: true, wolf: glimpse, caught });
}

function whisper(g, s, raw, now) {
  if (s.side !== 'wolves' || !s.alive || !HUNT.has(g.phase)) throw new RuleError('not-your-turn');
  const text = typeof raw === 'string' ? raw.replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim().slice(0, CHAT_LENGTH) : '';
  if (!text) throw new RuleError('text', 400);
  g.chat.push({ from: s.id, text, at: now, night: g.night });
  if (g.chat.length > CHAT_MAX) g.chat.splice(0, g.chat.length - CHAT_MAX);
}

/** The decoy answers, kept for the end's awards (a villager's hunch that named a wolf). */
function logDecoys(g) {
  for (const [id, p] of g.prompts) {
    const a = g.acts.get(id);
    if (!a?.target) continue;
    if (p.kind === 'suspect' || p.kind === 'trust' || p.kind === 'guess') g.log.push({ type: p.kind, night: g.night, actor: id, target: a.target });
  }
}

// ---- views ------------------------------------------------------------------------------------

/**
 * What one player may see. Without an id: the big screen, which never sees a secret before the end.
 * The dead see everything when the room allows it (settings.ghosts).
 * @param {ReturnType<typeof createGame>} g
 * @param {string | null} viewer
 */
export function view(g, viewer) {
  const me = viewer ? seat(g, viewer) : null;
  const ended = g.phase === 'end';
  const ghost = Boolean(me && !me.alive && g.settings.ghosts);
  const all = ended || ghost;
  const night = NIGHT.has(g.phase);
  const voting = VOTES.has(g.phase);
  const openVotes = g.settings.votes === 'open' || g.phase === 'election';
  const reveal = g.settings.reveal;
  const shown = (s) => all || (!s.alive && reveal === 'role') || s.idiot;
  const sideShown = (s) => shown(s) || (!s.alive && reveal === 'side');
  const cause = (c) => (all ? c : c === 'wolves' || c === 'poison' ? 'night' : c);
  const dead = (list) => list.map((d) => ({ id: d.id, cause: cause(d.cause), role: shown(seat(g, d.id)) ? seat(g, d.id).role : null, side: sideShown(seat(g, d.id)) ? seat(g, d.id).side : null }));

  let done = 0;
  for (const id of g.prompts.keys()) if (g.acts.has(id) || (g.phase === 'debate' && g.hurry.has(id))) done++;

  const out = {
    phase: g.phase,
    night: g.night,
    day: g.day,
    deadline: g.deadline,
    paused: g.paused,
    captain: g.captain,
    deck: g.settings.mystery && !ended ? null : g.deck,
    powersLost: g.powersLost,
    seats: g.seats.map((s) => ({
      id: s.id,
      alive: s.alive,
      role: shown(s) ? s.role : null,
      side: sideShown(s) ? s.side : null,
      idiot: s.idiot,
      voter: s.voter,
      died: s.died ? { cause: cause(s.died.cause), night: s.died.night, day: s.died.day } : null,
      // By day everyone sees who has voted; at night only how many are done.
      acted: voting ? g.acts.has(s.id) : g.phase === 'debate' ? g.hurry.has(s.id) : null,
      lover: all ? s.lover : null,
    })),
    progress: g.prompts.size ? { done, total: g.prompts.size } : null,
    votes: voting && (openVotes || all) ? Object.fromEntries([...g.acts].map(([id, a]) => [id, a.target ?? null])) : null,
    runoff: g.phase === 'runoff' ? g.runoff : null,
    morning: g.phase === 'dawn' || g.phase === 'hunter' || g.phase === 'successor' || g.phase === 'election' || g.phase === 'debate' ? dead(g.morning) : [],
    verdict: g.verdict && ['verdict', 'hunter', 'successor'].includes(g.phase)
      ? { ...g.verdict, role: g.verdict.out && shown(seat(g, g.verdict.out)) ? seat(g, g.verdict.out).role : null }
      : null,
    task: g.task && (g.phase === 'hunter' || g.phase === 'successor') ? { kind: g.task.kind, id: g.task.id } : null,
    winner: g.winner,
    awards: ended ? g.awards : null,
    log: ended ? g.log : null,
    me: null,
    ghost: null,
  };

  if (me) {
    const wolf = me.side === 'wolves';
    out.me = {
      id: me.id,
      role: me.role,
      side: me.side,
      alive: me.alive,
      voter: me.voter,
      lover: me.lover,
      prompt: g.prompts.get(me.id) ?? null,
      act: g.acts.get(me.id) ?? null,
      hurried: g.hurry.has(me.id),
      knowledge: g.knowledge.get(me.id) ?? [],
      pack: wolf
        ? g.seats.filter((s) => s.side === 'wolves').map((s) => ({ id: s.id, alive: s.alive, pick: g.phase === 'night' ? g.acts.get(s.id)?.target ?? null : null }))
        : null,
      chat: wolf || ghost ? g.chat.filter((m) => m.night === g.night || ended) : null,
      potions: me.role === 'witch' ? { ...g.potions } : null,
      guarded: me.role === 'guard' ? g.guardLast : null,
    };
  }
  if (ghost) {
    out.ghost = {
      acts: Object.fromEntries([...g.acts].map(([id, a]) => [id, { kind: g.prompts.get(id)?.kind, ...a }])),
      tonight: night || g.phase === 'dawn' ? g.tonight : null,
    };
  }
  return out;
}

// ---- helpers ----------------------------------------------------------------------------------

export const living = (g) => g.seats.filter((s) => s.alive);
export const seat = (g, id) => g.seats.find((s) => s.id === id);

function learn(g, id, entry) {
  const list = g.knowledge.get(id) ?? [];
  list.push(entry);
  g.knowledge.set(id, list);
}

/** The most named, a tie broken at random. */
function plurality(list, rng) {
  const counts = new Map();
  for (const x of list) counts.set(x, (counts.get(x) ?? 0) + 1);
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, n]) => n === max).map(([x]) => x);
  return top[Math.floor(rng() * top.length)];
}

export function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
