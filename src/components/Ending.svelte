<!--
  The end: who won, every card turning over one after another, the awards, and the chronicle of the
  whole game, night by night. The host starts the next round from here.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Game, LogEntry, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { narrate } from '../lib/narrate';
  import Card from './Card.svelte';
  import Shield from './Shield.svelte';

  let { room = null, view, game, onleave, screen = false }: { room?: Room | null; view: View; game: Game; onleave?: () => void; screen?: boolean } = $props();

  const side = $derived(game.winner?.side ?? 'none');
  const won = $derived(Boolean(game.me && game.winner?.players.includes(game.me.id)));
  const isHost = $derived(Boolean(room && view.host === room.seat.player));
  const name = (id: unknown) => view.players.find((p) => p.id === id)?.name ?? '?';
  const player = (id: string) => view.players.find((p) => p.id === id);

  // The cards turn over one by one.
  let turnedUpTo = $state(-1);
  onMount(() => {
    const timer = setInterval(() => {
      turnedUpTo++;
      if (turnedUpTo >= game.seats.length) clearInterval(timer);
    }, 260);
    return () => clearInterval(timer);
  });

  function entry(e: LogEntry): string | null {
    const v = (k: string) => e[k];
    switch (e.type) {
      case 'cupid':
        return t('log:cupid', { a: name(v('a')), b: name(v('b')) });
      case 'wolves':
        return t('log:wolves', { target: name(v('target')) });
      case 'guard':
        return t('log:guard', { target: name(v('target')) });
      case 'seer':
        return t('log:seer', { target: name(v('target')), role: tk(`role:${v('role')}`) });
      case 'heal':
        return t('log:heal', { target: name(v('target')) });
      case 'poison':
        return t('log:poison', { target: name(v('target')) });
      case 'girl':
        return v('peek') ? (v('caught') ? t('log:girlCaught') : t('log:girl', { wolf: name(v('wolf')) })) : null;
      case 'elder':
        return t('log:elder');
      case 'death':
        return t('log:death', { id: name(v('id')), cause: tk(`cause:${v('cause')}`) });
      case 'shot':
        return v('target') ? t('log:shot', { target: name(v('target')) }) : null;
      case 'election':
      case 'captain':
        return t('log:captain', { id: name(v('id')) });
      case 'vote':
        return v('out') ? t('log:vote', { out: name(v('out')) }) : v('runoff') || v('tie') ? null : t('log:voteNone');
      case 'idiot':
        return t('log:idiot', { id: name(v('id')) });
      case 'powers-lost':
        return t('log:powers-lost');
      case 'quiet':
        return t('log:quiet');
      default:
        return null;
    }
  }

  /** The chronicle in chapters: Night 1, Day 1, Night 2 … */
  const chapters = $derived.by(() => {
    const out: { title: string; lines: string[] }[] = [];
    let current: { title: string; lines: string[] } | null = null;
    for (const e of game.log ?? []) {
      const isDay = ['vote', 'election', 'idiot'].includes(e.type) || (e.type === 'death' && e.cause === 'vote') || ((e.type === 'shot' || e.type === 'captain') && (e.day ?? 0) >= (e.night ?? 0) && (e.day ?? 0) > 0);
      const title = isDay ? t('day', { n: e.day ?? 0 }) : t('night', { n: e.night ?? 0 });
      const line = entry(e);
      if (!line) continue;
      if (!current || current.title !== title) {
        current = { title, lines: [] };
        out.push(current);
      }
      current.lines.push(line);
    }
    return out;
  });

  let busy = $state(false);
  let error = $state('');
  async function rematch() {
    if (!room) return;
    busy = true;
    try {
      await room.act('rematch');
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    } finally {
      busy = false;
    }
  }
</script>

<section class="end" class:screen>
  <header>
    {#if game.me}<p class="band">{won ? t('youWon') : t('youLost')}</p>{/if}
    <h1 class="display">{tk(`win:${side}`)}</h1>
    <p class="line">{narrate(view)}</p>
  </header>

  <div class="cards">
    {#each game.seats as s, i (s.id)}
      {@const p = player(s.id)}
      <figure class:winner={game.winner?.players.includes(s.id)} class:gone={!s.alive}>
        <Card role={s.role} face={i <= turnedUpTo ? 'front' : 'back'} width={screen ? '150px' : '112px'} dead={!s.alive} />
        <figcaption>
          {#if p}<Shield avatar={p.avatar} size={20} />{/if}
          <span>{p?.name}</span>
        </figcaption>
      </figure>
    {/each}
  </div>

  {#if game.awards?.length}
    <div class="awards">
      <h2 class="label">{t('awards')}</h2>
      <ul>
        {#each game.awards as a (a.id)}
          {@const p = player(a.player)}
          <li class="plate">
            <span class="badge display">{tk(`award:${a.id}`)}</span>
            <span class="who">{#if p}<Shield avatar={p.avatar} size={26} />{/if}{p?.name}</span>
            {#if a.count !== undefined && a.id !== 'first'}<span class="hint">{tk(`awardHint:${a.id}`, { n: a.count })}</span>{/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if !screen}
    <details class="plate chronicle">
      <summary class="label">{t('chronicle')}</summary>
      {#each chapters as c, i (i)}
        <h3 class="display">{c.title}</h3>
        <ul>{#each c.lines as l, j (j)}<li>{l}</li>{/each}</ul>
      {/each}
    </details>

    <footer class="go">
      {#if isHost}
        <button class="btn primary big" disabled={busy} onclick={rematch}>{t('rematch')}</button>
      {:else}
        <p class="hint">{t('waitRematch', { name: name(view.host) })}</p>
      {/if}
      {#if error}<p class="error">{error}</p>{/if}
      {#if onleave}<button class="btn quiet" onclick={onleave}>{t('leave')}</button>{/if}
    </footer>
  {/if}
</section>

<style>
  .end {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 26px;
    padding-top: 8px;
  }
  header {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: clamp(52px, 12vw, 104px);
    text-shadow: 4px 4px 0 var(--pink);
    text-wrap: balance;
    animation: stamp 0.7s cubic-bezier(0.3, 1.6, 0.4, 1) both;
  }
  @keyframes stamp {
    from {
      scale: 1.6;
      opacity: 0;
      rotate: -4deg;
    }
  }
  .line {
    margin: 0;
    max-width: 44ch;
    font: 500 18px/1.45 var(--ewo-serif);
    color: var(--ink-2);
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
  }
  figure {
    margin: 0;
    display: grid;
    justify-items: center;
    gap: 6px;
  }
  figure.winner :global(.card) {
    filter: drop-shadow(4px 4px 0 var(--pink));
  }
  figcaption {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 120px;
    font-weight: 650;
    font-size: 14px;
  }
  figcaption span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gone figcaption {
    opacity: 0.6;
  }
  .awards ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }
  .awards li {
    display: grid;
    gap: 6px;
    padding: 14px;
  }
  .badge {
    font-size: 24px;
    color: var(--pink-text);
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 650;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: 14px;
  }
  .chronicle {
    padding: 16px 18px;
  }
  .chronicle summary {
    cursor: pointer;
  }
  .chronicle h3 {
    margin: 14px 0 4px;
    font-size: 24px;
  }
  .chronicle ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 3px;
  }
  .go {
    display: grid;
    justify-items: center;
    gap: 8px;
  }
  .big {
    min-width: min(100%, 320px);
    min-height: 56px;
    font-size: 18px;
  }
  .screen h1 {
    font-size: 120px;
  }
  @media (prefers-reduced-motion: reduce) {
    h1 {
      animation: none;
    }
  }
</style>
