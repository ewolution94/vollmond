<script lang="ts">
  import { api, ApiError, CODE, type SeatTicket } from '../lib/api';
  import { errorText, t } from '../lib/i18n.svelte';
  import { newKey, waitAt } from '../lib/waits';
  import Card from './Card.svelte';
  import NameForm from './NameForm.svelte';

  /** `oncreate` resolves once the new village can show (its first view): the button waits for that. */
  let {
    oncreate,
    onjoin,
  }: { oncreate: (seat: SeatTicket, name: string, signal: AbortSignal) => Promise<void>; onjoin: (code: string) => void } = $props();

  let code = $state('');
  let error = $state('');
  const validCode = $derived(CODE.test(code));
  /** One key per "Found a village", kept for its retries (a timed-out first try may have made it). */
  let key = newKey();

  async function create(name: string, arms: { field: number; charge: number }, event: SubmitEvent) {
    if (!name) {
      error = errorText('name');
      return;
    }
    error = '';
    try {
      await waitAt(event, async (signal) => oncreate(await api.create(name, arms, key, signal), name, signal), t('wait_create'));
      key = newKey();
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    }
  }

  function join(event: SubmitEvent) {
    event.preventDefault();
    if (validCode) onjoin(code);
  }

  function typeCode(event: Event & { currentTarget: HTMLInputElement }) {
    code = event.currentTarget.value.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXZ]/g, '').slice(0, 4);
    event.currentTarget.value = code;
  }

  // The fan on the start page: the back, the Seer, the Werewolf in the middle, the Witch, the back.
  const FAN = [
    { role: null, angle: -24, x: -150, y: 34 },
    { role: 'seer', angle: -12, x: -78, y: 8 },
    { role: 'werewolf', angle: 0, x: 0, y: -6 },
    { role: 'witch', angle: 12, x: 78, y: 8 },
    { role: null, angle: 24, x: 150, y: 34 },
  ] as const;
</script>

<section class="home">
  <div class="hero">
    <div class="fan" aria-hidden="true">
      {#each FAN as c, i (i)}
        <div class="slot" style:--a="{c.angle}deg" style:--x="{c.x}px" style:--y="{c.y}px" style:--i={i}>
          <Card role={c.role} face={c.role ? 'front' : 'back'} width="100%" />
        </div>
      {/each}
    </div>
    <h1 class="title display">Vollmond</h1>
    <p class="tagline">{t('tagline')}</p>
  </div>

  <div class="forms">
    <NameForm action={t('newGame')} {error} onsubmit={create} />
    <div class="or"><span>{t('or')}</span></div>
    <form class="join" onsubmit={join}>
      <label class="label" for="code">{t('code')}</label>
      <div class="row">
        <input
          id="code"
          class="input code"
          value={code}
          oninput={typeCode}
          inputmode="text"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="go"
          placeholder={t('codePlaceholder')}
        />
        <button class="btn secondary" disabled={!validCode}>{t('join')}</button>
      </div>
    </form>
  </div>
</section>

<style>
  .home {
    display: grid;
    justify-items: center;
    gap: 28px;
    padding-top: 12px;
  }
  /* The hand fans out past a phone's edges. The hero reaches into the page's gutter and clips there,
     so the cards look cut by the screen as before, but no phone widens the page to fit them. */
  .hero {
    display: grid;
    justify-items: center;
    gap: 8px;
    justify-self: stretch;
    margin-inline: calc(-1 * var(--gutter));
    padding-inline: var(--gutter);
    overflow-x: clip;
    text-align: center;
  }
  .fan {
    position: relative;
    width: min(100%, 420px);
    height: 230px;
    margin-bottom: 4px;
  }
  .slot {
    position: absolute;
    left: 50%;
    top: 12px;
    width: 128px;
    translate: calc(-50% + var(--x)) var(--y);
    rotate: var(--a);
    transform-origin: 50% 120%;
    animation: deal 0.9s cubic-bezier(0.25, 1.2, 0.4, 1) both;
    animation-delay: calc(var(--i) * 80ms + 120ms);
    z-index: calc(10 - (var(--i) - 2) * (var(--i) - 2));
  }
  @keyframes deal {
    from {
      translate: -50% 120px;
      rotate: 0deg;
      opacity: 0;
    }
  }
  @media (max-width: 480px) {
    .fan {
      height: 190px;
    }
    .slot {
      width: 104px;
      translate: calc(-50% + var(--x) * 0.72) var(--y);
    }
  }
  .title {
    margin: 0;
    font-size: clamp(64px, 16vw, 112px);
    text-shadow: 3px 3px 0 var(--pink);
  }
  .tagline {
    margin: 0;
    max-width: 30ch;
    color: var(--ink-2);
    font-size: 16px;
    text-wrap: balance;
  }
  .forms {
    display: grid;
    gap: 20px;
    width: min(100%, 420px);
  }
  .or {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink-3);
    font: 600 12px/1 var(--ewo-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .or::before,
  .or::after {
    content: '';
    flex: 1;
    border-top: 1.5px dashed var(--line);
  }
  .join {
    display: grid;
    gap: 10px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .code {
    font: 700 20px/1 var(--ewo-mono);
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }
  @media (prefers-reduced-motion: reduce) {
    .slot {
      animation: none;
    }
  }
</style>
