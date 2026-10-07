// The roles: who they are, which side they're on, when they act, and what they're worth to the
// balance. The rules that use them live in server/rules.mjs; the words (names, abilities) live in
// the client (src/lib/i18n.svelte.ts), keyed by the ids here.

/**
 * @typedef {'village' | 'wolves'} Side
 * @typedef {{
 *   id: string,
 *   side: Side,
 *   weight: number,
 *   steps: string[],
 *   max: number,
 *   order: number,
 * }} Role
 */

/**
 * Night steps, in order. Everyone acts at once inside a step; the steps run one after another
 * because a later one needs an earlier one's outcome (the Witch has to know the wolves' victim).
 *   dusk   the first night only: Cupid binds the Lovers
 *   night  every night: the wolves hunt, the Seer looks, the Guard shields, the Little Girl peeks
 *   witch  every night with a Witch in the deck: heal the victim, poison someone
 */
export const NIGHT_STEPS = ['dusk', 'night', 'witch'];

/**
 * The catalogue. `weight` is the role's pull on the balance (village positive, wolves negative),
 * after the usual party-game card values; `max` is how many may be in one deck; `order` sorts the
 * deck for display (wolves first, then by power).
 * @type {Record<string, Role>}
 */
export const ROLES = {
  werewolf: { id: 'werewolf', side: 'wolves', weight: -6, steps: ['night'], max: 6, order: 0 },
  villager: { id: 'villager', side: 'village', weight: 1, steps: [], max: 20, order: 20 },
  seer: { id: 'seer', side: 'village', weight: 7, steps: ['night'], max: 1, order: 10 },
  witch: { id: 'witch', side: 'village', weight: 4, steps: ['witch'], max: 1, order: 11 },
  hunter: { id: 'hunter', side: 'village', weight: 3, steps: [], max: 1, order: 12 },
  cupid: { id: 'cupid', side: 'village', weight: -3, steps: ['dusk'], max: 1, order: 13 },
  guard: { id: 'guard', side: 'village', weight: 3, steps: ['night'], max: 1, order: 14 },
  girl: { id: 'girl', side: 'village', weight: 1, steps: ['night'], max: 1, order: 15 },
  idiot: { id: 'idiot', side: 'village', weight: 2, steps: [], max: 1, order: 16 },
  elder: { id: 'elder', side: 'village', weight: 2, steps: [], max: 1, order: 17 },
};

export const ROLE_IDS = Object.keys(ROLES);
/** The roles of a quick game: the core, so a round is short and easy to follow. */
export const QUICK_ROLES = ['werewolf', 'villager', 'seer', 'witch', 'hunter', 'guard'];

export const MIN_PLAYERS = 5;

/** How many wolves suit a table of n (about one in four, never close to half). */
export function wolvesFor(n) {
  if (n <= 6) return 1;
  if (n <= 11) return 2;
  if (n <= 16) return 3;
  return 4;
}

/** The order specials join a suggested deck as the table grows. */
const SPECIALS = ['seer', 'witch', 'hunter', 'cupid', 'guard', 'girl', 'idiot', 'elder'];
const SPECIALS_FROM = { seer: 5, witch: 6, hunter: 7, cupid: 8, guard: 9, girl: 10, idiot: 11, elder: 12 };

/**
 * The suggested deck for n players: { roleId: count }. Quick games keep to QUICK_ROLES.
 * @param {number} n
 * @param {'classic' | 'quick'} [mode]
 */
export function suggestedDeck(n, mode = 'classic') {
  const deck = { werewolf: wolvesFor(n) };
  for (const id of SPECIALS) {
    if (mode === 'quick' && !QUICK_ROLES.includes(id)) continue;
    if (n >= SPECIALS_FROM[id]) deck[id] = 1;
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

/**
 * A host's deck, cleaned: known roles, whole counts within each role's max. Anything else goes.
 * @param {unknown} raw
 */
export function cleanDeck(raw) {
  /** @type {Record<string, number>} */
  const deck = {};
  if (!raw || typeof raw !== 'object') return deck;
  for (const [id, value] of Object.entries(raw)) {
    const role = ROLES[id];
    if (!role || !Number.isInteger(value) || value <= 0) continue;
    deck[id] = Math.min(value, role.max);
  }
  return deck;
}

/**
 * Why a deck can't be played by n players, or null when it can.
 *   deck-size   the cards don't match the players
 *   no-wolves   no werewolf
 *   too-many-wolves   half the table or more
 */
export function deckProblem(deck, n) {
  if (deckSize(deck) !== n) return 'deck-size';
  const wolves = deck.werewolf ?? 0;
  if (!wolves) return 'no-wolves';
  if (wolves * 2 >= n) return 'too-many-wolves';
  return null;
}

/** The deck as a list of role ids, wolves first (for display and for dealing). */
export function deckList(deck) {
  return Object.entries(deck)
    .sort(([a], [b]) => ROLES[a].order - ROLES[b].order)
    .flatMap(([id, count]) => Array(count).fill(id));
}
