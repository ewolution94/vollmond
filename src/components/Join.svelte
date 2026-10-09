<script lang="ts">
  import { onMount } from 'svelte';
  import { api, ApiError, type RoomPhase, type SeatTicket } from '../lib/api';
  import { errorText, t } from '../lib/i18n.svelte';
  import { newKey, waitAt } from '../lib/waits';
  import NameForm from './NameForm.svelte';

  /** `onjoin` resolves once the village can show (its first view): the button waits for that. */
  let {
    code,
    onjoin,
    onback,
  }: { code: string; onjoin: (seat: SeatTicket, name: string, signal: AbortSignal) => Promise<void>; onback: () => void } = $props();

  let info: { village: string; phase: RoomPhase; players: number; full: boolean } | null = $state(null);
  let missing = $state(false);
  let error = $state('');
  /** One key per join, kept for its retries, so a timed-out first try doesn't seat you twice. */
  let key = newKey();

  onMount(() => {
    api.info(code).then(
      (i) => (info = i),
      (e) => {
        if (e instanceof ApiError && e.code === 'no-room') missing = true;
        else error = errorText(e instanceof ApiError ? e.code : 'other');
      },
    );
  });

  async function submit(name: string, arms: { field: number; charge: number }, event: SubmitEvent) {
    if (!name) {
      error = errorText('name');
      return;
    }
    error = '';
    try {
      await waitAt(event, async (signal) => onjoin(await api.join(code, name, arms, undefined, key, signal), name, signal), t('wait_join'));
      key = newKey();
    } catch (e) {
      const reason = e instanceof ApiError ? e.code : 'other';
      if (reason === 'no-room') missing = true;
      error = errorText(reason);
    }
  }
</script>

<section class="join">
  {#if missing}
    <h1 class="display">{t('noRoom')}</h1>
    <button class="btn secondary" onclick={onback}>{t('back')}</button>
  {:else}
    <p class="band">{code}</p>
    <h1 class="display">{info ? t('joinGame', { village: info.village }) : ' '}</h1>
    {#if info}
      <p class="who">{info.players === 1 ? t('joinWhoOne') : t('joinWho', { n: info.players })}</p>
      {#if info.phase === 'game'}<p class="who">{t('joinRunning')}</p>{/if}
    {/if}
    <div class="form">
      <NameForm action={t('join')} {error} autofocus onsubmit={submit} />
    </div>
  {/if}
</section>

<style>
  .join {
    display: grid;
    justify-items: center;
    gap: 12px;
    padding-top: 40px;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: clamp(40px, 9vw, 64px);
    text-wrap: balance;
    min-height: 1em;
  }
  .band {
    margin: 0;
    letter-spacing: 0.3em;
  }
  .who {
    margin: 0;
    color: var(--ink-2);
  }
  .form {
    width: min(100%, 420px);
    margin-top: 16px;
    text-align: start;
  }
</style>
