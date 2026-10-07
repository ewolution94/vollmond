<!--
  What you're asked to do right now. Every night task has the same shape (a question, a hint, the
  names, a confirm button), so the Seer's look and a villager's hunch look alike from across a table.
  Votes, the election and the pack's pick go out on the tap and may change until the phase ends;
  everything else waits for a confirm, so a slip of the finger doesn't cost a potion.
  The wolves' extras (a second victim, the bite, the White Werewolf's kill) and the Judge's signal
  ride along under their prompt and go out on the tap too.
-->
<script lang="ts">
  import { isDark } from '../lib/phase';
  import type { Game, RoleId, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { play } from '../lib/sound';
  import { prefs } from '../lib/prefs.svelte';
  import Shield from './Shield.svelte';
  import Card from './Card.svelte';

  let {
    room,
    view,
    game,
    left,
    picks = $bindable([]),
    ringPick = $bindable(null),
  }: {
    room: Room;
    view: View;
    game: Game;
    left: number;
    picks?: string[];
    ringPick?: ((id: string) => void) | null;
  } = $props();

  const me = $derived(game.me);
  const prompt = $derived(me?.prompt ?? null);
  const act = $derived(me?.act ?? null);
  const kind = $derived(prompt?.kind ?? null);
  const LIVE = new Set(['wolf', 'vote', 'captain']);
  const live = $derived(kind ? LIVE.has(kind) : false);
  const done = $derived(Boolean(act) && !live);
  const player = (id: string | null | undefined) => view.players.find((p) => p.id === id);
  const name = (id: string | null | undefined) => player(id)?.name ?? '?';

  // A final pick is chosen first, then confirmed; it starts over with each new question.
  let chosen: string[] = $state([]);
  /** middle cards (One night), or the Thief's card (-1: keep) */
  let cards: number[] = $state([]);
  let heal = $state(false);
  let busy = $state(false);
  let error = $state('');
  let asked = '';
  $effect(() => {
    const key = `${game.phase}:${game.night}:${game.day}:${kind}`;
    if (key !== asked) {
      asked = key;
      chosen = [];
      cards = [];
      heal = false;
      error = '';
    }
  });

  $effect(() => {
    picks = live ? (act?.target ? [act.target] : []) : chosen;
  });
  $effect(() => {
    ringPick = prompt?.options && !done && kind !== 'witch' ? tap : null;
  });

  async function send(move: Record<string, unknown>) {
    busy = true;
    error = '';
    try {
      await room.act('move', move);
      if (prefs.sounds && view.settings.where === 'call' && kind !== 'hurry') play('flip');
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    } finally {
      busy = false;
    }
  }

  function tap(id: string) {
    if (!prompt || done) return;
    if (live) {
      if (act?.target === id) return;
      void send({ kind: 'pick', target: id });
      return;
    }
    if (PAIRS.has(kind ?? '')) {
      chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(-need);
      return;
    }
    cards = [];
    chosen = chosen[0] === id ? [] : [id];
  }

  /** Prompts that take two players. The Piper charms fewer when fewer are left. */
  const PAIRS = new Set(['cupid', 'piper', 'swap']);
  const need = $derived(kind === 'piper' ? Math.min(2, prompt?.options?.length ?? 0) : 2);
  const pair = $derived(PAIRS.has(kind ?? ''));

  function middle(i: number) {
    if (done) return;
    chosen = [];
    if (kind === 'look') cards = cards.includes(i) ? cards.filter((x) => x !== i) : [...cards, i].slice(-2);
    else cards = cards[0] === i ? [] : [i];
  }

  const ready = $derived.by(() => {
    if (pair) return chosen.length === need;
    if (kind === 'lone' || kind === 'drink') return cards.length === 1;
    if (kind === 'look') return chosen.length === 1 || cards.length === 2;
    if (kind === 'thief') return cards.length === 1;
    return chosen.length > 0;
  });

  function confirm() {
    if (kind === 'cupid' || kind === 'swap') return chosen.length === 2 && send({ kind: 'pair', a: chosen[0], b: chosen[1] });
    if (kind === 'piper') return send({ kind: 'charm', a: chosen[0], b: chosen[1] ?? null });
    if (kind === 'witch') return send({ kind: 'witch', heal, poison: chosen[0] ?? null });
    if (kind === 'thief') return send({ kind: 'take', index: cards[0] === -1 ? null : cards[0] });
    if (kind === 'lone' || kind === 'drink') return send({ kind: 'center', index: cards[0] });
    if (kind === 'look' && cards.length === 2) return send({ kind: 'center', indices: cards });
    if (chosen[0]) return send({ kind: 'pick', target: chosen[0] });
  }

  const extras = $derived(kind === 'wolf' ? (prompt?.extras ?? null) : null);
  const mine = $derived(me?.extras ?? {});
  function extra(which: 'second' | 'white', id: string) {
    void send({ kind: which, target: mine[which] === id ? null : id });
  }

  const role = (id: RoleId | null | undefined) => (id ? tk(`role:${id}`) : '?');
  /** What you chose, once it's final. */
  const answer = $derived.by(() => {
    if (!act) return '';
    if (kind === 'cupid') return `${name(act.a)} ♥ ${name(act.b)}`;
    if (kind === 'swap') return `${name(act.a)} ⇄ ${name(act.b)}`;
    if (kind === 'piper') return [act.a, act.b].filter(Boolean).map(name).join(' + ');
    if (kind === 'thief') return act.index == null ? t('keepThief') : role(prompt?.cards?.[act.index]);
    if (kind === 'lone' || kind === 'drink') return t('middleCard', { n: (act.index ?? 0) + 1 });
    if (act.indices) return act.indices.map((i) => t('middleCard', { n: i + 1 })).join(' + ');
    return act.target === null ? t('nobody') : name(act.target);
  });
  const confirmLabel = $derived.by(() => {
    if (kind === 'cupid') return t('bind');
    if (kind === 'swap') return t('swapThem');
    if (kind === 'piper') return t('charm');
    if (kind === 'thief') return cards[0] === -1 ? t('keepThief') : cards.length ? `${t('take')}: ${role(prompt?.cards?.[cards[0]])}` : '…';
    if (cards.length) return `${cards.map((i) => t('middleCard', { n: i + 1 })).join(' + ')} ✓`;
    return chosen.length ? `${name(chosen[0])} ✓` : '…';
  });

  /** The pack's picks on each name, for wolves. */
  const packPicks = $derived.by(() => {
    const m: Record<string, string[]> = {};
    for (const w of me?.pack ?? []) if (w.pick) (m[w.pick] ??= []).push(name(w.id));
    return m;
  });
  const votesOn = $derived.by(() => {
    const m: Record<string, number> = {};
    for (const [voter, target] of Object.entries(game.votes ?? {})) if (target) m[target] = (m[target] ?? 0) + (voter === game.captain ? 2 : 1);
    return m;
  });
  const alive = $derived(game.seats.filter((s) => s.alive).length);
  const hurried = $derived(game.seats.filter((s) => s.acted).length);
</script>

{#snippet names(options: string[])}
  <ul class="names" class:two={pair}>
    {#each options as id (id)}
      {@const p = player(id)}
      {@const on = live ? act?.target === id : chosen.includes(id)}
      <li>
        <button class="name" class:on disabled={busy || done} onclick={() => tap(id)}>
          {#if p}<Shield avatar={p.avatar} size={34} />{/if}
          <span class="who">{p?.name ?? '?'}{#if id === room.seat.player}<span class="you"> · {t('you')}</span>{/if}</span>
          {#if kind === 'wolf' && packPicks[id]}<span class="pack">◆ {packPicks[id].join(', ')}</span>{/if}
          {#if (kind === 'vote' || kind === 'captain') && votesOn[id]}<span class="votes">{votesOn[id]}</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet live_names(options: string[], on: string | null | undefined, pick: (id: string) => void)}
  <ul class="names small">
    {#each options as id (id)}
      {@const p = player(id)}
      <li>
        <button class="name" class:on={on === id} disabled={busy} onclick={() => pick(id)}>
          {#if p}<Shield avatar={p.avatar} size={26} />{/if}
          <span class="who">{p?.name ?? '?'}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet middle_cards()}
  <ul class="middle">
    {#each prompt?.center ?? [] as i (i)}
      <li>
        <button class="pile" class:on={cards.includes(i)} disabled={busy || done} onclick={() => middle(i)} aria-label={t('middleCard', { n: i + 1 })}>
          <Card role={null} face="back" width="76px" />
          <span>{i + 1}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="action plate" class:urgent={left > 0 && left < 10_000 && prompt && !act}>
  {#if !me}
    <p class="title display">{t('spectator')}</p>
  {:else if !prompt}
    {#if !me.alive}
      <p class="title display">{t('dead')}</p>
      <p class="hint">{view.settings.ghosts ? t('deadHint') : t('deadBlind')}</p>
    {:else if isDark(game)}
      <p class="title display">{t('sleeping')}</p>
    {:else}
      <p class="title display">{t('prompt:wait')}</p>
    {/if}
  {:else if kind === 'ready'}
    <p class="title display">{t('prompt:ready')}</p>
    <p class="hint">{t('promptHint:ready')}</p>
    <button class="btn primary block" disabled={busy || Boolean(act)} onclick={() => send({ kind: 'ready' })}>{act ? t('waiting') : t('ready')}</button>
  {:else if kind === 'hurry'}
    <p class="title display">{t('prompt:hurry')}</p>
    <p class="hint">{t('promptHint:hurry')}</p>
    <button class="btn block" class:primary={!me.hurried} class:secondary={me.hurried} disabled={busy} onclick={() => send({ kind: 'hurry', on: !me.hurried })}>
      {me.hurried ? `✓ ${t('hurried')}` : t('hurry')}
    </button>
    <p class="label center">{t('hurryCount', { n: hurried, m: alive })}</p>
  {:else if kind === 'girl'}
    <p class="title display">{t('prompt:girl')}</p>
    <p class="hint">{t('promptHint:girl')}</p>
    {#if act}
      <p class="mine">{act.peek ? t('peek') : t('sleep')} ✓</p>
    {:else}
      <div class="pair">
        <button class="btn pink" disabled={busy} onclick={() => send({ kind: 'peek', peek: true })}>{t('peek')}</button>
        <button class="btn secondary" disabled={busy} onclick={() => send({ kind: 'peek', peek: false })}>{t('sleep')}</button>
      </div>
    {/if}
  {:else if kind === 'witch'}
    <p class="title display">{t('prompt:witch')}</p>
    <p class="victim">{prompt.victim ? t('witchVictim', { name: name(prompt.victim) }) : t('witchNobody')}</p>
    {#if done}
      <p class="mine">{act?.heal ? `${t('heal')} ✓ ` : ''}{act?.poison ? `${t('poison')}: ${name(act.poison)} ✓` : ''}{!act?.heal && !act?.poison ? `${t('brew')} ✓` : ''}</p>
    {:else}
      <ewo-switch row tone="accent" checked={heal} disabled={!prompt.heal || busy} onchange={(e) => (heal = e.detail.checked)}>
        {t('heal')}{#if !me.potions?.heal}<span slot="hint">{t('healUsed')}</span>{/if}
      </ewo-switch>
      {#if prompt.poison}
        <p class="label">{t('poisonWho')}</p>
        {@render names(prompt.options ?? [])}
      {:else}
        <p class="hint">{t('poisonUsed')}</p>
      {/if}
      <button class="btn primary block" disabled={busy} onclick={confirm}>{t('brew')}</button>
    {/if}
  {:else if kind === 'thief'}
    <p class="title display">{t('prompt:thief')}</p>
    <p class="hint">{prompt.must ? t('promptHint:thiefMust') : t('promptHint:thief')}</p>
    {#if done}
      <p class="mine">{answer} ✓</p>
    {:else}
      <ul class="spare">
        {#each prompt.cards ?? [] as card, i (i)}
          <li>
            <button class="spare-card" class:on={cards[0] === i} disabled={busy} onclick={() => (cards = cards[0] === i ? [] : [i])} aria-label={role(card)}>
              <Card role={card} width="min(38vw, 150px)" />
            </button>
          </li>
        {/each}
      </ul>
      {#if !prompt.must}
        <button class="btn quiet" class:on={cards[0] === -1} disabled={busy} onclick={() => (cards = cards[0] === -1 ? [] : [-1])}>
          {cards[0] === -1 ? '✓ ' : ''}{t('keepThief')}
        </button>
      {/if}
      <button class="btn primary block" disabled={busy || !ready} onclick={confirm}>{confirmLabel}</button>
    {/if}
  {:else if kind === 'lone' || kind === 'drink'}
    <p class="title display">{tk(`prompt:${kind}`)}</p>
    {#if kind === 'drink'}<p class="hint">{t('promptHint:drink')}</p>{/if}
    {#if done}
      <p class="mine">{answer} ✓</p>
      <p class="hint">{t('waiting')}</p>
    {:else}
      {@render middle_cards()}
      <button class="btn primary block" disabled={busy || !ready} onclick={confirm}>{confirmLabel}</button>
    {/if}
  {:else}
    <p class="title display">{tk(`prompt:${kind}`)}</p>
    {#if tk(`promptHint:${kind}`) !== `promptHint:${kind}`}<p class="hint">{tk(`promptHint:${kind}`)}</p>{/if}
    {#if done}
      <p class="mine">{t('yourPick')}: {answer} ✓</p>
      <p class="hint">{t('waiting')}</p>
    {:else}
      {@render names(prompt.options ?? [])}
      {#if kind === 'look'}
        <p class="label">{t('lookMiddle')}</p>
        {@render middle_cards()}
      {/if}
      {#if kind === 'vote'}
        <button class="btn quiet" class:on={act && act.target === null} disabled={busy} onclick={() => send({ kind: 'pick', target: null })}>
          {act && act.target === null ? '✓ ' : ''}{t('abstain')}
        </button>
      {/if}
      {#if kind === 'raven' || kind === 'rob'}
        <button class="btn quiet" disabled={busy} onclick={() => send({ kind: 'pick', target: null })}>{t('nobody')}</button>
      {/if}
      {#if !live}
        <button class="btn primary block" disabled={busy || !ready} onclick={confirm}>{confirmLabel}</button>
      {/if}
    {/if}
    {#if extras}
      <div class="extras">
        {#if extras.second}
          <p class="label">{t('second')} <span class="aside">{t('secondHint')}</span></p>
          {@render live_names(extras.second, mine.second, (id) => extra('second', id))}
        {/if}
        {#if extras.infect}
          <ewo-switch row tone="accent" checked={Boolean(mine.infect)} disabled={busy} onchange={(e) => send({ kind: 'infect', on: e.detail.checked })}>
            {t('infect')}<span slot="hint">{t('infectHint')}</span>
          </ewo-switch>
        {/if}
        {#if extras.white?.length}
          <p class="label">{t('white')} <span class="aside">{t('whiteHint')}</span></p>
          {@render live_names(extras.white, mine.white, (id) => extra('white', id))}
        {/if}
      </div>
    {/if}
    {#if kind === 'vote' && (prompt.judge || me.judgeCalled)}
      <div class="judge">
        <button class="btn secondary block" disabled={busy || me.judgeCalled} onclick={() => send({ kind: 'judge' })}>
          {me.judgeCalled ? `✓ ${t('judgeCalled')}` : t('judgeCall')}
        </button>
        <p class="hint">{t('judgeHint')}</p>
      </div>
    {/if}
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .action {
    display: grid;
    gap: 12px;
    padding: 18px;
    border-width: 2px;
    border-color: var(--ink);
    box-shadow: 4px 4px 0 var(--pink);
  }
  .urgent {
    animation: nudge 1s ease-in-out infinite;
  }
  @keyframes nudge {
    50% {
      box-shadow: 6px 6px 0 var(--pink);
    }
  }
  .title {
    margin: 0;
    font-size: clamp(28px, 6vw, 36px);
    text-wrap: balance;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: 14px;
  }
  .center {
    text-align: center;
  }
  .victim {
    margin: 0;
    font-weight: 650;
    font-size: 17px;
    color: var(--pink-text);
  }
  .mine {
    margin: 0;
    font: 700 20px/1.3 var(--display);
  }
  .names {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .name {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 8px 10px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    text-align: start;
    transition: transform 0.15s var(--ewo-ease);
  }
  .name:active:not(:disabled) {
    transform: scale(0.97);
  }
  .name.on {
    border-color: var(--ink);
    background: var(--pink);
    color: var(--on-pink);
    box-shadow: 3px 3px 0 var(--fill-ink);
  }
  .name:disabled:not(.on) {
    opacity: 0.6;
  }
  .who {
    flex: 1;
    min-width: 0;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .you {
    font-weight: 500;
    opacity: 0.7;
  }
  .pack {
    position: absolute;
    right: 6px;
    bottom: -9px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--fill-ink);
    color: var(--on-fill-ink);
    font: 700 10px/1.4 var(--ewo-mono);
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .votes {
    min-width: 26px;
    padding: 2px 6px;
    border-radius: 99px;
    background: var(--fill-ink);
    color: var(--on-fill-ink);
    font: 800 13px/1.2 var(--ewo-mono);
    text-align: center;
  }
  .names.small {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  .names.small .name {
    min-height: 42px;
    padding: 6px 8px;
  }
  .extras,
  .judge {
    display: grid;
    gap: 8px;
    padding-top: 12px;
    border-top: 1.5px dashed var(--line);
  }
  .extras .label {
    margin: 0;
  }
  .aside {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    opacity: 0.75;
  }
  .middle,
  .spare {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  .pile,
  .spare-card {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 6px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: none;
    transition: transform 0.15s var(--ewo-ease);
  }
  .pile span {
    font: 700 15px/1.2 var(--display);
  }
  .pile.on,
  .spare-card.on {
    border-color: var(--ink);
    background: var(--pink);
    color: var(--on-pink);
    box-shadow: 3px 3px 0 var(--fill-ink);
    transform: translateY(-4px) rotate(-1.5deg);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .btn.on {
    color: var(--pink-text);
  }
  @media (prefers-reduced-motion: reduce) {
    .urgent {
      animation: none;
    }
  }
</style>
