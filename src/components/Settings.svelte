<!--
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
  import { i18n, setLanguage, systemLang, t, type LangChoice } from '../lib/i18n.svelte';
  import { prefs, setPref } from '../lib/prefs.svelte';
  import { play } from '../lib/sound';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

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

<ewo-sheet {open} label={t('settings')} oncancel={onclose} onclose={onclose}>
  <span slot="heading">{t('settings')}</span>
  {#if open}
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
  h3 {
    margin: 0;
  }
</style>
