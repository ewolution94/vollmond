// The game's phases as the pages show them: which are dark (night falls once, at the first of them)
// and the stage's title for each.

import type { Game } from './api';
import { t, tk } from './i18n.svelte';

/** The night's steps: the Thief, dusk (Cupid, the Wild Child), the night itself, the Witch. */
export const DARK = new Set(['thief', 'dusk', 'night', 'witch']);

export const isDark = (game: Game | null | undefined) => Boolean(game && DARK.has(game.phase));

export function phaseTitle(game: Game): string {
  if (game.mode === 'onenight' && game.phase === 'night') return t('phase:onenight');
  if (game.phase === 'vote' && game.secondVote) return t('secondVote');
  return tk(`phase:${game.phase}`, { n: game.phase === 'debate' ? game.day : game.night });
}
