<!--
  One village: the lobby, or the game. It also runs what happens around the screen: the page turns to
  night on every night of a game, and each new moment brings its sound and the narrator's line (read
  out where this device speaks). At one table phones stay silent: only the big screen speaks there.
-->
<script lang="ts">
  import { isDark } from '../lib/phase';
  import { onDestroy } from 'svelte';
  import type { Config } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { t } from '../lib/i18n.svelte';
  import { narrate } from '../lib/narrate';
  import { prefs, say } from '../lib/prefs.svelte';
  import { play, type Sound } from '../lib/sound';
  import Lobby from './Lobby.svelte';
  import Play from './Play.svelte';

  let { room, config, onleave, onrejoin }: { room: Room; config: Config | null; onleave: () => void; onrejoin: () => void } = $props();

  const view = $derived(room.view);
  const game = $derived(view?.game ?? null);
  const seated = $derived(Boolean(view?.players.some((p) => p.id === room.seat.player)));

  // Removed from the village (kicked, or dropped from the lobby): back to the name form.
  $effect(() => {
    if (view && view.phase !== 'gone' && !seated) onrejoin();
  });

  $effect(() => {
    document.documentElement.classList.toggle('night', isDark(game));
  });
  onDestroy(() => document.documentElement.classList.remove('night'));

  // Each new moment: its sound and its line, once.
  const SOUND: Partial<Record<string, Sound>> = { dusk: 'night', night: 'night', dawn: 'dawn', vote: 'vote', runoff: 'vote', verdict: 'death', hunter: 'death', end: 'win' };
  let lastMoment = '';
  $effect(() => {
    if (!view || !game) return;
    const key = `${view.games}:${game.phase}:${game.night}:${game.day}`;
    if (key === lastMoment) return;
    const first = lastMoment === '';
    lastMoment = key;
    if (first) return;
    if (view.settings.where !== 'call') return;
    // The first night howls at dusk (Cupid's step) and not again when the wolves wake.
    const sound = game.phase === 'night' && game.night === 1 && game.deck?.cupid ? undefined : SOUND[game.phase];
    if (prefs.sounds && sound) play(sound);
    if (prefs.voice) say(narrate(view));
  });
</script>

{#if !view}
  <p class="loading display">…</p>
{:else if view.phase === 'gone'}
  <section class="gone">
    <h1 class="display">{t('noRoom')}</h1>
    <button class="btn secondary" onclick={onleave}>{t('back')}</button>
  </section>
{:else if view.phase === 'lobby' || !game}
  <Lobby {room} {view} {config} {onleave} />
{:else}
  <Play {room} {view} {game} {onleave} />
{/if}

<style>
  .loading {
    padding-top: 30vh;
    text-align: center;
    font-size: 48px;
  }
  .gone {
    display: grid;
    justify-items: center;
    gap: 16px;
    padding-top: 20vh;
    text-align: center;
  }
  .gone h1 {
    margin: 0;
  }
</style>
