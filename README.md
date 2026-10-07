# Vollmond

The party game Werewolf for our afternoon meeting, with the app as the narrator: everyone plays,
nobody has to run the game. On a video call or at one table. Live at
[vollmond.ewolution.cloud](https://vollmond.ewolution.cloud).

- **Found a village, share the link.** A village gets a four-letter code (no vowels, so no code
  spells a word), a name made from it ("Schattenhain"), a link like `vollmond.ewolution.cloud/KXPT`
  and a QR code. No accounts: a name and a coat of arms are enough (eight divisions, sixteen charges,
  tap to reroll), and a reload or a locked phone puts you back in your seat with your card.
- **Two ways to play, picked by the host:** *on a call* (the default), where everyone is at their own
  screen and sees the whole village beside their card, and sounds play on every device; or *at one
  table*, where phones keep their card face down until held, stay silent, and a big screen tells the
  story.
- **Two modes:** Classic (nights and days until a side wins) and Quick (30-second nights, 2-minute
  debates, the core roles, no Captain).
- **Ten roles**, each a woodcut drawn for the game (below): Werewolf, Villager, Seer, Witch, Hunter,
  Cupid, Guard, Little Girl, Village Idiot and Elder, plus the Captain, a title the village elects on
  day one (its vote counts twice and breaks ties; dying, it names a successor).
- **The deck** is suggested for the table (one wolf up to six players, two up to eleven, three up to
  sixteen, four beyond; a special role joins at each size, from the Seer at five to the Elder at
  twelve), or built by hand with a needle showing which side it favours. A secret deck hides even
  the list of roles.
- **The host's rules:** the night and debate clocks, a card shown on death (the card, only its side,
  or nothing), open or secret votes, a tie (nobody dies, or a runoff), the Captain, when the wolves win
  (at parity, or only when the village is gone), a calm first night, what the Seer sees (the card or
  only the side), whether the Witch may save herself, and whether the dead see everything.
- **A night:** everyone acts at once, in up to three steps (dusk for Cupid on the first night; the
  night for the wolves, the Seer, the Guard and the Little Girl; the witching hour for the Witch). Every
  player has something to tap, so no screen gives a role away: villagers name a suspect, trust
  someone, or guess who was attacked. The wolves see each other's picks live and can whisper.
- **A day:** dawn announces the night's dead (and turns their cards over), the village debates until
  the clock ends or more than half are ready, then votes. The Hunter shoots when he dies, Lovers die
  together, the Village Idiot survives being voted out, the Elder survives the first bite.
- **The end:** every card turns over, a chronicle tells the game night by night, and four awards go
  out (first to fall, sharpest hunch, most votes against wolves, best bluff). "Another round" keeps
  the village.
- **The big screen** (`/KXPT/screen`): the village for a projector or a shared screen. It watches
  without a seat, so it never holds a card; it fits 1280×720 to 1920×1080 without scrolling, keeps the
  display awake, and speaks the narrator's lines once someone taps "Sound".
- **Bots** fill a table for trying the game alone (marked as bots, random but legal moves).
- **Settings** (the sliders in the bar): General, the same in every ewolution app (Language, Theme),
  then this device's sounds and the narrator's voice. Installs to a home screen.

## How it works

