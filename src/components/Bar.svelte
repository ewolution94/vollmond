<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n.svelte';
  import type { Room } from '../lib/room.svelte';
  import Settings from './Settings.svelte';

  /** `room` during a village: the settings sheet then opens with "This game" (end it, leave it). */
  let {
    code,
    village,
    room = null,
    onleave,
  }: { code: string | null; village: string | null; room?: Room | null; onleave?: (from?: Event) => Promise<void> } = $props();

  let scrolled = $state(false);
  let settingsOpen = $state(false);
  let button: HTMLElement | undefined = $state();

  function closeSettings() {
    settingsOpen = false;
    button?.focus();
  }
  onMount(() => {
    const check = () => (scrolled = scrollY > 8);
    check();
    addEventListener('scroll', check, { passive: true });
    return () => removeEventListener('scroll', check);
  });
</script>

<header class="bar" class:scrolled>
  <a class="mark" href="/" aria-label="Vollmond">
    <img src="/icon.svg" alt="" width="30" height="30" />
    <span class="word">Vollmond</span>
  </a>
  <div class="end">
    {#if code}
      <span class="code" title={village ?? ''} aria-label="{t('code')} {code}">{code}</span>
    {/if}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <ewo-settings-button bind:this={button} onclick={() => (settingsOpen = true)}></ewo-settings-button>
  </div>
</header>

<Settings open={settingsOpen} onclose={closeSettings} {room} {onleave} />

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: var(--bar-h);
    padding: 0 var(--gutter);
    background: color-mix(in oklab, var(--paper) 90%, transparent);
    border-bottom: 1.5px solid transparent;
    transition: background-color 900ms ease;
  }
  .bar.scrolled {
    border-bottom-color: var(--line);
  }
  .mark {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    white-space: nowrap;
  }
  img {
    display: block;
    border-radius: 8px;
  }
  .word {
    font: 800 27px/1 var(--display);
    letter-spacing: 0.01em;
    translate: 0 -1px;
  }
  @media (hover: hover) {
    .mark:hover img {
      animation: howl 0.8s var(--ewo-ease);
      transform-origin: 50% 80%;
    }
  }
  @keyframes howl {
    30% {
      rotate: -10deg;
      scale: 1.06;
    }
    65% {
      rotate: 4deg;
    }
  }
  .end {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .code {
    padding: 6px 10px 5px;
    border-radius: 4px;
    background: var(--pink);
    color: var(--on-pink);
    font: 700 13px/1 var(--ewo-mono);
    letter-spacing: 0.2em;
    box-shadow: 2px 2px 0 var(--fill-ink);
  }
</style>
