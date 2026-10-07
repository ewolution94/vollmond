<!--
  Yours: the card (tap to turn it on a call; at a table it stays face down until held), what you
  know (the Seer's looks, your Lover, a glimpse, your potions), and for the wolves the pack with its
  whispers. At a table the ability isn't written beside the card, so a glance can't read it.
-->
<script lang="ts">
  import type { Game, View } from '../lib/api';
  import { ApiError } from '../lib/api';
  import type { Room } from '../lib/room.svelte';
  import { errorText, t, tk } from '../lib/i18n.svelte';
  import { play } from '../lib/sound';
  import { prefs } from '../lib/prefs.svelte';
  import Card from './Card.svelte';
  import Shield from './Shield.svelte';

  let { view, game, room }: { view: View; game: Game; room: Room } = $props();

  const me = $derived(game.me);
  const table = $derived(view.settings.where === 'table');
  const name = (id: string | null | undefined) => view.players.find((p) => p.id === id)?.name ?? '?';
  const player = (id: string) => view.players.find((p) => p.id === id);

  const notes = $derived.by(() => {
    if (!me) return [];
    const out: string[] = [];
    for (const k of me.knowledge) {
      if (k.type === 'seen') out.push(k.role ? t('know:seen', { n: k.night, name: name(k.target), role: tk(`role:${k.role}`) }) : t('know:seenSide', { n: k.night, name: name(k.target), side: tk(`side:${k.side}`) }));
      if (k.type === 'lover') out.push(t('know:lover', { name: name(k.partner) }) + (k.side !== me.side ? ` ${t('know:loverMixed')}` : ''));
      if (k.type === 'bound') out.push(t('know:bound', { a: name(k.a), b: name(k.b) }));
      if (k.type === 'glimpse') out.push((k.wolf ? t('know:glimpse', { n: k.night, name: name(k.wolf) }) : t('know:glimpseNone', { n: k.night })) + (k.caught ? ` ${t('know:caught')}` : ''));
      if (k.type === 'spotted') out.push(t('know:spotted', { n: k.night, name: name(k.girl) }));
    }
    if (me.potions) out.push(t('know:potions', { heal: me.potions.heal ? t('full') : t('empty'), poison: me.potions.poison ? t('full') : t('empty') }));
    return out;
  });

  let text = $state('');
  let error = $state('');
  async function whisper(event: SubmitEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      await room.act('move', { kind: 'chat', text: value });
      text = '';
      error = '';
    } catch (e) {
      error = errorText(e instanceof ApiError ? e.code : 'other');
    }
  }
  const canWhisper = $derived(Boolean(me?.alive && me.side === 'wolves' && game.phase === 'night'));
</script>

{#if me}
  <div class="mine plate">
    <div class="card-row">
      <Card
        role={me.role}
        mode={table ? 'hold' : 'tap'}
        face={table ? 'back' : 'front'}
        width="132px"
        dead={!me.alive}
        onturn={() => !table && prefs.sounds && play('flip')}
      />
      <div class="about">
        <p class="label">{t('yourCard')}</p>
        {#if table}
          <p class="hint">{t('holdToPeek')}</p>
        {:else}
          <p class="role display">{tk(`role:${me.role}`)}</p>
          <p class="ability">{tk(`ability:${me.role}`)}</p>
          <p class="hint">{t('tapToTurn')}</p>
        {/if}
      </div>
    </div>

    {#if notes.length}
      <div class="notes">
        <p class="label">{t('notes')}</p>
        <ul>{#each notes as n, i (i)}<li>{n}</li>{/each}</ul>
      </div>
    {/if}

    {#if me.pack && me.pack.length > 1}
      <div class="pack">
        <p class="label">{t('pack')}</p>
        <ul class="wolves">
          {#each me.pack as w (w.id)}
            {@const p = player(w.id)}
            <li class:gone={!w.alive}>
              {#if p}<Shield avatar={p.avatar} size={26} dead={!w.alive} />{/if}
              <span>{p?.name}</span>
              {#if w.pick}<span class="pick">→ {name(w.pick)}</span>{/if}
            </li>
          {/each}
        </ul>
        {#if me.chat?.length}
          <ol class="chat">
            {#each me.chat as m (m.at + m.from)}
              <li><b>{name(m.from)}</b> {m.text}</li>
            {/each}
          </ol>
        {/if}
        {#if canWhisper}
          <form class="say" onsubmit={whisper}>
            <input class="input" bind:value={text} maxlength="120" placeholder={t('whisper')} enterkeyhint="send" />
            <button class="btn secondary" disabled={!text.trim()}>{t('send')}</button>
          </form>
        {/if}
        {#if error}<p class="error">{error}</p>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .mine {
    display: grid;
    gap: 16px;
    padding: 18px;
  }
  .card-row {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .about {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .about p {
    margin: 0;
  }
  .role {
    font-size: 30px;
  }
  .ability {
    font-size: 15px;
    line-height: 1.4;
  }
  .hint {
    color: var(--ink-3);
    font-size: 13px;
  }
  .notes ul,
  .wolves,
  .chat {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .notes li {
    padding-left: 14px;
    position: relative;
    font-size: 15px;
  }
  .notes li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 7px;
    height: 7px;
    background: var(--pink);
    rotate: 45deg;
  }
  .wolves li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .wolves li.gone {
    opacity: 0.55;
  }
  .pick {
    color: var(--pink-text);
    font-weight: 700;
  }
  .chat {
    max-height: 180px;
    overflow-y: auto;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--ewo-fill-2);
    font-size: 14px;
  }
  .say {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
</style>
