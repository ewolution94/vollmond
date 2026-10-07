// What the client needs to know about a role beyond its words (i18n): its side, when it acts, and
// the order the deck is shown in. The rules themselves are the server's (server/roles.mjs).

import type { RoleId, Side } from './api';

export type When = 'night' | 'dusk' | 'witch' | 'death' | 'day' | 'never' | 'deal' | 'dawn' | 'end';

export const ROLE_INFO: Record<RoleId, { side: Side; when: When }> = {
  werewolf: { side: 'wolves', when: 'night' },
  bigwolf: { side: 'wolves', when: 'night' },
  wolffather: { side: 'wolves', when: 'night' },
  whitewolf: { side: 'wolves', when: 'night' },
  minion: { side: 'wolves', when: 'night' },
  piper: { side: 'piper', when: 'night' },
  angel: { side: 'angel', when: 'day' },
  tanner: { side: 'tanner', when: 'end' },
  villager: { side: 'village', when: 'never' },
  seer: { side: 'village', when: 'night' },
  witch: { side: 'village', when: 'witch' },
  hunter: { side: 'village', when: 'death' },
  cupid: { side: 'village', when: 'dusk' },
  guard: { side: 'village', when: 'night' },
  girl: { side: 'village', when: 'night' },
  idiot: { side: 'village', when: 'day' },
  elder: { side: 'village', when: 'never' },
  fox: { side: 'village', when: 'night' },
  bear: { side: 'village', when: 'dawn' },
  raven: { side: 'village', when: 'night' },
  knight: { side: 'village', when: 'death' },
  judge: { side: 'village', when: 'day' },
  scapegoat: { side: 'village', when: 'day' },
  wildchild: { side: 'village', when: 'dusk' },
  thief: { side: 'village', when: 'dusk' },
  sister: { side: 'village', when: 'deal' },
  brother: { side: 'village', when: 'deal' },
  robber: { side: 'village', when: 'night' },
  troublemaker: { side: 'village', when: 'night' },
  drunk: { side: 'village', when: 'night' },
  insomniac: { side: 'village', when: 'night' },
  mason: { side: 'village', when: 'night' },
};

export const ROLE_ORDER: RoleId[] = [
  'werewolf', 'bigwolf', 'wolffather', 'whitewolf', 'minion', 'piper', 'angel', 'tanner',
  'seer', 'witch', 'hunter', 'cupid', 'guard', 'girl', 'idiot', 'elder', 'fox', 'bear', 'raven', 'knight',
  'judge', 'scapegoat', 'wildchild', 'thief', 'sister', 'brother',
  'robber', 'troublemaker', 'drunk', 'insomniac', 'mason', 'villager',
];

/** The deck as a list of cards, in display order. */
export function deckCards(deck: Partial<Record<RoleId, number>>): RoleId[] {
  return ROLE_ORDER.flatMap((id) => Array(deck[id] ?? 0).fill(id));
}
