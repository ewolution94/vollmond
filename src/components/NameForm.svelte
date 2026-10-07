<!-- Your name and your coat of arms (tap the arms to choose them), and the button that goes on. -->
<script lang="ts">
  import type { Avatar } from '../lib/api';
  import { t } from '../lib/i18n.svelte';
  import { saveArms, savedArms, savedName } from '../lib/session';
  import ArmsSheet from './ArmsSheet.svelte';
  import Shield from './Shield.svelte';

  let {
    action,
    busy = false,
    error = '',
    autofocus = false,
    onsubmit,
  }: {
    action: string;
    busy?: boolean;
    error?: string;
    autofocus?: boolean;
    onsubmit: (name: string, arms: Avatar) => void;
  } = $props();

  const random = (): Avatar => ({ field: Math.floor(Math.random() * 8), charge: Math.floor(Math.random() * 16) });
  let name = $state(savedName());
  let arms: Avatar = $state(savedArms() ?? random());
  let choosing = $state(false);
  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (autofocus && !name) input?.focus();
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    saveArms(arms);
    onsubmit(name.trim(), arms);
  }
</script>

<form class="you" onsubmit={submit}>
  <label class="label" for="name">{t('yourName')}</label>
  <div class="row">
    <button type="button" class="arms" onclick={() => (choosing = true)} aria-label={t('chooseArms')} title={t('chooseArms')}>
      <Shield avatar={arms} size={52} />
      <svg class="edit" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h4L19 9l-4-4L5 15ZM13 7l4 4" /></svg>
    </button>
    <input
      id="name"
      bind:this={input}
      class="input"
      bind:value={name}
      maxlength="24"
      autocomplete="nickname"
      enterkeyhint="go"
      placeholder={t('namePlaceholder')}
    />
  </div>
  <button class="btn primary block" disabled={busy}>{action}</button>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</form>

<ArmsSheet open={choosing} {arms} onchange={(next) => (arms = next)} onclose={() => (choosing = false)} />

<style>
  .you {
    display: grid;
    gap: 10px;
  }
  .row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .arms {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    padding: 0;
    border: 1.5px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .arms:focus-visible {
    outline: 2px solid var(--pink-text);
    outline-offset: 2px;
  }
  .edit {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 22px;
    height: 22px;
    padding: 3px;
    border-radius: 50%;
    background: var(--pink);
    fill: none;
    stroke: var(--on-pink);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .error {
    margin: 0;
  }
</style>
