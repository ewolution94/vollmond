<!--
  The end: who won, every card turning over one after another, the awards, and the chronicle of the
  whole game, night by night. The host starts the next round from here.
  One night shows each card as it ended, what was dealt where it changed, every vote, and the middle.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Game, LogEntry, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { listNames, narrate } from '../lib/narrate';
  import Card from './Card.svelte';
  import Shield from './Shield.svelte';

  let { room = null, view, game, onleave, screen = false }: { room?: Room | null; view: View; game: Game; onleave?: () => void; screen?: boolean } = $props();

  const side = $derived(game.winner?.side ?? 'none');
  const oneNight = $derived(game.mode === 'onenight');
  /** One night can have two winners (the village and the Tanner) or none at all. */
  const title = $derived(
    oneNight ? (game.winner?.sides?.length ? game.winner.sides.map((x) => tk(`win:${x}`)).join(' ') : t('win:nobody')) : tk(`win:${side}`),
  );
  const role = (id: unknown) => (id ? tk(`role:${id}`) : '?');
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
        if (oneNight) {
          const dead = (v('dead') as string[]) ?? [];
          return dead.length ? t('log:onevote', { dead: listNames(dead.map(name)) }) : t('log:onevoteNone');
        }
        return v('out') ? t('log:vote', { out: name(v('out')) }) : v('runoff') || v('tie') ? null : t('log:voteNone');
      case 'idiot':
        return t('log:idiot', { id: name(v('id')) });
      case 'powers-lost':
        return t('log:powers-lost');
      case 'quiet':
        return t('log:quiet');
      case 'thief':
        return v('took') ? t('log:thief', { took: role(v('took')) }) : t('log:thiefKept');
      case 'model':
        return t('log:model', { target: name(v('target')) });
      case 'fox':
        return t('log:fox', { target: name(v('target')), found: t(v('found') ? 'log:foxYes' : 'log:foxNo') });
      case 'raven':
        return t('log:raven', { target: name(v('target')) });
      case 'charm':
        return t('log:charm', { targets: listNames(((v('targets') as string[]) ?? []).map(name)) });
      case 'second':
        return t('log:second', { target: name(v('target')) });
      case 'white':
        return t('log:white', { target: name(v('target')) });
      case 'infect':
        return t('log:infect', { id: name(v('id')) });
      case 'scapegoat':
        return t('log:scapegoat', { id: name(v('id')) });
      case 'judge':
        return t('log:judge');
      case 'growl':
        return v('growl') ? t('log:growl') : null;
      // One night
      case 'lone':
        return t('log:lone', { card: role(v('card')) });
      case 'look':
        return t('log:look', {
          what: v('target') ? `${name(v('target'))} (${role(v('card'))})` : listNames(((v('cards') as string[]) ?? []).map(role)),
        });
      case 'rob':
        return t('log:rob', { target: name(v('target')), card: role(v('card')) });
      case 'swap':
        return t('log:swap', { a: name(v('a')), b: name(v('b')) });
      case 'drink':
        return t('log:drink', { n: Number(v('index') ?? 0) + 1 });
      case 'woke':
        return t('log:woke', { card: role(v('card')) });
      default:
        return null;
    }
  }

  /** The chronicle in chapters: Night 1, Day 1, Night 2 … */
  const chapters = $derived.by(() => {
    const out: { title: string; lines: string[] }[] = [];
    let current: { title: string; lines: string[] } | null = null;
    for (const e of game.log ?? []) {
      const isDay = ['vote', 'election', 'idiot', 'scapegoat', 'judge'].includes(e.type) || (e.type === 'death' && e.cause === 'vote') || ((e.type === 'shot' || e.type === 'captain') && (e.day ?? 0) >= (e.night ?? 0) && (e.day ?? 0) > 0);
      const title = isDay ? t('day', { n: e.day ?? 1 }) : t('night', { n: e.night ?? 1 });
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
    <h1 class="display">{title}</h1>
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
          {#if oneNight}
            {#if s.dealt && s.dealt !== s.role}<small class="was">{t('dealtAs', { role: role(s.dealt) })}</small>{/if}
            {#if game.votes?.[s.id]}<small class="vote">→ {name(game.votes[s.id])}</small>{/if}
          {/if}
        </figcaption>
      </figure>
    {/each}
  </div>

  {#if oneNight && game.center}
    <div class="middle">
      <h2 class="label">{t('theMiddle')}</h2>
      <div class="cards">
        {#each game.center.now as card, i (i)}
          <figure>
            <Card role={card} face={turnedUpTo >= game.seats.length ? 'front' : 'back'} width={screen ? '120px' : '92px'} />
            <figcaption>
              <span>{t('middleCard', { n: i + 1 })}</span>
              {#if game.center.dealt[i] !== card}<small class="was">{t('dealtAs', { role: role(game.center.dealt[i]) })}</small>{/if}
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>
  {/if}

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
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px 6px;
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
  .was,
  .vote {
    flex-basis: 100%;
    margin: 0;
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
  }
  .was {
    color: var(--pink-text);
    font-weight: 650;
  }
  .vote {
    color: var(--ink-3);
    font-family: var(--ewo-mono);
  }
  .middle {
    display: grid;
    justify-items: center;
    gap: 10px;
  }
  .middle .label {
    margin: 0;
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
