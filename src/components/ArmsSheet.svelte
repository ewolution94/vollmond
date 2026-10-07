<!--
  Choosing your coat of arms: Folio's emblem maker (plans/emblems.md) in a sheet, opened from the
  arms beside the name field and from your own arms in the lobby. Arrows step the field and the
  charge, the dice rolls both; every change is kept on this device at once.
-->
<script lang="ts">
  import type { Avatar } from '../lib/api';
  import { t } from '../lib/i18n.svelte';
  import { saveArms } from '../lib/session';

  let { open, arms, onchange, onclose }: { open: boolean; arms: Avatar; onchange: (arms: Avatar) => void; onclose: () => void } = $props();

  // The maker stays until the sheet has slid away (learnings/dialogs-and-overlays.md).
  let shown = $state(false);
  $effect(() => {
    if (open) shown = true;
  });

  function closed() {
    shown = false;
    onclose();
  }

  function change(value: number[]) {
    const next = { field: value[0], charge: value[1] };
    saveArms(next);
    onchange(next);
  }
</script>

<ewo-sheet {open} label={t('yourArms')} oncancel={onclose} onclose={closed}>
  <span slot="heading">{t('yourArms')}</span>
  {#if shown}
    <div class="body">
      <ewo-emblem-maker theme="heraldry" value={[arms.field, arms.charge]} onchange={(e) => change(e.detail.value)}></ewo-emblem-maker>
      <button class="btn primary block" type="button" onclick={onclose}>{t('armsDone')}</button>
    </div>
  {/if}
</ewo-sheet>

<style>
  .body {
    display: grid;
    gap: 18px;
    padding-bottom: 8px;
  }
  ewo-emblem-maker {
    --ewo-emblem-maker-size: 180px;
  }
  ewo-emblem-maker::part(stage) {
    background: var(--paper-2);
  }
  ewo-emblem-maker::part(tag) {
    background: var(--pink);
    color: var(--on-pink);
    font-family: var(--ewo-mono);
  }
</style>
