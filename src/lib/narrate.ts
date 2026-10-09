// What the narrator says right now: one line for the moment the game is in, the same variant on
// every page (seeded by the room, the night, the day and the phase).

import type { Game, View } from './api';
import { i18n, LINES } from './i18n.svelte';

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** "A", "A und B", "A, B und C" */
export function listNames(names: string[]) {
  const and = i18n.lang === 'de' ? ' und ' : ' and ';
  if (names.length <= 1) return names[0] ?? '';
  return names.slice(0, -1).join(', ') + and + names.at(-1);
}

/** The moment's key in LINES and the names it mentions. */
export function moment(game: Game): { key: string; ids: string[] } {
  if (game.phase === 'end' && game.ended) return { key: 'ended', ids: [] };
  if (game.mode === 'onenight') {
    if (game.phase === 'end') {
      const side = game.winner?.side ?? 'none';
      return side === 'tanner' ? { key: 'tanner', ids: [] } : { key: side === 'village' ? 'oneVillage' : side === 'wolves' ? 'oneWolves' : 'oneNone', ids: [] };
    }
    return { key: { deal: 'oneDeal', night: 'oneNight', debate: 'oneDebate', vote: 'oneVote' }[game.phase as string] ?? game.phase, ids: [] };
  }
  switch (game.phase) {
    case 'dawn':
      return game.morning.length ? { key: 'dawn', ids: game.morning.map((d) => d.id) } : { key: 'dawnNone', ids: [] };
    case 'hunter':
    case 'successor':
      return { key: game.phase, ids: game.task ? [game.task.id] : [] };
    case 'runoff':
      return { key: 'runoff', ids: game.runoff ?? [] };
    case 'verdict': {
      const v = game.verdict;
      if (v?.idiot && v.out) return { key: 'verdictIdiot', ids: [v.out] };
      if (v?.scapegoat && v.out) return { key: 'verdictGoat', ids: [v.out] };
      if (v?.out) return { key: 'verdict', ids: [v.out] };
      return { key: v?.tie ? 'verdictTie' : 'verdictNone', ids: [] };
    }
    case 'end':
      return { key: game.winner?.side ?? 'none', ids: game.winner?.side === 'lovers' ? game.winner.players : [] };
    default:
      return { key: game.phase, ids: [] };
  }
}

export function narrate(view: View): string {
  const game = view.game;
  if (!game) return '';
  const { key, ids } = moment(game);
  const lines = LINES[i18n.lang][key];
  if (!lines?.length) return '';
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const line = lines[hash(`${view.code}:${game.night}:${game.day}:${game.phase}:${view.games}`) % lines.length];
  return line.replace('{village}', view.village).replace('{names}', listNames(ids.map(name)));
}
