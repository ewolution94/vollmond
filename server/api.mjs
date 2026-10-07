// The game over HTTP: JSON for moves, Server-Sent Events for the live room.
//
//   GET  /api/config                        choices, defaults and the role catalogue for the lobby
//   POST /api/rooms            {name, avatar?}    a new room; you're its host → {code, player, token}
//   GET  /api/rooms/:code                   does it exist → {code, village, phase, players, full}
//   POST /api/rooms/:code/join {name, avatar?, token?}   a seat (the same one again with your token)
//   GET  /api/rooms/:code/events?p=<id>     your view of the room, now and after every change (SSE)
//   GET  /api/rooms/:code/events            without `p`: the big screen's view, which holds no secrets
//   POST /api/rooms/:code/<action>          settings, start, move, control, rematch, abort, bot, unbot,
//                                           kick, leave, avatar; your token in `x-vollmond-token`
//
// Why SSE and not WebSockets: the server pushes one small JSON view per player, moves are a tap
// every few seconds, Node has no WebSocket server built in, and SSE already runs through
// Cloudflare's tunnel for Pulse and Schätzle. Each stream carries only what its player may know:
// a card, a night's result or the pack's whispers never reach anyone else's page.
//
// Errors are `{ "error": "<code>" }` with a status; the client words them.

import {
  AVATAR, DEBATE_CHOICES, DEFAULT_SETTINGS, FIRST_NIGHT, GameError, LIMITS, MAX_BOTS, MODES, NIGHT_CHOICES,
  REVEAL, RuleError, SEER, TIES, VOTES, WHERE, catalogue,
} from './game.mjs';
import { MIN_PLAYERS, ONE_NIGHT } from './roles.mjs';

const MAX_BODY = 4096;
/** Cloudflare drops a stream that's quiet for 100 s. */
const HEARTBEAT = 20_000;
const ROOM_PATH = /^\/api\/rooms\/([A-Za-z]{4})(?:\/([a-z]+))?$/;

/**
 * @param {{ games: ReturnType<typeof import('./game.mjs').createGames> }} options
 */
export function createApi({ games }) {
  /** @type {Set<import('node:http').ServerResponse>} */
  const streams = new Set();

  function json(res, status, body) {
    const text = body === undefined ? '' : JSON.stringify(body);
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(text),
    });
    res.end(text);
  }

  async function readJson(req) {
    if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) throw new GameError('json', 415);
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) throw new GameError('too-large', 413);
      chunks.push(chunk);
    }
    if (!size) return {};
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      return body && typeof body === 'object' ? body : {};
    } catch {
      throw new GameError('json');
    }
  }

  function events(req, res, code, playerId) {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write('retry: 4000\n\n');
    streams.add(res);
    let unsubscribe = () => {};
    const send = (data) => {
      if (!res.writableEnded) res.write(`data: ${data}\n\n`);
    };
    try {
      unsubscribe = games.subscribe(code, playerId, send);
    } catch {
      send(JSON.stringify({ code: String(code).toUpperCase(), phase: 'gone' }));
      streams.delete(res);
      res.end();
      return;
    }
    const beat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT);
    beat.unref?.();
    const done = () => {
      clearInterval(beat);
      streams.delete(res);
      unsubscribe();
    };
    req.on('close', done);
    res.on('error', done);
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @returns {Promise<boolean>} true when the request was ours (anything under /api/)
   */
  async function handle(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return false;

    try {
      if (pathname === '/api/config') {
        if (req.method !== 'GET') throw new GameError('method', 405);
        json(res, 200, {
          roles: catalogue(),
          minPlayers: MIN_PLAYERS,
          oneNight: ONE_NIGHT,
          maxPlayers: LIMITS.players,
          maxBots: MAX_BOTS,
          avatar: AVATAR,
          choices: {
            mode: MODES,
            where: WHERE,
            night: NIGHT_CHOICES,
            debate: DEBATE_CHOICES,
            reveal: REVEAL,
            votes: VOTES,
            tie: TIES,
            firstNight: FIRST_NIGHT,
            seer: SEER,
          },
          defaults: DEFAULT_SETTINGS,
        });
        return true;
      }

      if (pathname === '/api/rooms') {
        if (req.method !== 'POST') throw new GameError('method', 405);
        const body = await readJson(req);
        json(res, 201, games.create({ name: body.name, avatar: body.avatar }));
        return true;
      }

      const match = ROOM_PATH.exec(pathname);
      if (!match) throw new GameError('not-found', 404);
      const [, code, action] = match;

      if (!action) {
        if (req.method !== 'GET') throw new GameError('method', 405);
        const info = games.info(code);
        if (!info) throw new GameError('no-room', 404);
        json(res, 200, info);
        return true;
      }

      if (action === 'events') {
        if (req.method !== 'GET') throw new GameError('method', 405);
        events(req, res, code, url.searchParams.get('p'));
        return true;
      }

      if (req.method !== 'POST') throw new GameError('method', 405);
      const body = await readJson(req);
      if (action === 'join') {
        json(res, 200, games.join(code, { name: body.name, avatar: body.avatar, token: body.token }));
        return true;
      }
      games.act(code, req.headers['x-vollmond-token'], action, body);
      res.writeHead(204, { 'cache-control': 'no-store' }).end();
      return true;
    } catch (error) {
      if (error instanceof GameError || error instanceof RuleError) {
        if (!res.headersSent) json(res, error.status, { error: error.code });
        return true;
      }
      throw error;
    }
  }

  return {
    handle,
    /** Ends every open stream, so shutdown doesn't wait for them (learnings/node-server.md). */
    close() {
      for (const res of streams) res.end();
      streams.clear();
    },
  };
}
