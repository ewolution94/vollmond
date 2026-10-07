<script lang="ts">
  import { onMount } from 'svelte';
  import { api, ApiError, CODE, type Config, type SeatTicket } from './lib/api';
  import { Room } from './lib/room.svelte';
  import { forgetSeat, saveName, savedSeat, saveSeat } from './lib/session';
  import { loadCensus } from './lib/census';
  import Sky from './components/Sky.svelte';
  import Bar from './components/Bar.svelte';
  import Home from './components/Home.svelte';
  import Join from './components/Join.svelte';
  import Game from './components/Game.svelte';
  import Screen from './components/Screen.svelte';

  // The whole app is one page. "/" is the start; "/KXPT" is a village, and the link people share;
  // "/KXPT/screen" is that village on the big screen.
  let path = $state(location.pathname);
  const code = $derived(codeFrom(path));
  const screenCode = $derived(screenFrom(path));
  let room: Room | null = $state.raw(null);
  let config: Config | null = $state.raw(null);
  let reclaiming = $state(false);

  function codeFrom(p: string) {
    const segment = p.replace(/^\/+|\/+$/g, '').toUpperCase();
    return CODE.test(segment) ? segment : null;
  }

  function screenFrom(p: string) {
    const match = /^\/([a-z]{4})\/screen\/?$/i.exec(p);
    return match && CODE.test(match[1].toUpperCase()) ? match[1].toUpperCase() : null;
  }

  function go(to: string, replace = false) {
    if (location.pathname !== to) history[replace ? 'replaceState' : 'pushState'](null, '', to);
    path = to;
  }

  function enter(seat: SeatTicket) {
    saveSeat(seat);
    room?.close();
    room = new Room(seat);
    room.connect();
    go(`/${seat.code}`);
  }

  function leaveRoom() {
    if (room) forgetSeat(room.seat.code);
    room?.close();
    room = null;
    go('/');
  }

  /** Removed from a village (kicked, or gone too long in the lobby): ask for a name again. */
  function rejoin() {
    if (room) forgetSeat(room.seat.code);
    room?.close();
    room = null;
  }

  async function reclaim(c: string) {
    const seat = savedSeat(c);
    if (!seat) return;
    reclaiming = true;
    try {
      enter(await api.join(c, '', null, seat.token));
    } catch (error) {
      if (error instanceof ApiError && error.code !== 'offline') forgetSeat(c);
    } finally {
      reclaiming = false;
    }
  }

  $effect(() => {
    if (room && room.seat.code !== code) {
      room.close();
      room = null;
    }
    if (code && !room) void reclaim(code);
  });

  onMount(() => {
    if (!code && !screenCode && path !== '/') go('/', true);
    const onPop = () => (path = location.pathname);
    addEventListener('popstate', onPop);
    api.config().then((c) => (config = c), () => {});
    loadCensus();
    return () => removeEventListener('popstate', onPop);
  });
</script>

<Sky />
{#if screenCode}
  {#key screenCode}
    <Screen code={screenCode} />
  {/key}
{:else}
  <Bar code={room ? room.seat.code : null} village={room?.view?.village ?? null} />
  <main>
    {#if room}
      <Game {room} {config} onleave={leaveRoom} onrejoin={rejoin} />
    {:else if code}
      {#if !reclaiming}
        <Join
          {code}
          onjoin={(seat, name) => {
            saveName(name);
            enter(seat);
          }}
          onback={() => go('/')}
        />
      {/if}
    {:else}
      <Home
        oncreate={(seat, name) => {
          saveName(name);
          enter(seat);
        }}
        onjoin={(c) => go(`/${c}`)}
      />
    {/if}
  </main>
{/if}

<style>
  main {
    position: relative;
    z-index: 1;
    max-width: var(--page);
    min-height: calc(100dvh - var(--bar-h));
    margin: 0 auto;
    padding: 8px var(--gutter) 64px;
  }
  @media not (display-mode: standalone) {
    @supports (-webkit-touch-callout: none) {
      main {
        padding-bottom: 104px;
      }
    }
  }
</style>
