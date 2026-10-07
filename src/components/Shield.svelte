<!--
  A player's coat of arms, printed in the cards' two inks: a heater shield with one of eight
  divisions (plain, per pale, per fess, per bend, quarterly, a bordure, a chevron) and one of
  sixteen charges, cut in paper with an ink outline so it reads on any field. Dead players' arms
  are struck through in pink.
-->
<script lang="ts" module>
  /** Charges in a 100 × 100 box, centred on 50, 50. */
  export const CHARGES = [
    // crescent
    'M62 22A30 30 0 1 0 62 78A24 24 0 1 1 62 22Z',
    // star
    'M50 18L58 41L82 41L63 55L70 79L50 64L30 79L37 55L18 41L42 41Z',
    // tower
    'M30 80V38H36V30H44V38H48V30H56V38H60V30H68V38H70V80H57V62A7 7 0 0 0 43 62V80Z',
    // key
    'M34 30A12 12 0 1 1 34 54A12 12 0 1 1 34 30ZM34 37A5 5 0 1 0 34 47A5 5 0 1 0 34 37ZM44 39H80V45H74V53H68V45H62V51H56V45H44Z',
    // crown
    'M24 70L20 34L36 50L50 26L64 50L80 34L76 70Z',
    // fish
    'M18 50C30 32 56 30 70 46L84 34V66L70 54C56 70 30 68 18 50ZM32 46A3 3 0 1 0 32 52A3 3 0 1 0 32 46Z',
    // bird
    'M20 56C32 50 40 38 52 38C60 38 64 42 68 46L82 44L72 52C70 64 58 72 44 72C34 72 26 66 20 56ZM58 44A3 3 0 1 0 58 50A3 3 0 1 0 58 44Z',
    // tree
    'M46 84V64C32 64 22 54 24 42C26 30 36 24 44 26C46 18 58 16 64 24C74 24 80 34 76 44C80 56 68 66 54 64V84Z',
    // sword
    'M47 16H53V60H66V66H53V76H57V84H43V76H47V66H34V60H47Z',
    // chalice
    'M28 22H72C72 44 62 54 54 56V70H64V78H36V70H46V56C38 54 28 44 28 22Z',
    // wheel
    'M50 20A30 30 0 1 1 50 80A30 30 0 1 1 50 20ZM50 30A20 20 0 1 0 50 70A20 20 0 1 0 50 30ZM47 30H53V70H47ZM30 47H70V53H30Z',
    // bell
    'M50 18C56 18 58 22 58 26C68 30 72 42 72 56C72 64 78 68 82 72H18C22 68 28 64 28 56C28 42 32 30 42 26C42 22 44 18 50 18ZM44 76H56A6 6 0 0 1 44 76Z',
    // horseshoe
    'M28 26H40V54A10 10 0 0 0 60 54V26H72V54A22 22 0 0 1 28 54Z',
    // axe
    'M46 16H52V84H46ZM52 22C66 22 78 32 80 46C72 42 62 44 52 48Z',
    // mushroom
    'M18 52C18 32 34 22 50 22C66 22 82 32 82 52ZM42 52H58L62 80H38Z',
    // rose
    'M50 20C58 20 62 28 60 36C68 32 78 38 76 46C82 52 78 62 70 62C72 70 64 78 56 74C52 82 40 82 38 74C30 78 22 70 26 62C18 62 14 52 20 46C18 38 28 32 36 36C34 28 42 20 50 20ZM50 42A8 8 0 1 0 50 58A8 8 0 1 0 50 42Z',
  ];
</script>

<script lang="ts">
  import type { Avatar } from '../lib/api';

  let {
    avatar,
    size = 48,
    dead = false,
    title = '',
  }: { avatar: Avatar; size?: number | string; dead?: boolean; title?: string } = $props();

  const SHIELD = 'M8 6H92V44C92 72 72 88 50 96C28 88 8 72 8 44Z';
  const uid = $props.id();
  const field = $derived(avatar.field % 8);
  const charge = $derived(CHARGES[avatar.charge % CHARGES.length]);
</script>

<svg
  class="shield"
  viewBox="0 0 100 100"
  width={size}
  height={size}
  role={title ? 'img' : undefined}
  aria-label={title || undefined}
  aria-hidden={title ? undefined : 'true'}
>
  <defs>
    <clipPath id="s{uid}"><path d={SHIELD} /></clipPath>
  </defs>
  <g class:faded={dead}>
  <g clip-path="url(#s{uid})">
    {#if field === 0}
      <rect width="100" height="100" fill="var(--indigo)" />
    {:else if field === 1}
      <rect width="100" height="100" fill="var(--pink)" />
    {:else if field === 2}
      <rect width="100" height="100" fill="var(--cream)" /><rect width="50" height="100" fill="var(--indigo)" />
    {:else if field === 3}
      <rect width="100" height="100" fill="var(--indigo)" /><rect width="100" height="48" fill="var(--pink)" />
    {:else if field === 4}
      <rect width="100" height="100" fill="var(--pink)" /><path d="M0 0H100L0 100Z" fill="var(--indigo)" />
    {:else if field === 5}
      <rect width="100" height="100" fill="var(--cream)" /><path d="M0 0H50V50H100V100H50V50H0Z" fill="var(--indigo)" />
    {:else if field === 6}
      <rect width="100" height="100" fill="var(--indigo)" /><path d="M18 16H82V44C82 64 68 76 50 84C32 76 18 64 18 44Z" fill="var(--cream)" />
    {:else}
      <rect width="100" height="100" fill="var(--indigo)" /><path d="M0 74L50 34L100 74V100H0Z" fill="var(--pink)" />
    {/if}
    <path class="charge" d={charge} transform="translate(50 52) scale(0.62) translate(-50 -50)" />
  </g>
  <path d={SHIELD} class="rim" />
  </g>
  {#if dead}
    <path d="M20 18L80 82M80 18L20 82" class="strike" />
  {/if}
</svg>

<style>
  .shield {
    display: block;
    flex: none;
    overflow: visible;
  }
  .charge {
    fill: var(--cream);
    stroke: var(--indigo);
    stroke-width: 4;
    stroke-linejoin: round;
    paint-order: stroke;
  }
  /* The rim is the page's ink: indigo on paper, paper-coloured at night. */
  .rim {
    fill: none;
    stroke: var(--ink);
    stroke-width: 4.5;
    stroke-linejoin: round;
  }
  .faded {
    filter: grayscale(1);
    opacity: 0.55;
  }
  .strike {
    fill: none;
    stroke: var(--pink);
    stroke-width: 9;
    stroke-linecap: round;
  }
</style>
