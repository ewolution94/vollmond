<!--
  A game, as one player sees it. The stage across the top (the phase, the narrator's line, the host's
  controls), then the village ring beside what you do now, your card and what you know. On a phone
  the action comes first. The big moments (night falls, dawn, the verdict) play over it all.
-->
<script lang="ts">
  import { isDark, phaseTitle } from '../lib/phase';
  import { onMount } from 'svelte';
  import type { Game, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { narrate } from '../lib/narrate';
  import { actAt } from '../lib/waits';
  import Action from './Action.svelte';
  import Ending from './Ending.svelte';
  import Mine from './Mine.svelte';
  import Moment from './Moment.svelte';
  import Village from './Village.svelte';

  let { room, view, game, onleave }: { room: Room; view: View; game: Game; onleave: (from?: Event) => void } = $props();

  const isHost = $derived(view.host === room.seat.player);
  const me = $derived(game.me);
  const night = $derived(isDark(game));
  const title = $derived(phaseTitle(game));
  const line = $derived(narrate(view));

  // The clock ticks here, once a second, for the ring and the stage.
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(timer);
  });
  const left = $derived(game.deadline ? room.left(game.deadline, now) : 0);

  // What you may pick on the ring right now (the action panel holds the same choice).
  let picks: string[] = $state([]);
  const pickable = $derived(me?.prompt?.options ?? []);
  let ringPick: ((id: string) => void) | null = $state(null);

  // A new question brings the action into view (on a phone the ring may be on screen instead); the
  // game's start brings the page to the top.
  let actionBox: HTMLElement | undefined = $state();
  let asked = '';
  $effect(() => {
    const key = `${game.phase}:${game.night}:${game.day}:${me?.prompt?.kind ?? ''}`;
    if (key === asked) return;
    const first = asked === '';
    asked = key;
    if (first) {
      scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (!me?.prompt || !actionBox) return;
    const r = actionBox.getBoundingClientRect();
    if (r.top < 60 || r.top > innerHeight * 0.6) actionBox.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

  let error = $state('');
  /** The host's pause, resume and skip, waited for at the button. Ending the game is in the settings sheet. */
  async function control(command: string, from: Event) {
    try {
      await actAt(room, 'control', { command }, from);
      error = '';
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    }
  }
</script>

{#if game.phase === 'end'}
  <Ending {room} {view} {game} {onleave} />
{:else}
  <section class="play" class:night>
    <header class="stage">
      <div class="when">
        <span class="band">{night ? t('night', { n: game.night }) : game.day ? t('day', { n: game.day }) : view.village}</span>
        {#if game.paused !== null}<span class="band paused">{t('paused')}</span>{/if}
        {#if game.progress && night}<span class="label">{t('done', game.progress)}</span>{/if}
      </div>
      <h1 class="display">{title}</h1>
      {#if line}<p class="line">{line}</p>{/if}
      {#if view.settings.where === 'call' && (night || game.phase === 'dawn' || (game.mode === 'onenight' && game.phase === 'debate'))}
        <p class="mics">{night ? t('micsOff') : t('micsOn')}</p>
      {/if}
      {#if isHost}
        <div class="host">
          {#if game.paused !== null}
            <button class="btn secondary small" onclick={(e) => control('resume', e)}>▶ {t('resume')}</button>
          {:else if game.deadline}
            <button class="btn secondary small" onclick={(e) => control('pause', e)}>❚❚ {t('pause')}</button>
          {/if}
          {#if ['debate', 'dawn', 'verdict', 'deal'].includes(game.phase)}
            <button class="btn secondary small" onclick={(e) => control('next', e)}>{t('skip')} →</button>
          {/if}
        </div>
      {/if}
      {#if error}<p class="error" role="alert">{error}</p>{/if}
    </header>

    <div class="board">
      <div class="side" bind:this={actionBox}>
        <Action {room} {view} {game} {left} bind:picks bind:ringPick />
        <Mine {view} {game} {room} />
      </div>
      <div class="ring">
        <Village {view} {game} me={room.seat.player} options={ringPick ? pickable : []} picked={picks} onpick={(id) => ringPick?.(id)} {left} />
      </div>
    </div>
  </section>
  <Moment {view} {game} />
{/if}

<style>
  .play {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  .stage {
    display: grid;
    gap: 6px;
    padding-top: 6px;
  }
  .when {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .paused {
    background: var(--fill-ink);
    color: var(--on-fill-ink);
  }
  h1 {
    margin: 0;
    font-size: clamp(40px, 8vw, 68px);
    text-shadow: 3px 3px 0 var(--pink);
    text-wrap: balance;
  }
  .line {
    margin: 0;
    max-width: 52ch;
    font: 500 17px/1.45 var(--ewo-serif);
    color: var(--ink-2);
  }
  .mics {
    margin: 2px 0 0;
    width: fit-content;
    padding: 4px 10px;
    border: 1.5px dashed var(--pink-text);
    border-radius: 99px;
    color: var(--pink-text);
    font: 700 12px/1.2 var(--ewo-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .host {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .small {
    min-height: 36px;
    padding: 0 12px;
    font-size: 14px;
  }
  .board {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .side {
    scroll-margin-top: calc(var(--bar-h) + 12px);
    display: grid;
    gap: 16px;
    align-content: start;
    min-width: 0;
  }
  .ring {
    min-width: 0;
  }
  @media (min-width: 960px) {
    .board {
      grid-template-columns: minmax(340px, 0.85fr) minmax(0, 1.15fr);
      align-items: start;
    }
    .ring {
      position: sticky;
      top: calc(var(--bar-h) + 12px);
    }
  }
</style>