The server holds every village in memory. `server/rules.mjs` is the game itself: a pure state machine
(phases, the night's steps, the resolution order, deaths and what they set off, the wins), with no
clock of its own and a seeded random in the tests. `server/game.mjs` wraps it in rooms: players,
seats, the lobby's settings, the timers, bots. `server/api.mjs` takes moves as small JSON requests and
streams each page its view over Server-Sent Events.

- **One view per player.** Every stream carries a view built for its player (`view()` in
  `server/rules.mjs`): their card, what they've learned, a wolf's pack and its whispers. The big screen's
  stream has no player and never sees a card before the end; CI's smoke test checks exactly that.
  The dead see everything when the host allows it.
- **Why SSE and not WebSockets:** the server pushes one small view per player, moves are a tap every
  few seconds, Node has no WebSocket server built in, and SSE already runs through Cloudflare's tunnel
  (Pulse, Schätzle). The page reconnects by itself with backoff (`src/lib/room.svelte.ts`), and a
  heartbeat every 20 seconds keeps Cloudflare from dropping a quiet stream.
- **A step's end:** a night step ends when everyone it waits for has acted and the pack agrees on a
  name, or when its time runs out (then the most-named victim, a tie broken at random); a step a dead
  role would have acted in still runs. Offline players don't hold a step up. 1.2 seconds pass after
  the last tap, so the screen doesn't snap away.
- **Seats:** joining returns a player id and a secret token, kept in the browser per village. Moves
  carry the token. A host gone for 15 seconds hands the seat on, people who close the page in the
  lobby leave after a minute, an empty village is forgotten after half an hour, and a deploy ends
  every game in progress.
- **The cards** are drawn by `tools/cards/` (`npm run cards` → `public/cards/<role>.svg`): two plates
  like a risograph print, an indigo key block with the carved lines and a fluorescent pink printed over
  it with multiply, a few units off register, on grained paper. A seeded random carves the same lines
  on every build. The names sit on the card as HTML (`src/components/Card.svelte`), so they translate.
- **The look:** Folio's tokens pointed at the cards' paper and indigo (`src/app.css`); every night of a
  game turns the page to night whatever the theme (`:root.night`), with stars and fog on one canvas
  (`src/components/Sky.svelte`). Sounds come from Web Audio, made on the spot (`src/lib/sound.ts`); the
  voice is the browser's own speech synthesis.
- **Visit counts** go to [Census](https://github.com/ewolution94/census): `server/census.mjs` forwards
  `/_e.js` and `/_e` to it over the shared Docker network, adding only `X-Site: vollmond`. Without
  `VOLLMOND_CENSUS` it answers locally and counts nothing.

## Run it

```bash
npm install
npm run dev          # http://localhost:6010, the game server included (6000 is the NAS port)
npm run check        # svelte-check / TypeScript
npm test             # the rules, the rooms, whole games played by bots (Node 24+)
npm run cards        # draws public/cards/*.svg again from tools/cards
npm run build && npm start   # production server on :8080 (or --port 6011)
```

To try a game alone: found a village, add bots in the lobby, deal.

## Deploy (NAS)

This mirrors Schätzle and Aale Spiele:

- `ci.yml` runs the typecheck, the tests and the build, then smoke-tests the production server
  (page, headers, every card, a village with bots dealt, each stream carrying only its own card).
- `docker-publish.yml` gates on `ci.yml`, then pushes `ghcr.io/ewolution94/vollmond:latest` for amd64
  and arm64; only the branch's newest commit publishes.
- The shared Watchtower picks the image up. A push to `release` is the whole deploy, and it ends any
  game in progress: don't push during the afternoon meeting.
- The NAS runs `deploy/portainer-stack.yml`; its port is in the workspace's port registry.
- The stack joins the external Docker network `ewolution`, where Census listens as `census:4901`.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` / `--port` | `8080` | Listen port |
| `HOST` | `0.0.0.0` | Listen address |
| `VOLLMOND_CENSUS` | off | Census's ingest origin, `http://census:4901` on the NAS |

## Project layout

```
server/server.mjs         static files + security headers, wires the rest; no dependencies
server/rules.mjs          the game: phases, roles, resolution, wins, each player's view (no I/O)
server/roles.mjs          the role catalogue, weights, the suggested decks
server/game.mjs           villages, players, seats, settings, timers, bots around the rules
server/bots.mjs           the bots' moves
server/api.mjs            the game over HTTP: JSON moves, one SSE stream per page
server/census.mjs         forwards /_e.js and /_e to Census (visit counts)
src/lib/room.svelte.ts    the live village: the stream, reconnects, moves
src/lib/narrate.ts        the narrator's line for each moment (i18n.svelte.ts holds the words)
src/components/           Home, Join, Lobby, Game → Play (Action, Mine, Village, Moment) and Ending;
                          Screen (the big screen), Card, Shield (coats of arms), Sky
tools/cards/              the woodcut deck: kit.mjs (inks, cuts), figures.mjs, roles/<role>.mjs
public/cards/             the drawn cards (from tools/cards)
public/sw.js              offline shell (never the game's /api/)
brand/                    the mark and app icons (public/icons/ is rendered from them)
vendor/ewo/               Folio's tokens, fonts and elements (npm run vendor -- vollmond in Folio)
```

Grenze Gotisch (`src/fonts/`) is under the SIL Open Font License (`src/fonts/OFL.txt`).
