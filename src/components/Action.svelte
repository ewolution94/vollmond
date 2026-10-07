<!--
  What you're asked to do right now. Every night task has the same shape (a question, a hint, the
  names, a confirm button), so the Seer's look and a villager's hunch look alike from across a table.
  Votes, the election and the pack's pick go out on the tap and may change until the phase ends;
  everything else waits for a confirm, so a slip of the finger doesn't cost a potion.
-->
<script lang="ts">
  import type { Game, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { play } from '../lib/sound';
  import { prefs } from '../lib/prefs.svelte';
  import Shield from './Shield.svelte';

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
  let heal = $state(false);
  let busy = $state(false);
  let error = $state('');
  let asked = '';
  $effect(() => {
    const key = `${game.phase}:${game.night}:${game.day}:${kind}`;
    if (key !== asked) {
      asked = key;
      chosen = [];
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
    if (kind === 'cupid') {
      chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(-2);
      return;
    }
    chosen = chosen[0] === id ? [] : [id];
  }

  function confirm() {
    if (kind === 'cupid' && chosen.length === 2) return send({ kind: 'pair', a: chosen[0], b: chosen[1] });
    if (kind === 'witch') return send({ kind: 'witch', heal, poison: chosen[0] ?? null });
    if (chosen[0]) return send({ kind: 'pick', target: chosen[0] });
  }

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
  <ul class="names" class:two={kind === 'cupid'}>
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

<div class="action plate" class:urgent={left > 0 && left < 10_000 && prompt && !act}>
  {#if !me}
    <p class="title display">{t('spectator')}</p>
  {:else if !prompt}
    {#if !me.alive}
      <p class="title display">{t('dead')}</p>
      <p class="hint">{view.settings.ghosts ? t('deadHint') : t('deadBlind')}</p>
    {:else if ['dusk', 'night', 'witch'].includes(game.phase)}
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
  {:else}
    <p class="title display">{tk(`prompt:${kind}`)}</p>
    {#if tk(`promptHint:${kind}`) !== `promptHint:${kind}`}<p class="hint">{tk(`promptHint:${kind}`)}</p>{/if}
    {#if done}
      <p class="mine">{t('yourPick')}: {kind === 'cupid' ? `${name(act?.a)} ♥ ${name(act?.b)}` : name(act?.target)} ✓</p>
      <p class="hint">{t('waiting')}</p>
    {:else}
      {@render names(prompt.options ?? [])}
      {#if kind === 'vote'}
        <button class="btn quiet" class:on={act && act.target === null} disabled={busy} onclick={() => send({ kind: 'pick', target: null })}>
          {act && act.target === null ? '✓ ' : ''}{t('abstain')}
        </button>
      {/if}
      {#if !live}
        <button class="btn primary block" disabled={busy || (kind === 'cupid' ? chosen.length !== 2 : !chosen.length)} onclick={confirm}>
          {kind === 'cupid' ? t('bind') : chosen.length ? `${name(chosen[0])} ✓` : '…'}
        </button>
      {/if}
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
