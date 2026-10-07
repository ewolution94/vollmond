// The roles: who they are, which side they're on, which modes deal them, and what they're worth to
// the balance. The rules that use them live in server/rules.mjs (Classic, Quick) and
// server/onenight.mjs (One night); the words (names, abilities) live in the client
// (src/lib/i18n.svelte.ts), keyed by the ids here.

/**
 * @typedef {'village' | 'wolves' | 'piper' | 'angel' | 'tanner'} Side
 * @typedef {{
 *   id: string,
 *   side: Side,
 *   weight: number,
 *   max: number,
 *   order: number,
 *   modes: string[],
 *   exact?: number,
 *   solo?: boolean,
 * }} Role
 */

const CLASSIC = ['classic'];
const BOTH = ['classic', 'quick'];
const ALL = ['classic', 'quick', 'onenight'];
const NIGHT_ONLY = ['onenight'];

/**
 * The catalogue. `weight` is the role's pull on the balance (village positive, wolves negative),
 * after the usual party-game card values; `max` is how many a deck may hold, `exact` a count it must
 * hold if it holds any (sisters come in twos, brothers in threes, masons in twos); `order` sorts
 * the deck for display; `solo` marks a wolf who wins only alone.
 * @type {Record<string, Role>}
 */
export const ROLES = {
  werewolf: { id: 'werewolf', side: 'wolves', weight: -6, max: 6, order: 0, modes: ALL },
  bigwolf: { id: 'bigwolf', side: 'wolves', weight: -9, max: 1, order: 1, modes: CLASSIC },
  wolffather: { id: 'wolffather', side: 'wolves', weight: -8, max: 1, order: 2, modes: CLASSIC },
  whitewolf: { id: 'whitewolf', side: 'wolves', weight: -7, max: 1, order: 3, modes: CLASSIC, solo: true },
  minion: { id: 'minion', side: 'wolves', weight: -4, max: 1, order: 4, modes: NIGHT_ONLY },
  piper: { id: 'piper', side: 'piper', weight: -4, max: 1, order: 6, modes: CLASSIC },
  angel: { id: 'angel', side: 'angel', weight: 0, max: 1, order: 7, modes: CLASSIC },
  tanner: { id: 'tanner', side: 'tanner', weight: -2, max: 1, order: 8, modes: NIGHT_ONLY },
  seer: { id: 'seer', side: 'village', weight: 7, max: 1, order: 10, modes: ALL },
  witch: { id: 'witch', side: 'village', weight: 4, max: 1, order: 11, modes: BOTH },
  hunter: { id: 'hunter', side: 'village', weight: 3, max: 1, order: 12, modes: ALL },
  cupid: { id: 'cupid', side: 'village', weight: -3, max: 1, order: 13, modes: CLASSIC },
  guard: { id: 'guard', side: 'village', weight: 3, max: 1, order: 14, modes: BOTH },
  girl: { id: 'girl', side: 'village', weight: 1, max: 1, order: 15, modes: CLASSIC },
  idiot: { id: 'idiot', side: 'village', weight: 2, max: 1, order: 16, modes: CLASSIC },
  elder: { id: 'elder', side: 'village', weight: 2, max: 1, order: 17, modes: CLASSIC },
  fox: { id: 'fox', side: 'village', weight: 3, max: 1, order: 18, modes: CLASSIC },
  bear: { id: 'bear', side: 'village', weight: 3, max: 1, order: 19, modes: CLASSIC },
  raven: { id: 'raven', side: 'village', weight: 2, max: 1, order: 20, modes: CLASSIC },
  knight: { id: 'knight', side: 'village', weight: 3, max: 1, order: 21, modes: CLASSIC },
  judge: { id: 'judge', side: 'village', weight: 3, max: 1, order: 22, modes: CLASSIC },
  scapegoat: { id: 'scapegoat', side: 'village', weight: 1, max: 1, order: 23, modes: CLASSIC },
  wildchild: { id: 'wildchild', side: 'village', weight: -1, max: 1, order: 24, modes: CLASSIC },
  thief: { id: 'thief', side: 'village', weight: -1, max: 1, order: 25, modes: CLASSIC },
  sister: { id: 'sister', side: 'village', weight: 3, max: 2, exact: 2, order: 26, modes: CLASSIC },
  brother: { id: 'brother', side: 'village', weight: 2, max: 3, exact: 3, order: 27, modes: CLASSIC },
  robber: { id: 'robber', side: 'village', weight: 2, max: 1, order: 30, modes: NIGHT_ONLY },
  troublemaker: { id: 'troublemaker', side: 'village', weight: 2, max: 1, order: 31, modes: NIGHT_ONLY },
  drunk: { id: 'drunk', side: 'village', weight: 1, max: 1, order: 32, modes: NIGHT_ONLY },
  insomniac: { id: 'insomniac', side: 'village', weight: 1, max: 1, order: 33, modes: NIGHT_ONLY },
  mason: { id: 'mason', side: 'village', weight: 2, max: 2, exact: 2, order: 34, modes: NIGHT_ONLY },
  villager: { id: 'villager', side: 'village', weight: 1, max: 20, order: 40, modes: ALL },
};

