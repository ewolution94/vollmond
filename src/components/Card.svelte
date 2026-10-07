<!--
  A role card, printed like the woodblocks it shows: paper, an indigo rule, the block
  (public/cards/<role>.svg, from tools/cards), the name in Grenze Gotisch and the pink side band.
  The back is the same for every card.

  It turns over in 3D, tilts with the pointer where there is one, and a foil sheen follows the light
  (the wolves' cards are holographic). How it's turned:
    static  as `face` says
    tap     a tap turns it (on a call: nobody looks over your shoulder)
    hold    face down until held, face down again when let go (at a table: neighbours can't read it)
-->
<script lang="ts">
  import type { RoleId } from '../lib/api';
  import { t, tk } from '../lib/i18n.svelte';
  import { ROLE_INFO } from '../lib/roles';

  let {
    role = null,
    face = 'front',
    mode = 'static',
    width = '200px',
    shine = false,
    dead = false,
    onturn,
  }: {
    role?: RoleId | null;
    face?: 'front' | 'back';
    mode?: 'static' | 'tap' | 'hold';
    width?: string;
    /** Foil on without a pointer (the reveal moments). */
    shine?: boolean;
    dead?: boolean;
    onturn?: (shown: 'front' | 'back') => void;
  } = $props();

  let card: HTMLElement | undefined = $state();
  let turned = $state(false);
  let held = $state(false);
  let hover = $state(false);

  const shown = $derived.by(() => {
    if (!role) return 'back';
    if (mode === 'hold') return held ? 'front' : 'back';
    if (mode === 'tap') return turned ? (face === 'front' ? 'back' : 'front') : face;
    return face;
  });
  const info = $derived(role ? ROLE_INFO[role] : null);
  const holo = $derived(info?.side === 'wolves');

  // Turning reports itself (for the flip's paper sound) when the face changes, not on the first show.
  let last: string | null = null;
  $effect(() => {
    const now = shown;
    if (last !== null && last !== now) onturn?.(now);
    last = now;
  });

  const fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tilt(e: PointerEvent) {
    if (!card || still) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const flip = shown === 'back' ? -1 : 1;
    card.style.setProperty('--ry', `${((x - 0.5) * 20 * flip).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - y) * 16).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  }
  function rest() {
    hover = false;
    card?.style.setProperty('--rx', '0deg');
    card?.style.setProperty('--ry', '0deg');
  }

  function down(e: PointerEvent) {
    if (mode !== 'hold') return;
    held = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function up() {
    if (mode === 'hold') held = false;
  }
  function click() {
    if (mode === 'tap') turned = !turned;
  }
  function key(e: KeyboardEvent) {
    if (mode === 'static') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (mode === 'tap') turned = !turned;
      else held = !held;
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={card}
  class="card"
  class:live={hover}
  class:flipped={shown === 'back'}
  class:interactive={mode !== 'static'}
  class:shine
  class:holo
  class:dead
  style:--w={width}
  role={mode === 'static' ? 'img' : 'button'}
  tabindex={mode === 'static' ? undefined : 0}
  aria-label={role && shown === 'front' ? `${tk(`role:${role}`)}: ${tk(`ability:${role}`)}` : mode === 'hold' ? t('holdToPeek') : mode === 'tap' ? t('tapToTurn') : 'Vollmond'}
  onpointerenter={() => fine && (hover = true)}
  onpointermove={(e) => fine && tilt(e)}
  onpointerleave={() => {
    rest();
    up();
  }}
  onpointerdown={down}
  onpointerup={up}
  onpointercancel={up}
  oncontextmenu={(e) => mode === 'hold' && e.preventDefault()}
  onclick={click}
  onkeydown={key}
>
  <div class="tilt">
    <div class="turn">
      <div class="face front" aria-hidden="true">
        {#if role}
          <img class="art" src="/cards/{role}.svg" alt="" draggable="false" />
          <div class="name" class:long={tk(`role:${role}`).length > 11}>{tk(`role:${role}`)}</div>
          <div class="band">{tk(`side:${info?.side}`)} · {tk(`when:${info?.when}`)}</div>
        {/if}
        <div class="foil"></div>
      </div>
      <div class="face back" aria-hidden="true">
        <img class="whole" src="/cards/back.svg" alt="" draggable="false" />
        <div class="wordmark">Vollmond</div>
        <div class="foil"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .card {
    --rx: 0deg;
    --ry: 0deg;
    --mx: 50%;
    --my: 50%;
    position: relative;
    width: var(--w);
    max-width: 100%;
    aspect-ratio: 5 / 7;
    perspective: 1100px;
    container-type: inline-size;
    border-radius: 4.2% / 3%;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
  }
  .interactive {
    cursor: pointer;
  }
  .card:focus-visible {
    outline: 2px solid var(--pink-text);
    outline-offset: 5px;
  }
  .tilt {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transform: rotateX(var(--rx)) rotateY(var(--ry));
    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .live .tilt {
    transition: transform 0.08s linear;
  }
  .turn {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(0.3, 1.35, 0.4, 1);
  }
  .flipped .turn {
    transform: rotateY(180deg);
  }
  .face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background: var(--cream) var(--grain);
    background-size: 220px;
    box-shadow:
      0 1px 0 rgb(255 255 255 / 0.4) inset,
      0 18px 36px -16px rgb(10 12 40 / 0.55),
      0 6px 14px -6px rgb(10 12 40 / 0.4);
  }
  /* The printed rule inside the edge. */
  .face::before {
    content: '';
    position: absolute;
    inset: 2.8%;
    border: max(1px, 0.4cqw) solid var(--indigo);
    border-radius: 3.2% / 2.3%;
    pointer-events: none;
  }
  .back {
    transform: rotateY(180deg);
  }
  img {
    position: absolute;
    display: block;
    pointer-events: none;
  }
  .art {
    left: 8%;
    top: 5.71%;
    width: 84%;
    height: 72.57%;
  }
  .whole {
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .name {
    position: absolute;
    left: 6%;
    right: 6%;
    top: 79.5%;
    text-align: center;
    font: 800 12.4cqw / 1 var(--display);
    color: var(--indigo);
    white-space: nowrap;
    letter-spacing: 0.005em;
  }
  /* Long names (Kleines Mädchen, Dorfbewohner) still fit on one line. */
  .name.long {
    font-size: 10.4cqw;
    top: 80.6%;
  }
  .band {
    position: absolute;
    left: 50%;
    top: 90.6%;
    translate: -50% 0;
    padding: 0.7cqw 2.4cqw 0.5cqw;
    background: var(--pink);
    color: var(--on-pink);
    font: 700 2.7cqw / 1.2 var(--ewo-mono);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    white-space: nowrap;
    mix-blend-mode: multiply;
  }
  .wordmark {
    position: absolute;
    left: 0;
    right: 0;
    top: 84.5%;
    text-align: center;
    font: 800 11cqw / 1 var(--display);
    color: var(--indigo);
  }
  .dead .front {
    filter: grayscale(0.85) contrast(0.9);
  }

  /* The foil: a soft light that follows the pointer, and on the wolves' cards a holographic band. */
  .foil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.35s;
    background: radial-gradient(farthest-corner circle at var(--mx) var(--my), rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.1) 30%, transparent 60%);
    mix-blend-mode: soft-light;
  }
  .holo .front .foil {
    background:
      radial-gradient(farthest-corner circle at var(--mx) var(--my), rgb(255 255 255 / 0.5), transparent 55%),
      repeating-linear-gradient(115deg, #ff4d9d 0%, #ffd34d 6%, #4dffc3 12%, #4dc4ff 18%, #b45bff 24%, #ff4d9d 30%);
    background-size: 100% 100%, 280% 280%;
    background-position: center, var(--mx) var(--my);
    mix-blend-mode: color-dodge;
    filter: saturate(1.1) brightness(0.62);
  }
  .live .foil {
    opacity: 0.75;
  }
  .shine .foil {
    opacity: 0.6;
    animation: sweep 2.6s ease-in-out infinite alternate;
  }
  @keyframes sweep {
    from {
      --mx: 10%;
      --my: 0%;
    }
    to {
      --mx: 90%;
      --my: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tilt,
    .turn {
      transition: none;
    }
    .shine .foil {
      animation: none;
    }
  }
</style>
