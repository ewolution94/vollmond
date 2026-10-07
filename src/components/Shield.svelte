<!--
  A player's coat of arms: Folio's emblem in its `heraldry` theme (plans/emblems.md), a heater shield
  with one of eight divisions and one of sixteen charges, printed in the cards' inks (--ewo-emblem-*
  in app.css). Dead players' arms are greyed and struck through in pink. It drew the shield itself
  until 2026-10-07; Folio's is pixel-identical, so this only keeps the props every page passes.
-->
<script lang="ts">
  import type { Avatar } from '../lib/api';

  let {
    avatar,
    size = 48,
    dead = false,
    title = '',
  }: { avatar: Avatar; size?: number | string; dead?: boolean; title?: string } = $props();
</script>

<ewo-emblem class="shield" theme="heraldry" value={[avatar.field, avatar.charge]} size={String(size)} {dead} label={title || undefined}></ewo-emblem>

<style>
  .shield {
    display: block;
  }
</style>
