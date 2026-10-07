<!--
  The village as a ring of coats of arms around the moon (at night) or the sun (by day), with the
  clock in the middle. The dead are struck through and show their card when it's known; the Captain
  wears a crown; open votes are drawn as pink arrows. A seat you may pick right now is tappable.
  The Raven's mark (+2) shows by day; the charmed see the Piper's note on everyone charmed.
-->
<script lang="ts">
  import { isDark } from '../lib/phase';
  import type { Game, View } from '../lib/api';
  import { t, tk } from '../lib/i18n.svelte';
  import Shield from './Shield.svelte';
  import Clock from './Clock.svelte';

  let {
    view,
    game,
    me = null,
    options = [],
    picked = [],
    onpick,
    big = false,
    left = 0,
  }: {
    view: View;
    game: Game;
    me?: string | null;
    options?: string[];
    picked?: string[];
    onpick?: (id: string) => void;
    big?: boolean;
    /** Milliseconds left on the clock. */
    left?: number;
  } = $props();

  const night = $derived(isDark(game));
  const n = $derived(game.seats.length);
  const R = 40;
  const place = (i: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
  };
  const spots = $derived(game.seats.map((s, i) => ({ seat: s, player: view.players.find((p) => p.id === s.id), ...place(i) })));
  const at = $derived(Object.fromEntries(spots.map((s) => [s.seat.id, s])));
  // A seat's size: roomy for a small table, tighter for a big one.
  const size = $derived(Math.max(9, Math.min(17, 150 / n)));
  const votes = $derived(game.votes ?? (game.phase === 'verdict' ? game.verdict?.votes : null) ?? {});
  const received = $derived.by(() => {
    const m: Record<string, number> = {};
    for (const [voter, target] of Object.entries(votes)) if (target) m[target] = (m[target] ?? 0) + (voter === game.captain ? 2 : 1);
    return m;
  });
  const lovers = $derived(new Set(game.me?.lover ? [game.me.id, game.me.lover] : []));
  const pack = $derived(new Set((game.me?.pack ?? []).map((p) => p.id)));
  /** Who the charmed know to be charmed: their latest note. */
  const charmed = $derived(new Set(game.me?.knowledge.findLast((k) => k.type === 'charmed')?.ids ?? []));
  const day = $derived(['debate', 'vote', 'runoff', 'verdict'].includes(game.phase));

  /** An arrow from voter to target, bent a little toward the middle, stopping short of the arms. */
  function arrow(from: { x: number; y: number }, to: { x: number; y: number }) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const cut = size * 0.42;
    const x1 = from.x + (dx / len) * cut, y1 = from.y + (dy / len) * cut;
    const x2 = to.x - (dx / len) * cut, y2 = to.y - (dy / len) * cut;
    const mx = (x1 + x2) / 2 + (50 - (x1 + x2) / 2) * 0.25, my = (y1 + y2) / 2 + (50 - (y1 + y2) / 2) * 0.25;
    return `M${x1.toFixed(2)},${y1.toFixed(2)}Q${mx.toFixed(2)},${my.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
</script>

<div class="village" class:night class:big style:--size="{size}cqw">
  <div class="heart">
    <svg class="orb" viewBox="0 0 100 100" aria-hidden="true">
      {#if night}
        {#each [44, 40, 36] as r, i (r)}<circle cx="50" cy="50" {r} class="ring" style:opacity={0.5 - i * 0.12} />{/each}
        <circle cx="50" cy="50" r="31" class="moon" />
        <circle cx="30" cy="52" r="4" class="crater" /><circle cx="66" cy="68" r="5" class="crater" /><circle cx="63" cy="28" r="3" class="crater" />
      {:else}
        {#each Array(16) as _, i (i)}
          <path d="M50 50L{50 + 46 * Math.cos((i / 16) * Math.PI * 2 - 0.08)} {50 + 46 * Math.sin((i / 16) * Math.PI * 2 - 0.08)}L{50 + 46 * Math.cos((i / 16) * Math.PI * 2 + 0.08)} {50 + 46 * Math.sin((i / 16) * Math.PI * 2 + 0.08)}Z" class="ray" />
        {/each}
        <circle cx="50" cy="50" r="30" class="sun" />
      {/if}
    </svg>
    <div class="clock"><Clock {left} /></div>
  </div>

  <svg class="arrows" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <marker id="tip" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" class="tip" />
      </marker>
    </defs>
    {#each Object.entries(votes) as [voter, target] (voter)}
      {#if target && at[voter] && at[target]}
        <path d={arrow(at[voter], at[target])} class="arrow" class:mine={voter === me} marker-end="url(#tip)" />
      {/if}
    {/each}
  </svg>

  {#each spots as s (s.seat.id)}
    {@const pickable = options.includes(s.seat.id)}
    <button
      class="seat"
      class:me={s.seat.id === me}
      class:dead={!s.seat.alive}
      class:pickable
      class:picked={picked.includes(s.seat.id)}
      class:acted={s.seat.acted}
      style:left="{s.x}%"
      style:top="{s.y}%"
      disabled={!pickable || !onpick}
      onclick={() => onpick?.(s.seat.id)}
      aria-label={s.player?.name}
    >
      <span class="arms">
        {#if s.player}<Shield avatar={s.player.avatar} size="100%" dead={!s.seat.alive} />{/if}
        {#if game.captain === s.seat.id}<span class="crown" title={t('captainBadge')}>♛</span>{/if}
        {#if lovers.has(s.seat.id)}<span class="mark love">♥</span>{/if}
        {#if pack.has(s.seat.id) && s.seat.id !== me}<span class="mark wolf">◆</span>{/if}
        {#if charmed.has(s.seat.id) && s.seat.alive}<span class="mark tune" title={t('role:piper')}>♪</span>{/if}
        {#if day && game.raven === s.seat.id}<span class="raven" title={t('role:raven')}>+2</span>{/if}
        {#if received[s.seat.id]}<span class="count">{received[s.seat.id]}</span>{/if}
        {#if s.seat.acted}<span class="tick">✓</span>{/if}
      </span>
      <span class="who">{s.player?.name ?? '?'}</span>
      {#if s.seat.role}<span class="role">{tk(`role:${s.seat.role}`)}</span>
      {:else if s.seat.side && !s.seat.alive}<span class="role">{tk(`side:${s.seat.side}`)}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .village {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    aspect-ratio: 1;
    container-type: inline-size;
  }
  .big {
    max-width: min(100%, 86vh);
  }
  .heart {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44cqw;
    aspect-ratio: 1;
    translate: -50% -50%;
    display: grid;
    place-items: center;
  }
  .orb {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: rise 1.2s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes rise {
    from {
      translate: 0 18%;
      opacity: 0;
    }
  }
  .ring {
    fill: none;
    stroke: var(--cream);
    stroke-width: 0.8;
    stroke-dasharray: 9 3;
  }
  .moon,
  .sun {
    fill: var(--pink);
  }
  .crater {
    fill: none;
    stroke: var(--indigo);
    stroke-width: 1.2;
    opacity: 0.5;
  }
  .ray {
    fill: var(--pink);
    opacity: 0.45;
  }
  .clock {
    position: relative;
    z-index: 1;
  }
  .arrows {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  .arrow {
    fill: none;
    stroke: var(--pink);
    stroke-width: 0.7;
    stroke-linecap: round;
    opacity: 0.85;
    animation: draw 0.5s ease-out;
  }
  .arrow.mine {
    stroke-width: 1.1;
    opacity: 1;
  }
  .tip {
    fill: var(--pink);
  }
  @keyframes draw {
    from {
      opacity: 0;
    }
  }
  .seat {
    position: absolute;
    translate: -50% -42%;
    display: grid;
    justify-items: center;
    gap: 0.6cqw;
    width: calc(var(--size) * 1.5);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
  }
  .seat:disabled {
    cursor: default;
  }
  .arms {
    position: relative;
    display: block;
    width: var(--size);
    aspect-ratio: 1;
    transition: transform 0.25s var(--ewo-ease);
  }
  .pickable .arms {
    animation: beckon 1.6s ease-in-out infinite;
  }
  @keyframes beckon {
    50% {
      transform: translateY(-4%) scale(1.05);
    }
  }
  .picked .arms {
    animation: none;
    transform: scale(1.12);
    filter: drop-shadow(0 0 0.8cqw var(--pink)) drop-shadow(2px 2px 0 var(--pink));
  }
  .me .who {
    background: var(--fill-ink);
    color: var(--on-fill-ink);
  }
  .who {
    max-width: 100%;
    padding: 0.2cqw 1cqw;
    border-radius: 3px;
    font: 650 max(11px, 2.3cqw) / 1.2 var(--ewo-sans);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dead .who {
    opacity: 0.6;
    text-decoration: line-through;
    text-decoration-color: var(--pink);
  }
  .role {
    padding: 0.2cqw 1cqw;
    background: var(--pink);
    color: var(--on-pink);
    font: 700 max(9px, 1.7cqw) / 1.2 var(--ewo-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .crown {
    position: absolute;
    top: -38%;
    left: 50%;
    translate: -50% 0;
    font-size: calc(var(--size) * 0.42);
    line-height: 1;
    color: var(--pink-text);
    text-shadow: 1px 1px 0 var(--paper);
  }
  .mark {
    position: absolute;
    top: -6%;
    left: -10%;
    font-size: calc(var(--size) * 0.3);
    line-height: 1;
    color: var(--pink-text);
  }
  .mark.tune {
    left: auto;
    right: -8%;
    top: auto;
    bottom: -2%;
  }
  .raven {
    position: absolute;
    left: -16%;
    top: -12%;
    padding: 0 0.6cqw;
    border-radius: 4px;
    background: var(--fill-ink);
    color: var(--on-fill-ink);
    font: 800 max(10px, 2cqw) / 1.5 var(--ewo-mono);
    rotate: -8deg;
  }
  .count {
    position: absolute;
    right: -14%;
    top: -10%;
    min-width: calc(var(--size) * 0.42);
    padding: 0 0.6cqw;
    border-radius: 99px;
    background: var(--pink);
    color: var(--on-pink);
    font: 800 max(11px, 2.4cqw) / 1.5 var(--ewo-mono);
    text-align: center;
    animation: pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes pop {
    from {
      transform: scale(0.3);
    }
  }
  .tick {
    position: absolute;
    left: -12%;
    bottom: -4%;
    width: calc(var(--size) * 0.36);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--fill-ink);
    color: var(--on-fill-ink);
    font-size: calc(var(--size) * 0.22);
  }
  @media (prefers-reduced-motion: reduce) {
    .orb,
    .arrow,
    .count {
      animation: none;
    }
    .pickable .arms {
      animation: none;
    }
  }
</style>
