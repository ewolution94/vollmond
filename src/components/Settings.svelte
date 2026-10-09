<!--
  During a game (`room` given, and a game running) it opens with "This game" first: the host can end it
  for everyone, anyone can leave, each after a second tap that says what it does
  (development/plans/end-game.md, Kritzle's pattern).

  Settings, the family's way (plans/settings-alignment.md): Folio's ewo-sheet, opened from the
  bar's ewo-settings-button, with General first (ewo-settings-basics: Language and Theme). Then what
  this device does by itself: sounds and the narrator's voice. The game's own rules live in the
  lobby, with the host.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { themeShift } from '../../vendor/ewo/elements/theme-shift.js';
  import { setTheme, storedTheme, type ThemeChoice } from '../../vendor/ewo/elements/theme-toggle.js';
  import { effectiveTheme, onThemeChange } from '../../vendor/ewo/elements/base.js';
  import { ApiError } from '../lib/api';
  import { errorText, i18n, setLanguage, systemLang, t, type LangChoice } from '../lib/i18n.svelte';
  import type { Room } from '../lib/room.svelte';
  import { actAt } from '../lib/waits';
  import { prefs, setPref } from '../lib/prefs.svelte';
  import { play } from '../lib/sound';

  let {
    open,
    onclose,
    room = null,
    onleave,
  }: { open: boolean; onclose: () => void; room?: Room | null; onleave?: (from?: Event) => Promise<void> } = $props();

  const view = $derived(room?.view ?? null);
  /** Only while a game runs: in the lobby the page has its own "leave", and the end has "play again". */
  const running = $derived(Boolean(view?.game && view.phase === 'game' && view.game.phase !== 'end'));
  const isHost = $derived(Boolean(view && room && view.host === room.seat.player));
  const hostName = $derived(view?.players.find((p) => p.id === view.host)?.name ?? '');
  /** Which of the two waits for its second tap. */
  let sure: 'end' | 'leave' | null = $state(null);
  let gameError = $state('');
  $effect(() => {
    if (!open) {
      sure = null;
      gameError = '';
    }
  });

  async function endGame(from: Event) {
    gameError = '';
    try {
      await actAt(room!, 'end', undefined, from);
      onclose();
    } catch (e) {
      gameError = errorText(e instanceof ApiError ? e.code : 'other');
    }
  }

  async function leaveGame(from: Event) {
    gameError = '';
    await onleave?.(from);
    onclose();
  }

  // The content stays until the sheet has slid away: taken out when `open` turns false, it left the
  // closing sheet a bare header, a dark box sliding down (the "black box" on close, 2026-10-07).
  let shown = $state(false);
  $effect(() => {
    if (open) shown = true;
  });
  function closed() {
    shown = false;
    onclose();
  }

  let theme: ThemeChoice = $state(storedTheme());
  onMount(() => onThemeChange(() => (theme = storedTheme())));

  function pickLanguage(next: LangChoice) {
    if (next === i18n.choice) return;
    const shows = next === 'system' ? systemLang() : next;
    if (shows === i18n.lang) setLanguage(next);
    else themeShift(() => setLanguage(next));
  }

  function pickTheme(next: ThemeChoice) {
    if (next === theme) return;
    theme = next;
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const shows = next === 'system' ? (prefersDark ? 'dark' : 'light') : next;
    if (shows === effectiveTheme()) setTheme(next);
    else themeShift(() => setTheme(next));
  }
</script>

<ewo-sheet {open} label={t('settings')} oncancel={onclose} onclose={closed}>
  <span slot="heading">{t('settings')}</span>
  {#if shown}
    {#if running}
      <section class="game">
        <h3 class="label">{t('thisGame')}</h3>
        {#if sure === 'end'}
          <p class="sure">{t('endSure')}</p>
          <div class="pair">
            <button class="btn pink" type="button" onclick={endGame}>{t('endYes')}</button>
            <button class="btn secondary" type="button" onclick={() => (sure = null)}>{t('keepPlaying')}</button>
          </div>
        {:else if sure === 'leave'}
          <p class="sure">{isHost ? t('leaveSureHost') : t('leaveSure')}</p>
          <div class="pair">
            <button class="btn pink" type="button" onclick={leaveGame}>{t('leaveYes')}</button>
            <button class="btn secondary" type="button" onclick={() => (sure = null)}>{t('keepPlaying')}</button>
          </div>
        {:else}
          <div class="pair">
            {#if isHost}
              <button class="btn secondary" type="button" onclick={() => (sure = 'end')}>
                <svg class="stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>
                {t('endGame')}
              </button>
            {/if}
            <button class="btn quiet" type="button" onclick={() => (sure = 'leave')}>{t('leaveGame')}</button>
          </div>
          {#if !isHost}<p class="hint">{t('endHint', { name: hostName })}</p>{/if}
        {/if}
        {#if gameError}<p class="error" role="alert">{gameError}</p>{/if}
      </section>
    {/if}
    <section>
      <h3 class="label">{t('general')}</h3>
      <ewo-settings-basics
        language={i18n.choice}
        {theme}
        onlanguage-change={(e) => pickLanguage(e.detail.value)}
        ontheme-change={(e) => pickTheme(e.detail.value)}
      ></ewo-settings-basics>
    </section>
    <section>
      <h3 class="label">{t('thisDevice')}</h3>
      <ewo-switch
        row
        tone="accent"
        checked={prefs.sounds}
        onchange={(e) => {
          setPref('sounds', e.detail.checked);
          if (e.detail.checked) play('dawn');
        }}
      >
        {t('sounds')}
        <span slot="hint">{t('soundsHint')}</span>
      </ewo-switch>
      <ewo-switch row tone="accent" checked={prefs.voice} onchange={(e) => setPref('voice', e.detail.checked)}>
        {t('voice')}
        <span slot="hint">{t('voiceHint')}</span>
      </ewo-switch>
    </section>
  {/if}
</ewo-sheet>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 16px;
  }
  .game {
    margin-bottom: 4px;
    border-bottom: 1px solid var(--line-2);
  }
  .pair {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .sure {
    margin: 0;
    font-weight: 600;
  }
  .hint,
  .error {
    margin: 0;
  }
  .hint {
    color: var(--ink-3);
    font-size: 14px;
  }
  .stop {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  h3 {
    margin: 0;
  }
</style>
