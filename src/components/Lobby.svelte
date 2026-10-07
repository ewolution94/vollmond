<!--
  The village square before a game: who's here, the link and QR code to bring others, and the host's
  settings (mode, where you play, the deck with its balance, the rules). Settings answer the tap:
  the host sees a change at once, changes go to the server one request at a time, and the server's
  view takes over once it agrees (learnings/ui-preferences.md).
-->
<script lang="ts">
  import type { Config, Deck, Player, RoleId, Settings, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk, type Key } from '../lib/i18n.svelte';
  import { deckCards, ROLE_ORDER } from '../lib/roles';
  import Card from './Card.svelte';
  import Qr from './Qr.svelte';
  import Shield from './Shield.svelte';

  let { room, view, config, onleave }: { room: Room; view: View; config: Config | null; onleave: () => void } = $props();

  const me = $derived(view.players.find((p) => p.id === room.seat.player)!);
  const isHost = $derived(view.host === room.seat.player);
  const host = $derived(view.players.find((p) => p.id === view.host));
  const url = $derived(`${location.origin}/${view.code}`);

  // ---- settings that answer the tap
  let pending: Partial<Settings> = $state({});
  let queue: Partial<Settings> = {};
  let inflight = false;
  let error = $state('');
  const settings = $derived({ ...view.settings, ...pending } as Settings);
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  $effect(() => {
    const s = view.settings as unknown as Record<string, unknown>;
    let changed = false;
    const next: Record<string, unknown> = { ...pending };
    for (const key of Object.keys(next)) {
      if (!(key in queue) && same(s[key], next[key])) {
        delete next[key];
        changed = true;
      }
    }
    if (changed) pending = next as Partial<Settings>;
  });

  function set(patch: Partial<Settings>) {
    pending = { ...pending, ...patch };
    queue = { ...queue, ...patch };
    void pump();
  }
  async function pump() {
    if (inflight || !Object.keys(queue).length) return;
    const batch = queue;
    queue = {};
    inflight = true;
    try {
      await room.act('settings', batch);
      error = '';
    } catch (e) {
      pending = {};
      queue = {};
      error = errorText(e instanceof ApiError ? e.code : 'other');
    } finally {
      inflight = false;
      void pump();
    }
  }

  // ---- the deck
  const n = $derived(view.players.length);
  const suggested = $derived(view.lobby?.suggested ?? {});
  const deck: Deck = $derived(settings.deck ?? suggested);
  const own = $derived(settings.deck !== null);
  const catalogue = $derived(Object.fromEntries((config?.roles ?? []).map((r) => [r.id, r])) as Partial<Record<RoleId, Config['roles'][number]>>);
  const lean = $derived(Object.entries(deck).reduce((s, [id, c]) => s + (catalogue[id as RoleId]?.weight ?? 0) * (c ?? 0), 0));
  const size = $derived(Object.values(deck).reduce((a, b) => a + (b ?? 0), 0));
  const leanKey = $derived(lean > 3 ? 'balance:village' : lean < -3 ? 'balance:wolves' : 'balance:fair');
  /** The cards this mode plays with, in the deck's order. */
  const playable = $derived(ROLE_ORDER.filter((id) => catalogue[id]?.modes.includes(settings.mode) ?? true));
  const oneNight = $derived(settings.mode === 'onenight');
  // The server judges the deck (server/roles.mjs → deckProblem); while a change is on its way, Start waits.
  const syncing = $derived(Object.keys(pending).length > 0);
  const problem = $derived.by(() => {
    const code = view.lobby?.problem;
    if (!code) return '';
    if (code === 'too-few') return t('problem:too-few', { n: view.lobby?.min ?? config?.minPlayers ?? 5 });
    if (code === 'too-many') return t('problem:too-many', { n: view.lobby?.max ?? 0 });
    return tk(`problem:${code}`);
  });
  const countLine = $derived(
    oneNight ? t('deckCountMiddle', { n: size, m: n }) : deck.thief ? t('deckCountThief', { n: size, m: n }) : t('deckCount', { n: size, m: n }),
  );

  /** Sisters, Brothers and Masons come as a set: one step adds or takes the whole set. */
  function count(id: RoleId, delta: number) {
    const role = catalogue[id];
    const step = role?.exact ?? 1;
    const next = { ...deck, [id]: Math.max(0, Math.min(role?.max ?? 1, (deck[id] ?? 0) + delta * step)) };
    if (!next[id]) delete next[id];
    set({ deck: next });
  }

  // ---- the rest
  let copied = $state(false);
  let showQr = $state(false);
  let starting = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      showQr = true;
    }
  }
  async function act(action: string, body?: unknown) {
    try {
      await room.act(action, body);
      error = '';
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    }
  }
  async function start() {
    starting = true;
    await act('start');
    starting = false;
  }

  const seg = (values: readonly (string | number)[], label: (v: string) => string) => values.map((v) => ({ value: String(v), label: label(String(v)) }));
  const clock = (s: number) => (s === 0 ? t('open') : s < 60 ? t('seconds', { n: s }) : t('minutes', { n: s / 60 }));
