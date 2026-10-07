<!--
  The sky behind every screen, on one canvas. By day a faint halftone of the cards' indigo, still.
  At night (the dark theme, and every night of a game) stars on the indigo; during a game's night
  they twinkle and a fog drifts along the bottom. It animates only then, at 30 frames a second,
  never in a hidden tab, never under an open sheet (a blur over a moving canvas costs every frame,
  learnings/performance.md), and never with reduced motion.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    const c = canvas!;
    const ctx = c.getContext('2d')!;
    const root = document.documentElement;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const dark = matchMedia('(prefers-color-scheme: dark)');
    let w = 0, h = 0, dpr = 1, frame = 0, last = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    let fog: { x: number; y: number; r: number; v: number }[] = [];

    const isNight = () => root.classList.contains('night') || root.dataset.theme === 'dark' || (!root.dataset.theme && dark.matches);
    const moving = () => root.classList.contains('night') && !still.matches && !document.hidden && !document.querySelector('ewo-sheet[open]');

    function seed() {
      const n = Math.round((w * h) / 9000);
      stars = Array.from({ length: Math.min(n, 220) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        r: Math.random() < 0.08 ? 1.6 + Math.random() : 0.5 + Math.random() * 0.9,
        p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.8,
      }));
      fog = Array.from({ length: 7 }, (_, i) => ({ x: (i / 7) * w * 1.3, y: h * (0.82 + Math.random() * 0.14), r: 160 + Math.random() * 220, v: 6 + Math.random() * 10 }));
    }

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(performance.now());
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      if (!isNight()) {
        // Day: a halftone falling off from the top corner, like the cards' pink plate, in faint indigo.
        ctx.fillStyle = 'rgba(31, 38, 104, 0.09)';
        const pitch = 14;
        for (let y = 0; y < h; y += pitch) {
          for (let x = ((y / pitch) % 2) * pitch * 0.5; x < w; x += pitch) {
            const d = Math.hypot(x - w * 0.92, y + h * 0.05) / Math.hypot(w, h);
            const r = 2.6 * (1 - d * 1.6);
            if (r > 0.4) {
              ctx.beginPath();
              ctx.arc(x, y, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        return;
      }
      const sec = t / 1000;
      const animate = moving();
      for (const s of stars) {
        const a = animate ? 0.45 + 0.55 * Math.sin(s.p + sec * s.s) ** 2 : 0.7;
        ctx.fillStyle = `rgba(241, 232, 212, ${(a * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (root.classList.contains('night')) {
        for (const f of fog) {
          const x = animate ? ((f.x + sec * f.v) % (w + f.r * 2)) - f.r : f.x;
          const g = ctx.createRadialGradient(x, f.y, 0, x, f.y, f.r);
          g.addColorStop(0, 'rgba(170, 160, 220, 0.10)');
          g.addColorStop(1, 'rgba(170, 160, 220, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - f.r, f.y - f.r, f.r * 2, f.r * 2);
        }
      }
    }

    function loop(t: number) {
      frame = requestAnimationFrame(loop);
      if (!moving() || t - last < 33) return;
      last = t;
      draw(t);
    }

    resize();
    frame = requestAnimationFrame(loop);
    const redraw = () => draw(performance.now());
    const watch = new MutationObserver(redraw);
    watch.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    addEventListener('resize', resize);
    dark.addEventListener('change', redraw);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      removeEventListener('resize', resize);
      dark.removeEventListener('change', redraw);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }
</style>
