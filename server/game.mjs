// Rooms: players, seats, the lobby's settings, and one game of the rules (server/rules.mjs) at a
// time. No I/O: the HTTP layer (server/api.mjs) calls these functions and streams each player their
// own view, because in this game every player knows something the others mustn't.
//
// A room lives in memory only. A restart (a deploy) ends every game, and an empty room is
// forgotten after half an hour.
//
// Phases: lobby → game → (rematch) lobby.

import { randomBytes, randomInt } from 'node:crypto';
import { ROLES, ROLE_IDS, balance, cardsFor, cleanDeck, deckProblem, deckSize, playersRange, suggestedDeck } from './roles.mjs';
import * as classic from './rules.mjs';
import * as onenight from './onenight.mjs';
import { botMove, botName } from './bots.mjs';

/** Room codes have no vowels, so no code spells a word. */
const CODE_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
export const CODE = /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/;

export const MODES = ['classic', 'quick', 'onenight'];
export const WHERE = ['call', 'table'];
export const NIGHT_CHOICES = [20, 30, 45, 60];
/** Seconds of debate; 0 is open (it ends when most want to vote, or the host moves on). */
export const DEBATE_CHOICES = [60, 120, 180, 300, 480, 0];
export const REVEAL = ['role', 'side', 'none'];
export const VOTES = ['open', 'secret'];
export const TIES = ['none', 'runoff'];
export const FIRST_NIGHT = ['hunt', 'calm'];
export const SEER = ['role', 'side'];
/** Coat of arms: a field tincture and a charge (drawn by the client). */
export const AVATAR = { fields: 8, charges: 16 };
export const MAX_BOTS = 12;

export const LIMITS = {
  rooms: 200,
  players: 24,
  name: 16,
  roomsPer10Min: 40,
};

const HOST_GRACE = 15_000;
const LOBBY_GRACE = 60_000;
const EMPTY_TTL = 30 * 60_000;
const IDLE_TTL = 4 * 60 * 60_000;
/** Bots think for a moment, so a game with them still reads like a game. */
const BOT_DELAY = [1500, 5000];

export const DEFAULT_SETTINGS = Object.freeze({
  mode: 'classic',
  where: 'call',
  /** null: the suggested deck for however many are playing; else { roleId: count }. */
  deck: null,
  mystery: false,
  night: 45,
  debate: 180,
  reveal: 'role',
  votes: 'open',
  tie: 'none',
  captain: true,
  parity: true,
  firstNight: 'hunt',
  seer: 'role',
  witchSelf: true,
  ghosts: true,
});

/** A mode's defaults, set when the host switches to it; every switch starts from the suggested deck. */
const MODE_DEFAULTS = {
  classic: { night: 45, debate: 180, deck: null },
  quick: { night: 30, debate: 120, captain: false, deck: null, reveal: 'role' },
  onenight: { night: 30, debate: 300, deck: null },
};
const { RuleError } = classic;
/** The rules a game plays by: One night has its own engine with the same functions. */
const R = (g) => (g.mode === 'onenight' ? onenight : classic);
const ruleView = (g, id) => R(g).view(g, id);
const ruleAct = (g, id, move, now) => R(g).act(g, id, move, now);
const advance = (g, now) => R(g).advance(g, now);
const control = (g, command, now) => R(g).control(g, command, now);
const setAway = (g, id, away, now) => R(g).setAway(g, id, away, now);

