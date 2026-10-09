// One night: the ten-minute variant. Every player gets a card and three more lie in the middle. There is
// one night, in which everyone acts at once and the server resolves it in the classic order (the
// wolves see each other and a lone wolf looks at a middle card, the minion sees the wolves, the masons
// see each other, the seer looks, the robber swaps and looks, the troublemaker swaps two others, the
// drunk swaps with the middle unseen, the insomniac looks at their own card last). Then one debate,
// one simultaneous vote, and every card is turned over: who you are at the end is what counts.
//
// The same shape as server/rules.mjs (act, control, advance, setAway, view), so the room drives both.
//
// Wins, by the cards as they end up:
//   village  a werewolf dies; or no werewolf ended with a player and nobody dies
//   wolves   (werewolves and minion) no werewolf dies and the tanner doesn't die, with a werewolf in
//            play; the minion alone wins when no werewolf is in play and someone else dies
//   tanner   the tanner dies (the wolves can't win then)
// A player dies with the most votes, two or more; a tie kills all of them. The hunter takes whoever
// they voted for along.

import { ROLES, deckList, ONE_NIGHT } from './roles.mjs';
import { RuleError, shuffle } from './rules.mjs';

const FIXED = { deal: 30, vote: 60 };
const GRACE = 1200;
const VILLAGE = new Set(['villager', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac', 'mason', 'hunter']);

/**
 * @param {{ players: { id: string }[], settings: Record<string, any>, deck: Record<string, number>,
 *   rng?: () => number, now: number, cards?: string[], center?: string[] }} options
 */
export function createOneNight({ players, settings, deck, rng = Math.random, now, cards: fixed, center: fixedCenter }) {
  const all = fixed ? [...fixed, ...(fixedCenter ?? [])] : shuffle(deckList(deck), rng);
  if (all.length !== players.length + ONE_NIGHT.center) throw new RuleError('deck-size', 400);
  const g = {
    mode: 'onenight',
    settings: { ...settings },
    deck: { ...deck },
    seats: players.map((p, i) => ({ id: p.id, card: all[i], now: all[i] })),
    center: all.slice(players.length),
    /** The middle as dealt, for the reveal. */
    dealt: all.slice(players.length),
    phase: 'deal',
    deadline: /** @type {number | null} */ (null),
    until: /** @type {number | null} */ (null),
    paused: /** @type {number | null} */ (null),
    prompts: new Map(),
    acts: new Map(),
    hurry: new Set(),
    knowledge: new Map(),
    log: [],
    votes: /** @type {Record<string, string | null> | null} */ (null),
    dead: /** @type {string[]} */ ([]),
    winner: /** @type {{ side: string, sides: string[], players: string[] } | null} */ (null),
    away: new Set(),
    rng,
  };
  begin(g, 'deal', now);
  return g;
}

const seat = (g, id) => g.seats.find((s) => s.id === id);
function learn(g, id, entry) {
  const list = g.knowledge.get(id) ?? [];
  list.push(entry);
  g.knowledge.set(id, list);
}

function seconds(g, phase) {
  if (phase === 'night') return g.settings.night * 2;
  if (phase === 'debate') return g.settings.debate || null;
  return FIXED[phase] ?? null;
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

function ask(g) {
  const ids = g.seats.map((s) => s.id);
  const others = (id) => ids.filter((x) => x !== id);
  const wolves = g.seats.filter((s) => s.card === 'werewolf');
  for (const s of g.seats) {
    if (g.phase === 'deal') g.prompts.set(s.id, { kind: 'ready' });
    else if (g.phase === 'debate') g.prompts.set(s.id, { kind: 'hurry' });
    else if (g.phase === 'vote') g.prompts.set(s.id, { kind: 'vote', options: others(s.id) });
    else if (g.phase === 'night') {
      // By the card each was dealt: a swap tonight doesn't change who acts.
      if (s.card === 'werewolf' && wolves.length === 1) g.prompts.set(s.id, { kind: 'lone', center: [0, 1, 2] });
      else if (s.card === 'seer') g.prompts.set(s.id, { kind: 'look', options: others(s.id), center: [0, 1, 2] });
      else if (s.card === 'robber') g.prompts.set(s.id, { kind: 'rob', options: others(s.id) });
      else if (s.card === 'troublemaker') g.prompts.set(s.id, { kind: 'swap', options: others(s.id) });
      else if (s.card === 'drunk') g.prompts.set(s.id, { kind: 'drink', center: [0, 1, 2] });
      else g.prompts.set(s.id, { kind: 'suspect', options: others(s.id) });
    }
  }
}

function complete(g) {
  if (g.phase === 'debate') return g.hurry.size * 2 > g.seats.length;
  if (!g.prompts.size) return false;
  for (const id of g.prompts.keys()) if (!g.away.has(id) && !g.acts.has(id)) return false;
  return true;
}

function settle(g, now) {
  if (g.paused !== null) return;
  if (complete(g)) g.deadline = g.until === null ? now + GRACE : Math.min(g.until, now + GRACE);
  else g.deadline = g.until;
}

export function act(g, id, move, now) {
  const s = seat(g, id);
  if (!s) throw new RuleError('no-seat', 403);
  if (g.phase === 'end') throw new RuleError('over');
  const prompt = g.prompts.get(id);
  if (!prompt) throw new RuleError('not-your-turn');
  const kind = move?.kind;
  if (g.phase === 'debate') {
    if (kind !== 'hurry') throw new RuleError('move');
    if (move.on === false) g.hurry.delete(id);
    else g.hurry.add(id);
    return settle(g, now);
  }
  if (g.acts.has(id) && prompt.kind !== 'vote') throw new RuleError('done');
  const middle = (i) => Number.isInteger(i) && i >= 0 && i < ONE_NIGHT.center;
  switch (prompt.kind) {
    case 'ready':
      g.acts.set(id, {});
      break;
    case 'vote':
      if (kind !== 'pick') throw new RuleError('move');
      if (move.target != null && !prompt.options.includes(move.target)) throw new RuleError('target');
      g.acts.set(id, { target: move.target ?? null });
      break;
    case 'lone':
    case 'drink':
      if (kind !== 'center' || !middle(move.index)) throw new RuleError('target');
      g.acts.set(id, { index: move.index });
      break;
    case 'look':
      // One player's card, or two in the middle.
      if (kind === 'pick' && prompt.options.includes(move.target)) g.acts.set(id, { target: move.target });
      else if (kind === 'center' && Array.isArray(move.indices) && move.indices.length === 2 && move.indices.every(middle) && move.indices[0] !== move.indices[1]) {
        g.acts.set(id, { indices: [...move.indices] });
      } else throw new RuleError('target');
      break;
    case 'rob':
      if (kind !== 'pick' || (move.target != null && !prompt.options.includes(move.target))) throw new RuleError('target');
      g.acts.set(id, { target: move.target ?? null });
      break;
    case 'swap':
      if (kind !== 'pair' || move.a === move.b || !prompt.options.includes(move.a) || !prompt.options.includes(move.b)) throw new RuleError('target');
      g.acts.set(id, { a: move.a, b: move.b });
      break;
    default:
      if (kind !== 'pick' || !prompt.options?.includes(move.target)) throw new RuleError('target');
      g.acts.set(id, { target: move.target });
  }
  settle(g, now);
}

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
    if (!['debate', 'deal'].includes(g.phase)) throw new RuleError('wrong-phase');
    g.paused = null;
    finish(g, now);
    return;
  }
  throw new RuleError('move');
}

export function advance(g, now) {
  let changed = false;
  for (let i = 0; i < 10 && g.phase !== 'end' && g.deadline !== null && now >= g.deadline; i++) {
    finish(g, now);
    changed = true;
  }
  return changed;
}

export function setAway(g, id, away, now) {
  if (away) g.away.add(id);
  else g.away.delete(id);
  settle(g, now);
}

function finish(g, now) {
  if (g.phase === 'deal') return begin(g, 'night', now);
  if (g.phase === 'night') {
    resolveNight(g);
    return begin(g, 'debate', now);
  }
  if (g.phase === 'debate') return begin(g, 'vote', now);
  if (g.phase === 'vote') return resolveVote(g);
}

/** The night, in the classic order; each acts on the cards as they lie at their turn. */
function resolveNight(g) {
  const byCard = (card) => g.seats.filter((s) => s.card === card);
  const a = (s) => g.acts.get(s.id);
  const wolves = byCard('werewolf');
  for (const w of wolves) learn(g, w.id, { type: 'pack', ids: wolves.map((x) => x.id) });
  if (wolves.length === 1) {
    const i = a(wolves[0])?.index;
    if (i !== undefined) {
      learn(g, wolves[0].id, { type: 'middle', index: i, card: g.center[i] });
      g.log.push({ type: 'lone', actor: wolves[0].id, index: i, card: g.center[i] });
    }
  }
  for (const m of byCard('minion')) learn(g, m.id, { type: 'wolves', ids: wolves.map((x) => x.id) });
  const masons = byCard('mason');
  for (const m of masons) learn(g, m.id, { type: 'masons', ids: masons.map((x) => x.id) });
  for (const seer of byCard('seer')) {
    const x = a(seer);
    if (x?.target) {
      learn(g, seer.id, { type: 'seen', target: x.target, card: seat(g, x.target).now });
      g.log.push({ type: 'look', actor: seer.id, target: x.target, card: seat(g, x.target).now });
    } else if (x?.indices) {
      const cards = x.indices.map((i) => g.center[i]);
      learn(g, seer.id, { type: 'middle2', indices: x.indices, cards });
      g.log.push({ type: 'look', actor: seer.id, indices: x.indices, cards });
    }
  }
  for (const robber of byCard('robber')) {
    const target = a(robber)?.target;
    if (!target) continue;
    const t = seat(g, target);
    [robber.now, t.now] = [t.now, robber.now];
    learn(g, robber.id, { type: 'robbed', target, card: robber.now });
    g.log.push({ type: 'rob', actor: robber.id, target, card: robber.now });
  }
  for (const tm of byCard('troublemaker')) {
    const x = a(tm);
    if (!x) continue;
    const sa = seat(g, x.a), sb = seat(g, x.b);
    [sa.now, sb.now] = [sb.now, sa.now];
    learn(g, tm.id, { type: 'swapped', a: x.a, b: x.b });
    g.log.push({ type: 'swap', actor: tm.id, a: x.a, b: x.b });
  }
  for (const d of byCard('drunk')) {
    // The drunk has to swap: at the deadline a middle card is taken at random.
    const i = a(d)?.index ?? Math.floor(g.rng() * ONE_NIGHT.center);
    [d.now, g.center[i]] = [g.center[i], d.now];
    learn(g, d.id, { type: 'drank', index: i });
    g.log.push({ type: 'drink', actor: d.id, index: i });
  }
  for (const ins of byCard('insomniac')) {
    learn(g, ins.id, { type: 'woke', card: ins.now });
    g.log.push({ type: 'woke', actor: ins.id, card: ins.now });
  }
}

function resolveVote(g) {
  const votes = {};
  const tally = {};
  for (const s of g.seats) {
    const target = g.acts.get(s.id)?.target ?? null;
    votes[s.id] = target;
    if (target) tally[target] = (tally[target] ?? 0) + 1;
  }
  const max = Math.max(0, ...Object.values(tally));
  const dead = max >= 2 ? Object.keys(tally).filter((id) => tally[id] === max) : [];
  // The hunter takes whoever they voted for along.
  for (const id of [...dead]) {
    const s = seat(g, id);
    if (s.now === 'hunter' && votes[id] && !dead.includes(votes[id])) dead.push(votes[id]);
  }
  g.votes = votes;
  g.dead = dead;
  g.log.push({ type: 'vote', votes, tally, dead });
  g.winner = judge(g);
  g.phase = 'end';
  g.prompts = new Map();
  g.acts = new Map();
  g.deadline = null;
  g.until = null;
}

/** Who has won, by the cards as they ended up. */
/** The host ended it early: no winner; the end's view shows every card as it stands. */
export function endEarly(g, by, now) {
  g.winner = null;
  g.ended = { by };
  g.votes = g.votes ?? null;
  g.dead = g.dead ?? [];
  g.phase = 'end';
  g.prompts = new Map();
  g.acts = new Map();
  g.deadline = null;
  g.until = null;
  g.paused = null;
  g.log.push({ type: 'ended', by });
  void now;
}

export function judge(g) {
  const card = (id) => seat(g, id).now;
  const died = g.dead.map(card);
  const wolvesInPlay = g.seats.some((s) => s.now === 'werewolf');
  const minionInPlay = g.seats.some((s) => s.now === 'minion');
  const tannerDied = died.includes('tanner');
  const wolfDied = died.includes('werewolf');
  const sides = [];
  if (wolvesInPlay) {
    if (wolfDied) sides.push('village');
    else if (!tannerDied) sides.push('wolves');
  } else if (!g.dead.length) sides.push('village');
  else if (minionInPlay && !tannerDied && !died.includes('minion')) sides.push('wolves');
  if (tannerDied) sides.push('tanner');
  const players = g.seats
    .filter((s) => (sides.includes('village') && VILLAGE.has(s.now)) || (sides.includes('wolves') && (s.now === 'werewolf' || s.now === 'minion')) || (sides.includes('tanner') && s.now === 'tanner' && g.dead.includes(s.id)))
    .map((s) => s.id);
  return { side: sides[0] ?? 'none', sides, players };
}

/** What one player may see; the big screen without an id. Everything once the game ends. */
export function view(g, viewer) {
  const me = viewer ? seat(g, viewer) : null;
  const ended = g.phase === 'end';
  let done = 0;
  for (const id of g.prompts.keys()) if (g.acts.has(id) || (g.phase === 'debate' && g.hurry.has(id))) done++;
  return {
    mode: 'onenight',
    phase: g.phase,
    night: g.phase === 'night' ? 1 : 0,
    day: g.phase === 'debate' || g.phase === 'vote' || ended ? 1 : 0,
    deadline: g.deadline,
    paused: g.paused,
    captain: null,
    deck: g.deck,
    powersLost: false,
    seats: g.seats.map((s) => ({
      id: s.id,
      alive: !ended || !g.dead.includes(s.id),
      role: ended ? s.now : null,
      dealt: ended ? s.card : null,
      side: ended ? ROLES[s.now].side : null,
      idiot: false,
      voter: true,
      died: ended && g.dead.includes(s.id) ? { cause: 'vote', night: 1, day: 1 } : null,
      acted: g.phase === 'vote' ? g.acts.has(s.id) : g.phase === 'debate' ? g.hurry.has(s.id) : null,
      lover: null,
    })),
    progress: g.prompts.size ? { done, total: g.prompts.size } : null,
    // One night votes in secret and shows them all at the end.
    votes: ended ? g.votes : null,
    center: ended ? { dealt: g.dealt, now: g.center } : null,
    runoff: null,
    morning: [],
    verdict: null,
    task: null,
    raven: null,
    growl: null,
    secondVote: false,
    winner: g.winner,
    ended: g.ended ?? null,
    awards: null,
    log: ended ? g.log : null,
    me: me
      ? {
          id: me.id,
          role: me.card,
          side: ROLES[me.card].side,
          alive: true,
          voter: true,
          lover: null,
          prompt: g.prompts.get(me.id) ?? null,
          act: g.acts.get(me.id) ?? null,
          hurried: g.hurry.has(me.id),
          knowledge: g.knowledge.get(me.id) ?? [],
          pack: null,
          chat: null,
          potions: null,
          guarded: null,
          extras: null,
          judgeCalled: false,
          charmed: false,
          infected: false,
          final: ended ? me.now : null,
        }
      : null,
    ghost: null,
  };
}
