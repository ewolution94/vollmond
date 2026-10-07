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
  import { listNames } from '../lib/narrate';
  import { play } from '../lib/sound';
  import { prefs } from '../lib/prefs.svelte';
  import Card from './Card.svelte';
  import Shield from './Shield.svelte';

  let { view, game, room }: { view: View; game: Game; room: Room } = $props();

  const me = $derived(game.me);
  const table = $derived(view.settings.where === 'table');
  const name = (id: string | null | undefined) => view.players.find((p) => p.id === id)?.name ?? '?';
  const player = (id: string) => view.players.find((p) => p.id === id);

  const names = (ids: string[] | undefined) => listNames((ids ?? []).map(name));
  const others = (ids: string[] | undefined) => names((ids ?? []).filter((id) => id !== me?.id));
  const role = (id: string | null | undefined) => (id ? tk(`role:${id}`) : '?');
  const oneNight = $derived(game.mode === 'onenight');
  /** Roles that work differently in One night. */
  const ONE_NIGHT_ABILITY = new Set(['werewolf', 'seer', 'hunter']);

  const notes = $derived.by(() => {
    if (!me) return [];
    const out: string[] = [];
    for (const k of me.knowledge) {
      const n = k.night ?? 0;
      switch (k.type) {
        case 'seen':
          if (k.card) out.push(t('know:seenOne', { name: name(k.target), role: role(k.card) }));
          else out.push(k.role ? t('know:seen', { n, name: name(k.target), role: role(k.role) }) : t('know:seenSide', { n, name: name(k.target), side: tk(`side:${k.side}`) }));
          break;
        case 'lover':
          out.push(t('know:lover', { name: name(k.partner) }) + (k.side !== me.side ? ` ${t('know:loverMixed')}` : ''));
          break;
        case 'bound':
          out.push(t('know:bound', { a: name(k.a), b: name(k.b) }));
          break;
        case 'glimpse':
          out.push((k.wolf ? t('know:glimpse', { n, name: name(k.wolf) }) : t('know:glimpseNone', { n })) + (k.caught ? ` ${t('know:caught')}` : ''));
          break;
        case 'spotted':
          out.push(t('know:spotted', { n, name: name(k.girl) }));
          break;
        case 'took':
          out.push(k.role ? t('know:took', { role: role(k.role) }) : t('know:kept'));
          break;
        case 'model':
          out.push(t('know:model', { name: name(k.target) }));
          break;
        case 'turned':
          out.push(t('know:turned'));
          break;
        case 'infected':
          out.push(t('know:infected'));
          break;
        case 'siblings':
          out.push(t('know:siblings', { names: others(k.ids) }));
          break;
        case 'fox':
          out.push(t('know:fox', { n, names: names(k.ids), found: t(k.found ? 'know:foxYes' : 'know:foxNo') }));
          break;
        case 'charmed':
          out.push(t('know:charmed', { names: names(k.ids) }));
          break;
        // One night
        case 'pack':
          if (k.ids) out.push(k.ids.length > 1 ? t('know:packOne', { names: names(k.ids) }) : t('know:lone'));
          break;
        case 'middle':
          out.push(t('know:middle', { n: (k.index ?? 0) + 1, role: role(k.card) }));
          break;
        case 'middle2':
          out.push(t('know:middle2', { roles: listNames((k.cards ?? []).map(role)) }));
          break;
        case 'wolves':
          out.push(k.ids?.length ? t('know:wolves', { names: names(k.ids) }) : t('know:wolvesNone'));
          break;
        case 'masons':
          out.push(t('know:masons', { names: names(k.ids) }));
          break;
        case 'robbed':
          out.push(t('know:robbed', { name: name(k.target), role: role(k.card) }));
          break;
        case 'swapped':
          out.push(t('know:swapped', { a: name(k.a), b: name(k.b) }));
          break;
        case 'drank':
          out.push(t('know:drank', { n: (k.index ?? 0) + 1 }));
          break;
        case 'woke':
          out.push(t('know:woke', { role: role(k.card) }));
          break;
      }
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
          <p class="ability">{oneNight && ONE_NIGHT_ABILITY.has(me.role) ? tk(`ability1:${me.role}`) : tk(`ability:${me.role}`)}</p>
          <p class="hint">{t('tapToTurn')}</p>
        {/if}
        {#if oneNight && game.phase !== 'end'}
          <p class="hint changed">{['deal', 'night'].includes(game.phase) ? t('know:mayChange') : t('know:mayHaveChanged')}</p>
        {:else if oneNight && me.final}
          <p class="hint changed">{t('endedAs', { role: role(me.final) })}</p>
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
  .changed {
    color: var(--pink-text);
    font-weight: 600;
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
