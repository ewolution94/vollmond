<!--
  The big screen (/<code>/screen): the village for a projector, or for sharing in a call. It watches
  without a seat, so it never sees a secret: the lobby with a big QR code, then the ring, the
  narrator and the big moments, then the end. It fits the screen without scrolling, keeps the display
  awake where the browser allows it, and speaks once someone has tapped "Sound on" (browsers start
  audio only after a tap).
-->
<script lang="ts">
  import { isDark, phaseTitle } from '../lib/phase';
  import { onDestroy, onMount } from 'svelte';
  import { Room } from '../lib/room.svelte';
  import { t, tk } from '../lib/i18n.svelte';
  import { narrate } from '../lib/narrate';
  import { say } from '../lib/prefs.svelte';
  import { play, type Sound } from '../lib/sound';
  import Ending from './Ending.svelte';
  import Moment from './Moment.svelte';
  import Qr from './Qr.svelte';
  import Shield from './Shield.svelte';
  import Village from './Village.svelte';

  let { code }: { code: string } = $props();

  // The page is keyed by its code (App.svelte), so the code never changes under it.
  // svelte-ignore state_referenced_locally
  const room = new Room({ code, player: '', token: '' });
  const view = $derived(room.view);
  const game = $derived(view?.game ?? null);
  const url = $derived(`${location.origin}/${code}`);
  let loud = $state(false);
  let now = $state(Date.now());
  let wake: { release(): Promise<void> } | null = null;

  onMount(() => {
    room.connect();
    const timer = setInterval(() => (now = Date.now()), 250);
    const keepAwake = async () => {
      try {
        wake = await (navigator as unknown as { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen') ?? null;
      } catch {
        wake = null;
      }
    };
    void keepAwake();
    const onVisible = () => document.visibilityState === 'visible' && void keepAwake();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
  onDestroy(() => {
    room.close();
    void wake?.release().catch(() => {});
    document.documentElement.classList.remove('night');
  });

  $effect(() => {
    document.documentElement.classList.toggle('night', isDark(game));
  });

  const SOUND: Partial<Record<string, Sound>> = { dusk: 'night', night: 'night', dawn: 'dawn', vote: 'vote', runoff: 'vote', verdict: 'death', hunter: 'death', end: 'win' };
  let last = '';
  $effect(() => {
    if (!view || !game) return;
    const key = `${view.games}:${game.phase}:${game.night}:${game.day}`;
    if (key === last) return;
    const first = last === '';
    last = key;
    if (first || !loud) return;
    const sound = game.phase === 'night' && game.night === 1 && game.deck?.cupid ? undefined : SOUND[game.phase];
    if (sound) play(sound);
    say(narrate(view));
  });

  const left = $derived(game?.deadline ? room.left(game.deadline, now) : 0);
  const title = $derived(game ? phaseTitle(game) : '');
</script>

<div class="screen">
  {#if !view}
    <p class="wait display">…</p>
  {:else if view.phase === 'gone'}
    <p class="wait display">{t('noRoom')}</p>
  {:else if !game}
    <section class="lobby">
      <div class="join">
        <p class="band">{view.code}</p>
        <h1 class="display">{view.village}</h1>
        <div class="qr"><Qr {url} /></div>
        <p class="scan display">{t('screenJoin')}</p>
        <p class="url">{url.replace(/^https?:\/\//, '')}</p>
      </div>
      <div class="people">
        <p class="label">{t('players')} · {view.players.length}</p>
        <ul>
          {#each view.players as p (p.id)}
            <li><Shield avatar={p.avatar} size={64} /><span>{p.name}</span></li>
          {/each}
        </ul>
        <p class="hint">{t('screenWaiting')}</p>
      </div>
    </section>
  {:else if game.phase === 'end'}
    <Ending {view} {game} screen />
  {:else}
    <section class="stage">
      <div class="side">
        <p class="band">{isDark(game) ? t('night', { n: game.night }) : game.day ? t('day', { n: game.day }) : view.village}</p>
        <h1 class="display">{title}</h1>
        <p class="line">{narrate(view)}</p>
        {#if game.progress && isDark(game)}<p class="label">{t('done', game.progress)}</p>{/if}
        {#if game.paused !== null}<p class="band">{t('paused')}</p>{/if}
      </div>
      <div class="ring"><Village {view} {game} big {left} /></div>
    </section>
    <Moment {view} {game} screen />
  {/if}

  {#if !loud}
    <button class="sound btn secondary" onclick={() => {
      loud = true;
      play('dawn');
    }}>🔊 {t('sounds')}</button>
  {/if}
</div>

<style>
  .screen {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
    padding: 3vh 4vw;
    display: grid;
  }
  .wait {
    place-self: center;
    font-size: 64px;
  }
  .lobby {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: 5vw;
    align-items: center;
  }
  .join {
    display: grid;
    justify-items: center;
    gap: 1.6vh;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: clamp(56px, 9vh, 120px);
    text-shadow: 4px 4px 0 var(--pink);
  }
  .qr {
    width: min(38vh, 380px);
    padding: 14px;
    background: var(--cream);
    border-radius: 16px;
    box-shadow: 6px 6px 0 var(--pink);
  }
  .scan {
    margin: 0;
    font-size: clamp(32px, 5vh, 56px);
  }
  .url {
    margin: 0;
    font: 600 clamp(18px, 2.6vh, 28px)/1.2 var(--ewo-mono);
  }
  .people ul {
    list-style: none;
    margin: 2vh 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 2vh 1.6vw;
  }
  .people li {
    display: grid;
    justify-items: center;
    gap: 8px;
    font: 700 clamp(18px, 2.4vh, 26px)/1.1 var(--ewo-sans);
    text-align: center;
    animation: arrive 0.6s cubic-bezier(0.3, 1.5, 0.5, 1) both;
  }
  @keyframes arrive {
    from {
      translate: 0 20px;
      scale: 0.6;
      opacity: 0;
    }
  }
  .hint {
    color: var(--ink-2);
    font-size: clamp(16px, 2.2vh, 24px);
  }
  .stage {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 4vw;
    align-items: center;
  }
  .side {
    display: grid;
    justify-items: start;
    gap: 2vh;
  }
  /* The small print, sized for a room. */
  .screen :global(.band) {
    font-size: clamp(13px, 1.8vh, 20px);
  }
  .screen :global(.label) {
    font-size: clamp(13px, 1.7vh, 18px);
  }
  .side h1 {
    font-size: clamp(56px, 10vh, 132px);
  }
  .line {
    margin: 0;
    font: 500 clamp(22px, 3.4vh, 38px)/1.4 var(--ewo-serif);
    color: var(--ink-2);
  }
  .ring {
    max-height: 94vh;
  }
  .sound {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 60;
  }
</style>
