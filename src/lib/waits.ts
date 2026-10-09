// Waiting for the server, at the control that asked (Folio's track(), development/plans/waiting-states.md):
// the tapped button stays pressed and locked until the answer, shows the waxing moon after 150 ms,
// says what it's doing after 1.2 s, "Dauert länger …" after 6 s, and offers "Nochmal" at 12 s.
// Kritzle was the pilot; this is the same helper with Vollmond's words.

import { track } from '../../vendor/ewo/elements/waiting.js';
import { ApiError } from './api';
import { t, type Key } from './i18n.svelte';
import type { Room } from './room.svelte';

/** What a room action says after 1.2 s; the rest show only the moon. */
const WORDS: Record<string, Key> = {
  start: 'wait_start',
  bot: 'wait_bot',
  unbot: 'wait_unbot',
  kick: 'wait_kick',
  rematch: 'wait_rematch',
  end: 'wait_end',
  leave: 'wait_leave',
};

/** The control behind an event: the clicked button, or a form's submit button. */
export function controlOf(from: Event | Element | null | undefined): Element | null {
  if (!from) return null;
  if (from instanceof Element) return from;
  if (from instanceof SubmitEvent && from.submitter) return from.submitter;
  return from.currentTarget instanceof Element ? from.currentTarget : null;
}

/**
 * Any wait at a control: `run` gets the signal that track() aborts at 12 s. A timeout comes back as
 * ApiError('timeout'), so the components' error words cover it. A second tap while it waits resolves
 * with undefined and sends nothing.
 */
export async function waitAt<T>(from: Event | Element | null | undefined, run: (signal: AbortSignal) => Promise<T>, words?: string): Promise<T | undefined> {
  try {
    return await track(controlOf(from), run, { label: words });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    throw error instanceof ApiError ? error : new ApiError(code === 'timeout' ? 'timeout' : 'other');
  }
}

/** A move in the village, waited for at the control that made it. */
export function actAt(room: Room, action: string, body: unknown, from?: Event | Element | null) {
  const key = WORDS[action];
  return waitAt(from, (signal) => room.act(action, body, signal), key ? t(key) : undefined);
}

/** A fresh key for one "Found a village" or join, the same for every retry of it (server/game.mjs). */
export const newKey = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