export const ROLE_IDS = Object.keys(ROLES);
/** The roles of a quick game: the core, so a round is short and easy to follow. */
export const QUICK_ROLES = ROLE_IDS.filter((id) => ROLES[id].modes.includes('quick'));
/** Cards a wolf-side role is: the pack hunts with them. */
export const isWolfRole = (id) => ROLES[id]?.side === 'wolves';

export const MIN_PLAYERS = 5;
/** One night plays from three to ten. */
export const ONE_NIGHT = { min: 3, max: 10, center: 3 };

export const playersRange = (mode) => (mode === 'onenight' ? [ONE_NIGHT.min, ONE_NIGHT.max] : [MIN_PLAYERS, 24]);

/** How many wolves suit a table of n (about one in four, never close to half). */
export function wolvesFor(n) {
  if (n <= 6) return 1;
  if (n <= 11) return 2;
  if (n <= 16) return 3;
  return 4;
}

/** The order specials join a suggested Classic deck as the table grows, and from which size. */
const SPECIALS = [
  ['seer', 5], ['witch', 6], ['hunter', 7], ['cupid', 8], ['guard', 9], ['girl', 10], ['idiot', 11], ['elder', 12],
  ['fox', 13], ['raven', 14], ['knight', 15], ['bear', 16], ['wildchild', 17], ['judge', 18], ['scapegoat', 19], ['piper', 20],
];

/** One night: the base six for three players, then one card more per player. */
const ONE_NIGHT_BASE = ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager'];
const ONE_NIGHT_MORE = ['drunk', 'insomniac', 'hunter', 'tanner', 'minion', 'villager', 'villager'];

/**
 * The suggested deck for n players: { roleId: count }.
 * @param {number} n
 * @param {'classic' | 'quick' | 'onenight'} [mode]
 */
export function suggestedDeck(n, mode = 'classic') {
  if (mode === 'onenight') {
    const cards = [...ONE_NIGHT_BASE, ...ONE_NIGHT_MORE.slice(0, Math.max(0, Math.min(n, ONE_NIGHT.max) - ONE_NIGHT.min))];
    const deck = {};
    for (const id of cards) deck[id] = (deck[id] ?? 0) + 1;
    return deck;
  }
  const deck = { werewolf: wolvesFor(n) };
  for (const [id, from] of SPECIALS) {
    if (!ROLES[id].modes.includes(mode)) continue;
    if (n >= from) deck[id] = 1;
  }
  const used = Object.values(deck).reduce((a, b) => a + b, 0);
  if (n > used) deck.villager = n - used;
  return deck;
}

/** The deck's lean: positive favours the village, negative the wolves; near zero is fair. */
export function balance(deck) {
  return Object.entries(deck).reduce((sum, [id, count]) => sum + (ROLES[id]?.weight ?? 0) * count, 0);
}

export const deckSize = (deck) => Object.values(deck).reduce((a, b) => a + b, 0);

/** The cards a deck must hold for n players: players, plus the middle (One night) or the Thief's two. */
export function cardsFor(deck, n, mode) {
  if (mode === 'onenight') return n + ONE_NIGHT.center;
  return n + (deck.thief ? 2 : 0);
}

/**
 * A host's deck, cleaned: known roles of the mode, whole counts within each role's max. Anything else goes.
 * @param {unknown} raw
 * @param {string} [mode]
 */
export function cleanDeck(raw, mode = 'classic') {
  /** @type {Record<string, number>} */
  const deck = {};
  if (!raw || typeof raw !== 'object') return deck;
  for (const [id, value] of Object.entries(raw)) {
    const role = ROLES[id];
    if (!role || !role.modes.includes(mode) || !Number.isInteger(value) || value <= 0) continue;
    deck[id] = Math.min(value, role.max);
  }
  return deck;
}

/**
 * Why a deck can't be played by n players, or null when it can.
 *   deck-size         the cards don't match the players (and the middle, or the Thief's two)
 *   no-wolves         no werewolf at all
 *   too-many-wolves   half the table or more
 *   set               sisters, brothers or masons not in a full set
 *   mode              a role the mode doesn't deal
 */
export function deckProblem(deck, n, mode = 'classic') {
  for (const id of Object.keys(deck)) if (!ROLES[id]?.modes.includes(mode)) return 'mode';
  if (deckSize(deck) !== cardsFor(deck, n, mode)) return 'deck-size';
  for (const [id, count] of Object.entries(deck)) {
    const exact = ROLES[id].exact;
    if (exact && count && count !== exact) return 'set';
  }
  const wolves = Object.entries(deck).filter(([id]) => ROLES[id].side === 'wolves' && id !== 'minion').reduce((a, [, c]) => a + c, 0);
  if (!wolves) return 'no-wolves';
  if (mode !== 'onenight' && wolves * 2 >= n) return 'too-many-wolves';
  return null;
}

/** The deck as a list of role ids, wolves first (for display and for dealing). */
export function deckList(deck) {
  return Object.entries(deck)
    .sort(([a], [b]) => ROLES[a].order - ROLES[b].order)
    .flatMap(([id, count]) => Array(count).fill(id));
}
