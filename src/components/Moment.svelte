<!--
  The big moments, over everything for a few seconds: night falls (the moon rises), dawn breaks (the
  night's dead turn their cards over), the verdict (the one voted out turns theirs). Only when the
  moment happens, not when a page loads in the middle of it; a tap ends it early.
-->
<script lang="ts">
  import type { Game, View } from '../lib/api';
  import { t, tk } from '../lib/i18n.svelte';
  import { narrate } from '../lib/narrate';
  import Card from './Card.svelte';
  import Shield from './Shield.svelte';

  let { view, game, screen = false }: { view: View; game: Game; screen?: boolean } = $props();

  type Kind = 'night' | 'dawn' | 'verdict';
  let shown = $state<{ kind: Kind; key: string; line: string } | null>(null);
  let turned = $state(false);
  let seen = '';
  let timer = 0;
  let flip = 0;

  function kindOf(g: Game): Kind | null {
    if (g.phase === 'dusk' || (g.phase === 'night' && !(g.night === 1 && g.deck?.cupid))) return 'night';
    if (g.phase === 'dawn') return 'dawn';
    if (g.phase === 'verdict') return 'verdict';
    return null;
  }

  $effect(() => {
    const key = `${view.games}:${game.phase}:${game.night}:${game.day}`;
    if (key === seen) return;
    const first = seen === '';
    seen = key;
    const kind = kindOf(game);
    if (first || !kind) return;
    clearTimeout(timer);
    clearTimeout(flip);
    turned = false;
    shown = { kind, key, line: narrate(view) };
    const dead = kind === 'dawn' ? game.morning.length : kind === 'verdict' && game.verdict?.out ? 1 : 0;
    flip = window.setTimeout(() => (turned = true), 1100);
    timer = window.setTimeout(() => (shown = null), kind === 'night' ? 3000 : 3600 + dead * 1200);
  });

  const player = (id: string | null | undefined) => view.players.find((p) => p.id === id);
  const deaths = $derived(shown?.kind === 'dawn' ? game.morning : []);
  const out = $derived(shown?.kind === 'verdict' ? game.verdict : null);
</script>

{#if shown}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="moment {shown.kind}" class:screen onclick={() => (shown = null)} role="presentation">
    <div class="inner">
      {#if shown.kind === 'night'}
        <svg class="moon" viewBox="0 0 200 200" aria-hidden="true">
          {#each [96, 88, 80, 72] as r, i (r)}<circle cx="100" cy="100" {r} class="halo" style:animation-delay="{i * 90}ms" />{/each}
          <circle cx="100" cy="100" r="62" class="disc" />
          <circle cx="82" cy="80" r="11" class="crater" /><circle cx="122" cy="118" r="15" class="crater" /><circle cx="118" cy="74" r="6" class="crater" />
        </svg>
        <p class="kicker band">{t('night', { n: game.night })}</p>
      {:else if shown.kind === 'dawn'}
        <svg class="sun" viewBox="0 0 200 200" aria-hidden="true">
          {#each Array(20) as _, i (i)}<rect x="98" y="4" width="4" height="40" class="beam" transform="rotate({i * 18} 100 100)" />{/each}
          <circle cx="100" cy="100" r="54" class="disc" />
        </svg>
        <p class="kicker band">{t('phase:dawn')}</p>
        {#if deaths.length}
          <div class="dead">
            {#each deaths as d, i (d.id)}
              <figure style:--i={i}>
                <Card role={d.role} face={turned && d.role ? 'front' : 'back'} width={screen ? '220px' : '150px'} shine={turned && Boolean(d.role)} dead />
                <figcaption>
                  <b>{player(d.id)?.name}</b>
                  <span>{tk(`cause:${d.cause}`)}</span>
                </figcaption>
              </figure>
            {/each}
          </div>
        {:else}
          <p class="none display">{t('morningNone')}</p>
        {/if}
      {:else if out}
        <p class="kicker band">{t('phase:verdict')}</p>
        {#if out.out}
          {@const p = player(out.out)}
          <figure class="verdict">
            {#if out.idiot || out.role}
              <Card role={out.role ?? 'idiot'} face={turned ? 'front' : 'back'} width={screen ? '240px' : '170px'} shine={turned} />
            {:else if p}
              <div class="arms"><Shield avatar={p.avatar} size={screen ? 180 : 120} dead={!out.idiot} /></div>
            {/if}
            <figcaption class="display">{out.idiot ? t('verdictIdiot', { name: p?.name ?? '' }) : t('verdictOut', { name: p?.name ?? '' })}</figcaption>
          </figure>
        {:else}
          <p class="none display">{out.tie ? t('verdictTie') : t('verdictNone')}</p>
        {/if}
      {/if}
      {#if shown.line}<p class="line">{shown.line}</p>{/if}
    </div>
  </div>
{/if}

<style>
  /* Above the page's grain (app.css, z-index 100): blending it over an animating layer leaves a
     visible box. The moment carries its own grain instead. */
  .moment {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow-y: auto;
    animation: veil 0.5s ease-out both;
    cursor: pointer;
  }
  .night {
    background: var(--grain), radial-gradient(circle at 50% 38%, #262c78 0%, var(--midnight) 70%);
    background-size: 220px, auto;
    color: var(--cream);
  }
  .dawn,
  .verdict {
    background: var(--grain), radial-gradient(circle at 50% 30%, #fff6e3 0%, var(--cream) 60%);
    background-size: 220px, auto;
    color: var(--indigo);
    --pink-text: #b3124f;
  }
  @keyframes veil {
    from {
      opacity: 0;
    }
  }
  .inner {
    display: grid;
    justify-items: center;
    gap: 16px;
    max-width: 980px;
    text-align: center;
  }
  .kicker {
    margin: 0;
    font-size: 13px;
  }
  .moon,
  .sun {
    width: min(56vw, 300px);
    animation: up 1.6s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  }
  .screen .moon,
  .screen .sun {
    width: min(40vh, 420px);
  }
  @keyframes up {
    from {
      translate: 0 40%;
      opacity: 0;
      scale: 0.85;
    }
  }
  .disc {
    fill: var(--pink);
  }
  .halo {
    fill: none;
    stroke: var(--cream);
    stroke-width: 1.4;
    stroke-dasharray: 18 5;
    opacity: 0.6;
    animation: spin 14s linear infinite, fade 0.8s ease-out both;
    transform-origin: 100px 100px;
  }
  @keyframes spin {
    to {
      rotate: 1turn;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .crater {
    fill: none;
    stroke: var(--indigo);
    stroke-width: 2.4;
    opacity: 0.55;
  }
  .beam {
    fill: var(--pink);
    opacity: 0.55;
  }
  .dead {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  figure {
    margin: 0;
    display: grid;
    justify-items: center;
    gap: 10px;
    animation: deal 0.7s cubic-bezier(0.25, 1.3, 0.4, 1) both;
    animation-delay: calc(var(--i, 0) * 200ms + 300ms);
  }
  @keyframes deal {
    from {
      translate: 0 60px;
      rotate: -8deg;
      opacity: 0;
    }
  }
  figcaption {
    display: grid;
    gap: 2px;
  }
  figcaption b {
    font: 800 26px/1 var(--display);
  }
  figcaption span {
    font-size: 14px;
    color: var(--pink-text);
    font-weight: 650;
  }
  .verdict figcaption {
    font-size: clamp(30px, 6vw, 48px);
    max-width: 18ch;
    text-wrap: balance;
  }
  .none {
    margin: 0;
    font-size: clamp(32px, 6vw, 52px);
  }
  .line {
    margin: 0;
    max-width: 40ch;
    font: 500 19px/1.45 var(--ewo-serif);
    opacity: 0.9;
  }
  .screen .line {
    font-size: 28px;
  }
  @media (prefers-reduced-motion: reduce) {
    .moment,
    .moon,
    .sun,
    figure,
    .halo {
      animation: none;
    }
  }
</style>
