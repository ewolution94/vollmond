// What a device remembers: the name and coat of arms you play under, and your seat in each room (so a
// reload, or the phone locking mid-game, puts you back in the same seat with your card). The name and the
// arms also go to Folio's shared cookie, so they follow you to the other ewolution games
// (development/plans/emblems.md). Storage can be blocked; then nothing is remembered and everything still works.

import type { Avatar, SeatTicket as Seat } from './api';
import { relatedEmblem, shareEmblem, sharedEmblem, sharedName, shareName } from '../../vendor/ewo/elements/emblem-shared.js';

const NAME = 'vollmond:name';
const ARMS = 'vollmond:arms';
const SEAT = 'vollmond:seat:';

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // not kept
  }
}

/** The name field's maxlength: a name from another game may be longer. */
const NAME_MAX = 24;

/** The name you last joined with, here or in another ewolution game. */
export const savedName = () => (sharedName() || read(NAME) || '').slice(0, NAME_MAX);
export function saveName(name: string) {
  write(NAME, name.trim() || null);
  shareName(name);
}
const ownArms = (): Avatar | null => {
  try {
    const a = JSON.parse(read(ARMS) ?? 'null');
    return a && Number.isInteger(a.field) && Number.isInteger(a.charge) ? { field: a.field, charge: a.charge } : null;
  } catch {
    return null;
  }
};

/**
 * The coat of arms you last picked, here or in another game; else the one you last played under here;
 * else one with your coin's or price tag's charge from the other games; else null for a new random one.
 */
export function savedArms(): Avatar | null {
  const shared = sharedEmblem('heraldry');
  if (shared) return { field: shared[0], charge: shared[1] };
  const own = ownArms();
  if (own) return own;
  const related = relatedEmblem('heraldry');
  return related ? { field: related[0], charge: related[1] } : null;
}
/** Kept here; shared with the other games when it's new (a pick, or the first arms you play under), not when joining with the ones you had. */
export function saveArms(arms: Avatar) {
  const before = ownArms();
  write(ARMS, JSON.stringify(arms));
  if (before?.field !== arms.field || before?.charge !== arms.charge) shareEmblem('heraldry', [arms.field, arms.charge]);
}

export function savedSeat(code: string): Seat | null {
  try {
    const seat = JSON.parse(read(SEAT + code) ?? 'null');
    return seat && typeof seat.token === 'string' && typeof seat.player === 'string' ? { ...seat, code } : null;
  } catch {
    return null;
  }
}

export function saveSeat(seat: Seat) {
  write(SEAT + seat.code, JSON.stringify({ player: seat.player, token: seat.token, at: Date.now() }));
  // Old rooms are long gone after a day; keep the storage tidy.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(SEAT) || key === SEAT + seat.code) continue;
      const at = JSON.parse(localStorage.getItem(key) ?? '{}')?.at ?? 0;
      if (Date.now() - at > 24 * 60 * 60_000) localStorage.removeItem(key);
    }
  } catch {
    // fine
  }
}

export const forgetSeat = (code: string) => write(SEAT + code, null);
