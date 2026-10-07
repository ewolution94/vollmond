// What the client needs to know about a role beyond its words (i18n): its side, when it acts, and
// the order the deck is shown in. The rules themselves are the server's (server/roles.mjs).

import type { RoleId, Side } from './api';

export type When = 'night' | 'dusk' | 'witch' | 'death' | 'day' | 'never';

export const ROLE_INFO: Record<RoleId, { side: Side; when: When }> = {
  werewolf: { side: 'wolves', when: 'night' },
  villager: { side: 'village', when: 'never' },
  seer: { side: 'village', when: 'night' },
  witch: { side: 'village', when: 'witch' },
  hunter: { side: 'village', when: 'death' },
  cupid: { side: 'village', when: 'dusk' },
  guard: { side: 'village', when: 'night' },
  girl: { side: 'village', when: 'night' },
  idiot: { side: 'village', when: 'day' },
  elder: { side: 'village', when: 'never' },
};

export const ROLE_ORDER: RoleId[] = ['werewolf', 'seer', 'witch', 'hunter', 'cupid', 'guard', 'girl', 'idiot', 'elder', 'villager'];

/** The deck as a list of cards, in display order. */
export function deckCards(deck: Partial<Record<RoleId, number>>): RoleId[] {
  return ROLE_ORDER.flatMap((id) => Array(deck[id] ?? 0).fill(id));
}