</script>

{#snippet person(p: Player)}
  <li class="person" class:offline={!p.online}>
    <Shield avatar={p.avatar} size={40} />
    <span class="name">{p.name}{#if p.id === me.id}<span class="you"> ·&nbsp;{t('you')}</span>{/if}</span>
    {#if p.id === view.host}<span class="tag host">{t('host')}</span>{/if}
    {#if p.bot}<span class="tag">{t('bot')}</span>{/if}
    {#if isHost && p.id !== me.id && !p.bot}
      <button class="btn quiet kick" onclick={() => act('kick', { player: p.id })}>{t('kick')}</button>
    {/if}
  </li>
{/snippet}

<section class="lobby">
  <header class="village">
    <span class="band">{view.code}</span>
    <h1 class="display">{view.village}</h1>
  </header>

  <div class="columns">
    <div class="col">
      <div class="plate invite">
        <h2 class="label">{t('invite')}</h2>
        <p class="url">{url.replace(/^https?:\/\//, '')}</p>
        <div class="actions">
          <button class="btn primary" onclick={copy}>{copied ? t('copied') : t('copyLink')}</button>
          <button class="btn secondary" onclick={() => (showQr = !showQr)} aria-expanded={showQr}>QR</button>
          <a class="btn secondary" href="/{view.code}/screen" target="_blank" rel="noopener">{t('bigScreen')}</a>
        </div>
        {#if showQr}<div class="qr"><Qr {url} /></div>{/if}
        <p class="hint">{t('bigScreenHint')}</p>
      </div>

      <div class="plate people">
        <h2 class="label">{t('players')} · {n}</h2>
        <ul>
          {#each view.players as p (p.id)}{@render person(p)}{/each}
        </ul>
        {#if isHost}
          <div class="bots">
            <button class="btn secondary" onclick={() => act('bot')} disabled={view.players.filter((p) => p.bot).length >= (config?.maxBots ?? 12)}>+ {t('addBot')}</button>
            {#if view.players.some((p) => p.bot)}<button class="btn quiet" onclick={() => act('unbot')}>− {t('removeBot')}</button>{/if}
          </div>
          <p class="hint">{t('botsHint')}</p>
        {/if}
      </div>
    </div>

    <div class="col">
      <div class="plate">
        <h2 class="label">{t('mode')}</h2>
        <ewo-segmented
          tone="accent"
          stretch
          label={t('mode')}
          value={settings.mode}
          disabled={!isHost}
          options={seg(config?.choices.mode ?? ['classic', 'quick', 'onenight'], (v) => tk(`mode:${v}`))}
          onchange={(e) => set({ mode: e.detail.value as Settings['mode'] })}
        ></ewo-segmented>
        <p class="hint">{tk(`modeHint:${settings.mode}`)}</p>

        <h2 class="label">{t('where')}</h2>
        <ewo-segmented
          tone="accent"
          stretch
          label={t('where')}
          value={settings.where}
          disabled={!isHost}
          options={seg(config?.choices.where ?? ['call', 'table'], (v) => tk(`where:${v}`))}
          onchange={(e) => set({ where: e.detail.value as Settings['where'] })}
        ></ewo-segmented>
        <p class="hint">{tk(`whereHint:${settings.where}`)}</p>
      </div>

      <div class="plate deck">
        <div class="deck-head">
          <h2 class="label">{t('deck')}</h2>
          <ewo-segmented
            tone="accent"
            size="sm"
            label={t('deck')}
            value={own ? 'own' : 'auto'}
            disabled={!isHost}
            options={[
              { value: 'auto', label: t('deckAuto', { n }) },
              { value: 'own', label: t('deckOwn') },
            ]}
            onchange={(e) => set({ deck: e.detail.value === 'own' ? { ...suggested } : null })}
          ></ewo-segmented>
        </div>

        {#if own && isHost}
          <ul class="builder">
            {#each playable as id (id)}
              <li>
                <span class="mini"><Card role={id} width="44px" /></span>
                <span class="role">{tk(`role:${id}`)}</span>
                <button class="step" onclick={() => count(id, -1)} disabled={!(deck[id] ?? 0)} aria-label="−">−</button>
                <span class="count" class:zero={!(deck[id] ?? 0)}>{deck[id] ?? 0}</span>
                <button class="step" onclick={() => count(id, 1)} disabled={(deck[id] ?? 0) >= (catalogue[id]?.max ?? 1)} aria-label="+">+</button>
              </li>
            {/each}
          </ul>
        {:else if settings.mystery && !isHost}
          <div class="fan mystery">
            {#each Array(Math.min(size, 8)) as _, i (i)}<span class="fan-card" style:--i={i}><Card width="100%" face="back" /></span>{/each}
          </div>
        {:else}
          <div class="fan">
            {#each deckCards(deck) as id, i (i)}
              <span class="fan-card" style:--i={i} title={tk(`role:${id}`)}><Card role={id} width="100%" /></span>
            {/each}
          </div>
        {/if}

        <div class="meter" style:--lean={Math.max(-12, Math.min(12, lean))}>
          <span class="end">{t('side:wolves')}</span>
          <span class="track"><span class="needle"></span></span>
          <span class="end">{t('side:village')}</span>
        </div>
        <p class="hint center">{countLine} · {tk(leanKey)}</p>

        <ewo-switch row tone="accent" checked={settings.mystery} disabled={!isHost} onchange={(e) => set({ mystery: e.detail.checked })}>
          {t('mystery')}<span slot="hint">{t('mysteryHint')}</span>
        </ewo-switch>
      </div>

      <details class="plate rules">
        <summary class="label">{t('rules')}</summary>
        <div class="grid">
          <span>{t('nightClock')}</span>
          <ewo-segmented tone="accent" size="sm" label={t('nightClock')} value={String(settings.night)} disabled={!isHost}
            options={seg(config?.choices.night ?? [20, 30, 45, 60], (v) => t('seconds', { n: v }))}
            onchange={(e) => set({ night: Number(e.detail.value) })}></ewo-segmented>
          <span>{t('debateClock')}</span>
          <ewo-segmented tone="accent" size="sm" label={t('debateClock')} value={String(settings.debate)} disabled={!isHost}
            options={seg(config?.choices.debate ?? [60, 120, 180, 300, 480, 0], (v) => clock(Number(v)))}
            onchange={(e) => set({ debate: Number(e.detail.value) })}></ewo-segmented>
          {#if !oneNight}
          {#each [['reveal', ['role', 'side', 'none']], ['votes', ['open', 'secret']], ['tie', ['none', 'runoff']], ['firstNight', ['hunt', 'calm']], ['seer', ['role', 'side']]] as const as [key, values] (key)}
            <span>{t(key as Key)}</span>
            <ewo-segmented tone="accent" size="sm" label={t(key as Key)} value={String(settings[key])} disabled={!isHost}
              options={seg(values, (v) => tk(`${key}:${v}`))}
              onchange={(e) => set({ [key]: e.detail.value } as Partial<Settings>)}></ewo-segmented>
          {/each}
          <span>{t('parity')}</span>
          <ewo-segmented tone="accent" size="sm" label={t('parity')} value={settings.parity ? 'on' : 'off'} disabled={!isHost}
            options={seg(['on', 'off'], (v) => tk(`parity:${v}`))}
            onchange={(e) => set({ parity: e.detail.value === 'on' })}></ewo-segmented>
          {/if}
        </div>
        {#if oneNight}
          <p class="hint">{t('oneNightRules')}</p>
        {:else}
          <ewo-switch row tone="accent" checked={settings.captain} disabled={!isHost} onchange={(e) => set({ captain: e.detail.checked })}>
            {t('captain')}<span slot="hint">{t('captainHint')}</span>
          </ewo-switch>
          <ewo-switch row tone="accent" checked={settings.witchSelf} disabled={!isHost} onchange={(e) => set({ witchSelf: e.detail.checked })}>{t('witchSelf')}</ewo-switch>
          <ewo-switch row tone="accent" checked={settings.ghosts} disabled={!isHost} onchange={(e) => set({ ghosts: e.detail.checked })}>{t('ghosts')}</ewo-switch>
        {/if}
      </details>
    </div>
  </div>

  <footer class="go">
    {#if isHost}
      <button class="btn primary big" onclick={start} disabled={Boolean(problem) || syncing || starting}>{t('start')}</button>
      {#if problem}<p class="hint center">{problem}</p>{/if}
    {:else}
      <p class="wait">{t('waitHost', { name: host?.name ?? '…' })}</p>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <button class="btn quiet" onclick={onleave}>{t('leave')}</button>
  </footer>
</section>

<style>
  .lobby {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }
  .village {
    display: grid;
    justify-items: start;
    gap: 6px;
    padding-top: 8px;
  }
  .village h1 {
    margin: 0;
    font-size: clamp(48px, 10vw, 84px);
    text-shadow: 3px 3px 0 var(--pink);
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  @media (min-width: 900px) {
    .columns {
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
      align-items: start;
    }
  }
  .col {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    min-width: 0;
  }
  .plate {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    padding: 18px;
  }
  h2 {
    margin: 0;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: 14px;
  }
  .center {
    text-align: center;
  }
  .url {
    margin: 0;
    font: 600 17px/1.3 var(--ewo-mono);
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .qr {
    width: min(240px, 100%);
    padding: 10px;
    background: var(--cream);
    border-radius: var(--radius);
    justify-self: center;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .person {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
  }
  .person.offline {
    opacity: 0.5;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .you {
    color: var(--ink-3);
    font-weight: 500;
  }
  .tag {
    padding: 3px 8px 2px;
    border: 1.5px solid var(--line);
    border-radius: 4px;
    font: 600 11px/1.3 var(--ewo-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .tag.host {
    background: var(--pink);
    color: var(--on-pink);
    border-color: transparent;
  }
  .kick {
    min-height: 32px;
    font-size: 13px;
  }
  .bots {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .deck-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  /* One row however many cards: they overlap more as the deck grows. */
  /* The fan takes the width it's given, whatever its cards would like (else 10 cards widen the
     whole page on a phone). */
  .fan {
    display: flex;
    justify-content: center;
    padding: 6px 12px 2px;
    overflow-x: clip;
    contain: inline-size;
  }
  .fan-card {
    flex: 0 1 64px;
    min-width: 0;
    margin: 0 -7px 6px;
    rotate: calc((var(--i) - 3) * 1.2deg);
    transition: translate 0.2s var(--ewo-ease);
  }
  .fan-card :global(.card) {
    width: 64px;
    max-width: none;
  }
  @media (hover: hover) {
    .fan-card:hover {
      translate: 0 -8px;
      z-index: 2;
    }
  }
  .builder li {
    display: grid;
    grid-template-columns: 44px 1fr 40px 28px 40px;
    align-items: center;
    gap: 10px;
  }
  .role {
    font-weight: 600;
  }
  .step {
    width: 40px;
    height: 40px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    font: 700 20px/1 var(--ewo-sans);
  }
  .step:disabled {
    opacity: 0.35;
  }
  .count {
    text-align: center;
    font: 700 18px/1 var(--ewo-mono);
  }
  .count.zero {
    color: var(--ink-3);
  }
  /* The balance: a needle on a scale, wolves on the left, the village on the right. */
  .meter {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    font: 600 11px/1 var(--ewo-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .track {
    position: relative;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--pink), color-mix(in oklab, var(--pink) 20%, var(--paper-3)) 40%, var(--paper-3) 50%, color-mix(in oklab, var(--fill-ink) 20%, var(--paper-3)) 60%, var(--fill-ink));
  }
  .needle {
    position: absolute;
    top: -6px;
    left: calc(50% + var(--lean) / 12 * 50%);
    width: 6px;
    height: 22px;
    margin-left: -3px;
    border-radius: 3px;
    background: var(--ink);
    box-shadow: 0 0 0 2px var(--paper-2);
    transition: left 0.5s cubic-bezier(0.3, 1.4, 0.4, 1);
  }
  .rules summary {
    cursor: pointer;
    list-style: none;
  }
  .rules summary::before {
    content: '▸ ';
  }
  .rules[open] summary::before {
    content: '▾ ';
  }
  .rules .grid {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px 14px;
    font-size: 14px;
    font-weight: 550;
  }
  .rules .grid ewo-segmented {
    justify-self: end;
  }
  @media (max-width: 480px) {
    .rules .grid {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .rules .grid ewo-segmented {
      justify-self: start;
      margin-bottom: 8px;
    }
  }
  .go {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 14px 0 calc(10px + env(safe-area-inset-bottom));
    background: linear-gradient(transparent, var(--paper) 35%);
  }
  .big {
    min-width: min(100%, 320px);
    min-height: 56px;
    font-size: 18px;
  }
  .wait {
    margin: 0;
    font: 700 24px/1.1 var(--display);
    text-align: center;
  }
</style>
