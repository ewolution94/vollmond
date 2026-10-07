// The server's shapes (server/game.mjs → viewFor, server/rules.mjs → view) and the calls that
// change them.

export type RoleId = 'werewolf' | 'villager' | 'seer' | 'witch' | 'hunter' | 'cupid' | 'guard' | 'girl' | 'idiot' | 'elder';
export type Side = 'village' | 'wolves';
export type RoomPhase = 'lobby' | 'game' | 'gone';
export type GamePhase =
  | 'deal'
  | 'dusk'
  | 'night'
  | 'witch'
  | 'dawn'
  | 'hunter'
  | 'successor'
  | 'election'
  | 'debate'
  | 'vote'
  | 'runoff'
  | 'verdict'
  | 'end';
export type Mode = 'classic' | 'quick';
export type Where = 'call' | 'table';
export type Deck = Partial<Record<RoleId, number>>;

export interface Settings {
  mode: Mode;
  where: Where;
  /** null: the suggested deck for the table */
  deck: Deck | null;
  mystery: boolean;
  night: number;
  /** seconds; 0 is open */
  debate: number;
  reveal: 'role' | 'side' | 'none';
  votes: 'open' | 'secret';
  tie: 'none' | 'runoff';
  captain: boolean;
  parity: boolean;
  firstNight: 'hunt' | 'calm';
  seer: 'role' | 'side';
  witchSelf: boolean;
  ghosts: boolean;
}

export interface Avatar {
  field: number;
  charge: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: Avatar;
  bot: boolean;
  online: boolean;
}

export interface LobbyDeck {
  suggested: Deck;
  deck: Deck;
  balance: number;
  size: number;
  /** too-few, deck-size, no-wolves, too-many-wolves, or null */
  problem: string | null;
}

export type PromptKind =
  | 'ready'
  | 'cupid'
  | 'trust'
  | 'wolf'
  | 'seer'
  | 'guard'
  | 'girl'
  | 'suspect'
  | 'witch'
  | 'guess'
  | 'shoot'
  | 'successor'
  | 'captain'
  | 'hurry'
  | 'vote';

export interface Prompt {
  kind: PromptKind;
  options?: string[];
  /** witch */
  victim?: string | null;
  heal?: boolean;
  poison?: boolean;
}

export interface Seat {
  id: string;
  alive: boolean;
  role: RoleId | null;
  side: Side | null;
  idiot: boolean;
  voter: boolean;
  died: { cause: string; night: number; day: number } | null;
  acted: boolean | null;
  lover: string | null;
}

export interface Knowledge {
  type: 'pack' | 'seen' | 'lover' | 'bound' | 'glimpse' | 'spotted';
  night: number;
  target?: string;
  role?: RoleId;
  side?: Side;
  partner?: string;
  a?: string;
  b?: string;
  wolf?: string | null;
  caught?: boolean;
  girl?: string;
}

export interface Me {
  id: string;
  role: RoleId;
  side: Side;
  alive: boolean;
  voter: boolean;
  lover: string | null;
  prompt: Prompt | null;
  act: { target?: string | null; a?: string; b?: string; heal?: boolean; poison?: string | null; peek?: boolean } | null;
  hurried: boolean;
  knowledge: Knowledge[];
  pack: { id: string; alive: boolean; pick: string | null }[] | null;
  chat: { from: string; text: string; at: number; night: number }[] | null;
  potions: { heal: boolean; poison: boolean } | null;
  guarded: string | null;
}

export interface Death {
  id: string;
  cause: string;
  role: RoleId | null;
  side: Side | null;
}

export interface LogEntry {
  type: string;
  night?: number;
  day?: number;
  [key: string]: unknown;
}

export interface Game {
  phase: GamePhase;
  night: number;
  day: number;
  deadline: number | null;
  paused: number | null;
  captain: string | null;
  deck: Deck | null;
  powersLost: boolean;
  seats: Seat[];
  progress: { done: number; total: number } | null;
  votes: Record<string, string | null> | null;
  runoff: string[] | null;
  morning: Death[];
  verdict: {
    out: string | null;
    votes: Record<string, string | null>;
    tally: Record<string, number>;
    tie: string[] | null;
    idiot: boolean;
    shot: string | null;
    role: RoleId | null;
  } | null;
  task: { kind: 'hunter' | 'successor'; id: string } | null;
  winner: { side: 'village' | 'wolves' | 'lovers' | 'none'; players: string[] } | null;
  awards: { id: 'first' | 'sharp' | 'aim' | 'bluff'; player: string; count?: number }[] | null;
  log: LogEntry[] | null;
  me: Me | null;
  ghost: { acts: Record<string, { kind?: string; target?: string | null }>; tonight: Record<string, unknown> | null } | null;
}

export interface View {
  code: string;
  village: string;
  phase: RoomPhase;
  version: number;
  host: string;
  settings: Settings;
  notice: string | null;
  players: Player[];
  lobby: LobbyDeck | null;
  game: Game | null;
  games: number;
  now: number;
}

export interface SeatTicket {
  code: string;
  player: string;
  token: string;
}

export interface Config {
  roles: { id: RoleId; side: Side; weight: number; max: number }[];
  minPlayers: number;
  maxPlayers: number;
  maxBots: number;
  avatar: { fields: number; charges: number };
  choices: {
    mode: Mode[];
    where: Where[];
    night: number[];
    debate: number[];
    reveal: Settings['reveal'][];
    votes: Settings['votes'][];
    tie: Settings['tie'][];
    firstNight: Settings['firstNight'][];
    seer: Settings['seer'][];
  };
  defaults: Settings;
}

/** A refusal from the server ("no-room", "not-host" …) or a network failure ("offline"). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status = 0,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: 'no-store' });
  } catch {
    // Safari says "Load failed", Chrome "Failed to fetch": classify by type (learnings/ios-and-webkit.md).
    throw new ApiError('offline');
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error ?? `http-${response.status}`, response.status);
  return body as T;
}

const post = (body: unknown, token?: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(token ? { 'x-vollmond-token': token } : {}) },
  body: JSON.stringify(body ?? {}),
});

export const api = {
  config: () => request<Config>('/api/config'),
  create: (name: string, avatar: Avatar | null) => request<SeatTicket>('/api/rooms', post({ name, avatar })),
  info: (code: string) => request<{ code: string; village: string; phase: RoomPhase; players: number; full: boolean }>(`/api/rooms/${code}`),
  join: (code: string, name: string, avatar: Avatar | null, token?: string) =>
    request<SeatTicket>(`/api/rooms/${code}/join`, post({ name, avatar, token })),
  act: (seat: SeatTicket, action: string, body?: unknown) => request<void>(`/api/rooms/${seat.code}/${action}`, post(body, seat.token)),
};

/** Room codes: four consonants (server/game.mjs → CODE). */
export const CODE = /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/;
