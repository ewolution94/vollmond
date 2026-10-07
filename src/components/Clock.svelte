<!-- The time left, in big figures; it turns pink in the last ten seconds. -->
<script lang="ts">
  let { left }: { left: number } = $props();
  const secs = $derived(Math.ceil(left / 1000));
  const text = $derived(secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : String(secs));
</script>

{#if left > 0}
  <span class="clock" class:urgent={secs <= 10} aria-live="off">{text}</span>
{/if}

<style>
  .clock {
    font: 800 max(28px, 9cqw) / 1 var(--display);
    font-variant-numeric: tabular-nums;
    color: var(--indigo);
    text-shadow: 0 0 1px var(--cream);
  }
  .urgent {
    color: var(--cream);
    text-shadow: 2px 2px 0 var(--indigo);
    animation: thump 1s ease-in-out infinite;
  }
  @keyframes thump {
    50% {
      transform: scale(1.12);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .urgent {
      animation: none;
    }
  }
</style>
