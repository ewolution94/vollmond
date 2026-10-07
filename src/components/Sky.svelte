<!--
  The sky behind every screen. By day a faint halftone of the cards' indigo, still. At night (the
  dark theme, and every night of a game) stars on the indigo; during a game's night they twinkle and
  a fog drifts along the bottom.

  Everything is drawn once (on load, a resize, a change of theme or of night) and then only moved by
  the compositor: the stars sit on three canvases whose opacity breathes at different speeds, the fog
  on a canvas twice the screen's width that slides by one width and starts over. Until 2026-10-08 a
  canvas was redrawn 30 times a second at night; on a phone that took about three quarters of the main
  thread and every tap felt late. The motion stops under an open sheet (a blur over a moving layer
  costs every frame, learnings/performance.md) and with reduced motion.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  let base: HTMLCanvasElement | undefined = $state();
  let twinkles: HTMLCanvasElement[] = $state([]);
  let fogCanvas: HTMLCanvasElement | undefined = $state();
  let fogSeconds = $state(40);

  const GROUPS = 3;

  onMount(() => {
    const root = document.documentElement;
    const dark = matchMedia('(prefers-color-scheme: dark)');
    let w = 0, h = 0;
    let stars: { x: number; y: number; r: number; g: number }[] = [];
    let fog: { x: number; y: number; r: number }[] = [];

    const isNight = () => root.classList.contains('night') || root.dataset.theme === 'dark' || (!root.dataset.theme && dark.matches);

    function seed() {
      const n = Math.round((w * h) / 9000);
      stars = Array.from({ length: Math.min(n, 220) }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        r: Math.random() < 0.08 ? 1.6 + Math.random() : 0.5 + Math.random() * 0.9,
        g: i % GROUPS,
      }));
      // As many banks of fog as the old drifting sky showed at once (seven over a width plus their
      // own), across one screen's width; the canvas holds it twice, so the slide loops.
      const banks = Math.max(2, Math.round((7 * w) / (w + 540)));
      fog = Array.from({ length: banks }, (_, i) => ({ x: ((i + Math.random() * 0.6) / banks) * w, y: h * (0.82 + Math.random() * 0.14), r: 160 + Math.random() * 220 }));
    }

    /** A canvas sized to the screen at a given density, cleared, with its context scaled. */
    function prepare(c: HTMLCanvasElement, width: number, height: number, density: number) {
      c.width = Math.max(1, Math.round(width * density));
      c.height = Math.max(1, Math.round(height * density));
      const ctx = c.getContext('2d')!;
      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.clearRect(0, 0, width, height);
      return ctx;
    }

    function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw() {
      if (!base) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      // The twinkling layers carry only small dots: a lower density keeps their memory small.
      const light = Math.min(dpr, 1.5);
      const ctx = prepare(base, w, h, dpr);
      const night = isNight();
      if (!night) {
        // Day: a halftone falling off from the top corner, like the cards' pink plate, in faint indigo.
        ctx.fillStyle = 'rgba(31, 38, 104, 0.09)';
        const pitch = 14;
        for (let y = 0; y < h; y += pitch) {
          for (let x = ((y / pitch) % 2) * pitch * 0.5; x < w; x += pitch) {
            const d = Math.hypot(x - w * 0.92, y + h * 0.05) / Math.hypot(w, h);
            const r = 2.6 * (1 - d * 1.6);
            if (r > 0.4) dot(ctx, x, y, r);
          }
        }
        for (const c of twinkles) prepare(c, 1, 1, 1);
        if (fogCanvas) prepare(fogCanvas, 1, 1, 1);
        return;
      }
      // Night: every star faint on the base, and brighter on its twinkling layer.
      ctx.fillStyle = 'rgba(241, 232, 212, 0.38)';
      for (const s of stars) dot(ctx, s.x, s.y, s.r);
      twinkles.forEach((c, g) => {
        const t = prepare(c, w, h, light);
        t.fillStyle = 'rgba(241, 232, 212, 0.85)';
        for (const s of stars) if (s.g === g) dot(t, s.x, s.y, s.r);
      });
      if (fogCanvas) {
        // Fog is soft: half density is plenty.
        const f = prepare(fogCanvas, w * 2, h, 0.5);
        for (const copy of [0, w]) {
          for (const b of fog) {
            for (const x of [b.x + copy, b.x + copy - w * 2, b.x + copy + w * 2]) {
              const g = f.createRadialGradient(x, b.y, 0, x, b.y, b.r);
              g.addColorStop(0, 'rgba(170, 160, 220, 0.10)');
              g.addColorStop(1, 'rgba(170, 160, 220, 0)');
              f.fillStyle = g;
              f.fillRect(x - b.r, b.y - b.r, b.r * 2, b.r * 2);
            }
          }
        }
        fogSeconds = Math.max(30, Math.round(w / 10));
      }
    }

    function resize() {
      w = innerWidth;
      h = innerHeight;
      seed();
      draw();
    }

    resize();
    const watch = new MutationObserver(draw);
    watch.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    addEventListener('resize', resize);
    dark.addEventListener('change', draw);
    return () => {
      watch.disconnect();
      removeEventListener('resize', resize);
      dark.removeEventListener('change', draw);
    };
  });
</script>

<div class="sky" aria-hidden="true">
  <canvas bind:this={base}></canvas>
  {#each Array(GROUPS) as _, i (i)}
    <canvas class="twinkle" style:--i={i} bind:this={twinkles[i]}></canvas>
  {/each}
  <canvas class="fog" style:--fog={`${fogSeconds}s`} bind:this={fogCanvas}></canvas>
</div>

<style>
  .sky {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100vw;
    height: 100vh;
  }
  /* Still stars (the dark theme outside a game, reduced motion, under a sheet) sit half lit. */
  .twinkle {
    opacity: 0.5;
  }
  .fog {
    display: none;
    width: 200vw;
  }
  :global(:root.night) .twinkle {
    animation: twinkle calc(2.3s + var(--i) * 0.9s) ease-in-out calc(var(--i) * -1.1s) infinite alternate;
  }
  :global(:root.night) .fog {
    display: block;
    animation: drift var(--fog) linear infinite;
  }
  @keyframes twinkle {
    from {
      opacity: 0.15;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes drift {
    to {
      translate: -100vw 0;
    }
  }
  /* Nothing moves under an open sheet's blur. */
  :global(:root:has(ewo-sheet[open])) .twinkle,
  :global(:root:has(ewo-sheet[open])) .fog {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:root.night) .twinkle,
    :global(:root.night) .fog {
      animation: none;
    }
  }
</style>