export class GameError extends Error {
  /** @param {string} code  @param {number} [status] */
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const PREFIX = ['Nebel', 'Mond', 'Krähen', 'Wolfs', 'Eulen', 'Finster', 'Raben', 'Silber', 'Moos', 'Dorn', 'Hasel', 'Schatten'];
const SUFFIX = ['hausen', 'bach', 'winkel', 'grund', 'au', 'brück', 'tal', 'heim', 'feld', 'stein', 'hain', 'furt'];
/** Every room is a village with a name, from its code. */
export function villageName(code) {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PREFIX[h % PREFIX.length] + SUFFIX[Math.floor(h / PREFIX.length) % SUFFIX.length];
}

/**
 * @typedef {{ now(): number, setTimeout(fn: () => void, ms: number): any, clearTimeout(handle: any): void }} Clock
 */

/**
 * @param {{ clock?: Clock, rng?: () => number, botDelay?: [number, number] }} [options]
 */
export function createGames({
  clock = { now: Date.now, setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h) },
  rng = Math.random,
  botDelay = BOT_DELAY,
} = {}) {
  /** @type {Map<string, any>} */
  const rooms = new Map();
  const created = [];

  // ---- helpers ------------------------------------------------------------------------------

  function room(code) {
    const r = rooms.get(String(code ?? '').toUpperCase());
    if (!r) throw new GameError('no-room', 404);
    return r;
  }

  function within(stamps, windowMs, limit) {
    const t = clock.now();
    while (stamps.length && stamps[0] <= t - windowMs) stamps.shift();
    if (stamps.length >= limit) return false;
    stamps.push(t);
    return true;
  }

  function newCode() {
    for (let i = 0; i < 100; i++) {
      let code = '';
      for (let j = 0; j < 4; j++) code += CODE_LETTERS[randomInt(CODE_LETTERS.length)];
      if (!rooms.has(code)) return code;
    }
    throw new GameError('busy', 503);
  }

  function player(r, token) {
    if (typeof token !== 'string' || !token) throw new GameError('no-player', 401);
    for (const p of r.players.values()) if (p.token === token && !p.left) return p;
    throw new GameError('no-player', 401);
  }

  function requireHost(r, p) {
    if (r.host !== p.id) throw new GameError('not-host', 403);
  }

  /** Players still in the room, in the order they joined. */
  function present(r) {
    return [...r.players.values()].filter((p) => !p.left);
  }

  function randomAvatar() {
    return { field: randomInt(AVATAR.fields), charge: randomInt(AVATAR.charges) };
  }

  function addPlayer(r, rawName, rawAvatar, bot = false) {
    if (present(r).length >= LIMITS.players) throw new GameError('room-full', 409);
    const taken = new Set(present(r).map((p) => p.name.toLowerCase()));
    const base = bot ? botName(taken) : cleanName(rawName);
    if (!base) throw new GameError('name');
    let name = base;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} ${n}`;
    const p = {
      id: randomBytes(6).toString('base64url'),
      token: randomBytes(18).toString('base64url'),
      name,
      avatar: cleanAvatar(rawAvatar) ?? randomAvatar(),
      bot,
      joined: clock.now(),
      online: bot ? 1 : 0,
      offlineSince: bot ? null : clock.now(),
      left: false,
    };
    r.players.set(p.id, p);
    return p;
  }

  /** The deck the next game would use, and what's wrong with it. */
  function lobbyDeck(r) {
    const n = present(r).length;
    const mode = r.settings.mode;
    const [min, max] = playersRange(mode);
    const suggested = suggestedDeck(n, mode);
    const deck = r.settings.deck ?? suggested;
    const problem = n < min ? 'too-few' : n > max ? 'too-many' : deckProblem(deck, n, mode);
    return { suggested, deck, balance: balance(deck), size: deckSize(deck), cards: cardsFor(deck, n, mode), min, max, problem };
  }

  /** What one page sees: the room, and the game as that player (or the big screen) may see it. */
  function viewFor(r, playerId) {
    const seated = r.game && r.game.seats.some((s) => s.id === playerId);
    return {
      code: r.code,
      village: r.village,
      phase: r.phase,
      version: r.version,
      host: r.host,
      settings: r.settings,
      notice: r.notice,
      players: present(r).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, bot: p.bot, online: p.online > 0 })),
      lobby: r.phase === 'lobby' ? lobbyDeck(r) : null,
      game: r.game ? ruleView(r.game, seated ? playerId : null) : null,
      games: r.games,
      now: clock.now(),
    };
  }

  function touch(r) {
    r.touched = clock.now();
    r.version++;
    broadcast(r);
    if (r.game) bots(r);
  }

  function broadcast(r) {
    if (!r.subscribers.size) return;
    /** @type {Map<string | null, string>} */
    const cache = new Map();
    for (const s of r.subscribers) {
      let json = cache.get(s.playerId);
      if (!json) {
        json = JSON.stringify(viewFor(r, s.playerId));
        cache.set(s.playerId, json);
      }
      s.send(json);
    }
  }

  /** The next deadline of the game, or none. */
  function schedule(r) {
    clock.clearTimeout(r.timer);
    r.timer = null;
    const g = r.game;
    if (!g || g.deadline === null || g.phase === 'end') return;
    r.timer = clock.setTimeout(() => {
      r.timer = null;
      if (r.game !== g) return;
      if (advance(g, clock.now())) {
        if (g.phase === 'end') r.games++;
        touch(r);
      }
      schedule(r);
    }, Math.max(0, g.deadline - clock.now()));
  }

  /** Bots answer what they're asked, each after a moment's thought. */
  function bots(r) {
    const g = r.game;
    if (!g || g.phase === 'end') return;
    const humansHurried = g.phase === 'debate' && [...g.hurry].some((id) => !r.players.get(id)?.bot);
    for (const p of present(r)) {
      if (!p.bot || !g.prompts.has(p.id) || r.botPending.has(p.id)) continue;
      const before = `${g.phase}:${g.night}:${g.day}`;
      const move = botMove(ruleView(g, p.id), rng, { humansHurried });
      if (!move) continue;
      r.botPending.add(p.id);
      const wait = botDelay[0] + rng() * (botDelay[1] - botDelay[0]);
      clock.setTimeout(() => {
        r.botPending.delete(p.id);
        if (r.game !== g || `${g.phase}:${g.night}:${g.day}` !== before) return bots(r);
        try {
          ruleAct(g, p.id, move, clock.now());
        } catch {
          return;
        }
        schedule(r);
        touch(r);
      }, wait);
    }
  }

  function handOver(r) {
    const host = r.players.get(r.host);
    if (host && !host.left && host.online > 0 && !host.bot) return;
    const next = present(r).find((p) => p.online > 0 && !p.bot);
    if (next && next.id !== r.host) {
      r.host = next.id;
      touch(r);
    }
  }

  function removePlayer(r, p) {
    if (r.phase === 'lobby') r.players.delete(p.id);
    else p.left = true;
    p.online = 0;
    if (r.game) setAway(r.game, p.id, true, clock.now());
    if (r.host === p.id) {
      const next = present(r).find((q) => q.online > 0 && !q.bot) ?? present(r).find((q) => !q.bot);
      if (next) r.host = next.id;
    }
    if (!present(r).some((q) => !q.bot)) return forget(r);
    schedule(r);
    touch(r);
  }

  function forget(r) {
    clock.clearTimeout(r.timer);
    rooms.delete(r.code);
    for (const s of r.subscribers) s.send(JSON.stringify({ code: r.code, phase: 'gone' }));
    r.subscribers.clear();
  }

  // ---- public API ---------------------------------------------------------------------------

  return {
    get size() {
      return rooms.size;
    },

    /** @param {{ name: unknown, avatar?: unknown }} body */
    create({ name, avatar }) {
      if (!cleanName(name)) throw new GameError('name');
      if (rooms.size >= LIMITS.rooms || !within(created, 10 * 60_000, LIMITS.roomsPer10Min)) throw new GameError('busy', 429);
      const code = newCode();
      const r = {
        code,
        village: villageName(code),
        created: clock.now(),
        touched: clock.now(),
        version: 0,
        host: '',
        players: new Map(),
        settings: { ...DEFAULT_SETTINGS },
        phase: 'lobby',
        game: null,
        games: 0,
        notice: null,
        timer: null,
        botPending: new Set(),
        subscribers: new Set(),
      };
      rooms.set(code, r);
      const p = addPlayer(r, name, avatar);
      r.host = p.id;
      return { code, player: p.id, token: p.token };
    },

    /** A quick look before joining. */
    info(code) {
      const r = rooms.get(String(code ?? '').toUpperCase());
      if (!r) return null;
      return { code: r.code, village: r.village, phase: r.phase, players: present(r).length, full: present(r).length >= LIMITS.players };
    },

    /**
     * Joins, or comes back: a known token gets the same seat again. Someone new during a game
     * watches it and plays the next one.
     * @param {{ name?: unknown, avatar?: unknown, token?: unknown }} body
     */
    join(code, { name, avatar, token }) {
      const r = room(code);
      if (typeof token === 'string' && token) {
        for (const p of r.players.values()) {
          if (p.token === token && !p.left) return { code: r.code, player: p.id, token: p.token };
        }
        if (!cleanName(name)) throw new GameError('no-player', 401);
      }
      const p = addPlayer(r, name, avatar);
      touch(r);
      return { code: r.code, player: p.id, token: p.token };
    },

    view(code, playerId = null) {
      return viewFor(room(code), playerId);
    },

    /**
     * Streams the room to one page: `send` gets that page's view as JSON now and after every change.
     * @param {(json: string) => void} send
     */
    subscribe(code, playerId, send) {
      const r = room(code);
      const p = r.players.get(String(playerId ?? ''));
      const sub = { send, playerId: p && !p.left ? p.id : null };
      r.subscribers.add(sub);
      if (p && !p.left && !p.bot) {
        p.online++;
        p.offlineSince = null;
        if (r.game && p.online === 1) setAway(r.game, p.id, false, clock.now());
      }
      send(JSON.stringify(viewFor(r, sub.playerId)));
      if (p && p.online === 1 && !p.bot) touch(r);
      return () => {
        if (!r.subscribers.delete(sub)) return;
        if (p && !p.left && !p.bot) {
          p.online = Math.max(0, p.online - 1);
          if (p.online === 0) {
            p.offlineSince = clock.now();
            if (r.game) {
              setAway(r.game, p.id, true, clock.now());
              schedule(r);
            }
            touch(r);
          }
        }
      };
    },

    /**
     * A move or a host's change. Throws GameError (or the rules' RuleError, which has the same shape).
     * @param {string} code
     * @param {unknown} token
     * @param {string} action
     * @param {Record<string, any>} body
     */
    act(code, token, action, body = {}) {
      const r = room(code);
      const p = player(r, token);
      switch (action) {
        case 'settings': {
          requireHost(r, p);
          if (r.phase !== 'lobby') throw new GameError('wrong-phase', 409);
          r.settings = mergeSettings(r.settings, body);
          break;
        }
        case 'avatar': {
          const avatar = cleanAvatar(body.avatar);
          if (!avatar) throw new GameError('avatar');
          p.avatar = avatar;
          break;
        }
        case 'bot': {
          requireHost(r, p);
          if (r.phase !== 'lobby') throw new GameError('wrong-phase', 409);
          if (present(r).filter((q) => q.bot).length >= MAX_BOTS) throw new GameError('too-many-bots', 409);
          addPlayer(r, '', null, true);
          break;
        }
        case 'unbot': {
          requireHost(r, p);
          if (r.phase !== 'lobby') throw new GameError('wrong-phase', 409);
          const bot = present(r).filter((q) => q.bot).at(-1);
          if (bot) r.players.delete(bot.id);
          break;
        }
        case 'kick': {
          requireHost(r, p);
          const target = r.players.get(String(body.player ?? ''));
          if (!target || target.left || target.id === p.id) throw new GameError('no-player', 404);
          removePlayer(r, target);
          return;
        }
        case 'leave':
          removePlayer(r, p);
          return;
        case 'start': {
          requireHost(r, p);
          if (r.phase !== 'lobby') throw new GameError('wrong-phase', 409);
          const { deck, problem } = lobbyDeck(r);
          if (problem) throw new GameError(problem, 409);
          const people = present(r);
          const create = r.settings.mode === 'onenight' ? onenight.createOneNight : classic.createGame;
          r.game = create({ players: people, settings: r.settings, deck, rng, now: clock.now() });
          for (const q of people) if (!q.bot && q.online === 0) setAway(r.game, q.id, true, clock.now());
          r.phase = 'game';
          r.botPending.clear();
          break;
        }
        case 'move': {
          if (!r.game) throw new GameError('wrong-phase', 409);
          ruleAct(r.game, p.id, body, clock.now());
          break;
        }
        case 'control': {
          requireHost(r, p);
          if (!r.game) throw new GameError('wrong-phase', 409);
          control(r.game, body.command, clock.now());
          if (r.game.phase === 'end') r.games++;
          break;
        }
        case 'rematch':
        case 'abort': {
          requireHost(r, p);
          if (!r.game) throw new GameError('wrong-phase', 409);
          if (action === 'rematch' && r.game.phase !== 'end') throw new GameError('wrong-phase', 409);
          clock.clearTimeout(r.timer);
          r.game = null;
          r.phase = 'lobby';
          // Whoever left during the game is gone for good now.
          for (const q of [...r.players.values()]) if (q.left) r.players.delete(q.id);
          break;
        }
        default:
          throw new GameError('not-found', 404);
      }
      schedule(r);
      touch(r);
    },

    /**
     * Housekeeping every few seconds: the host's seat moves on, people who closed the page leave the
     * lobby, empty rooms are forgotten, and a lost timer is caught up.
     */
    tick() {
      const t = clock.now();
      for (const r of [...rooms.values()]) {
        const online = present(r).filter((p) => p.online > 0 && !p.bot);
        if ((!online.length && t - r.touched > EMPTY_TTL) || t - r.touched > IDLE_TTL) {
          forget(r);
          continue;
        }
        const host = r.players.get(r.host);
        if (host && host.online === 0 && host.offlineSince !== null && t - host.offlineSince >= HOST_GRACE) handOver(r);
        if (r.phase === 'lobby') {
          for (const p of present(r)) {
            if (p.id !== r.host && !p.bot && p.online === 0 && p.offlineSince !== null && t - p.offlineSince >= LOBBY_GRACE) removePlayer(r, p);
          }
        }
        if (r.game && r.game.deadline !== null && t >= r.game.deadline + 2000 && advance(r.game, t)) {
          if (r.game.phase === 'end') r.games++;
          schedule(r);
          touch(r);
        }
      }
    },

    /** Stops every timer (shutdown, tests). */
    close() {
      for (const r of rooms.values()) {
        clock.clearTimeout(r.timer);
        r.subscribers.clear();
      }
      rooms.clear();
    },
  };
}

export { RuleError };
export const MIN_PLAYERS = playersRange('classic')[0];

/** A display name: printable, single-spaced, at most LIMITS.name characters. */
export function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  const text = raw
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Co}\p{Cn}]|(?!‍)\p{Cf}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const graphemes = [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  return graphemes.slice(0, LIMITS.name).join('').trim();
}

/** A coat of arms within range, or null. */
export function cleanAvatar(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { field, charge } = /** @type {any} */ (raw);
  if (!Number.isInteger(field) || !Number.isInteger(charge)) return null;
  if (field < 0 || field >= AVATAR.fields || charge < 0 || charge >= AVATAR.charges) return null;
  return { field, charge };
}

/** The settings with a host's changes applied; anything invalid is ignored. */
export function mergeSettings(current, body) {
  const next = { ...current };
  const pick = (key, choices) => {
    if (choices.includes(body?.[key])) next[key] = body[key];
  };
  pick('mode', MODES);
  pick('where', WHERE);
  pick('night', NIGHT_CHOICES);
  pick('debate', DEBATE_CHOICES);
  pick('reveal', REVEAL);
  pick('votes', VOTES);
  pick('tie', TIES);
  pick('firstNight', FIRST_NIGHT);
  pick('seer', SEER);
  for (const key of ['mystery', 'captain', 'parity', 'witchSelf', 'ghosts']) if (typeof body?.[key] === 'boolean') next[key] = body[key];
  if (body && 'deck' in body) next.deck = body.deck === null ? null : cleanDeck(body.deck, next.mode);
  // Switching modes sets the mode's clocks and its suggested deck, unless the same change says otherwise.
  if (next.mode !== current.mode) {
    for (const [key, value] of Object.entries(MODE_DEFAULTS[next.mode])) if (!(body && key in body)) next[key] = value;
  }
  return next;
}

/** The catalogue as the lobby needs it. */
export function catalogue() {
  return ROLE_IDS.map((id) => ({ id, side: ROLES[id].side, weight: ROLES[id].weight, max: ROLES[id].max, exact: ROLES[id].exact ?? null, modes: ROLES[id].modes }));
}
