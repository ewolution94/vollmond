import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, advance, createOneNight, view } from '../server/onenight.mjs';
import { suggestedDeck, deckProblem } from '../server/roles.mjs';
import { seeded, SETTINGS } from './helpers.mjs';

/** A One night table with a fixed deal: cards[i] to p<i>, the rest in the middle. */
function night(cards, center, over = {}) {
  const players = cards.map((_, i) => ({ id: `p${i}` }));
  const deck = {};
  for (const c of [...cards, ...center]) deck[c] = (deck[c] ?? 0) + 1;
  let now = 0;
  const g = createOneNight({ players, settings: { ...SETTINGS, mode: 'onenight', debate: 300, ...over }, deck, rng: seeded(3), now, cards, center });
  const t = {
    g,
    act: (id, move) => act(g, id, move, now),
    wait() {
      now = g.deadline ?? now;
      advance(g, now);
    },
    view: (id = null) => view(g, id),
    /** Everyone ready, then the night with these moves; the rest answer their decoy. */
    play(moves = {}) {
      for (const id of g.prompts.keys()) act(g, id, { kind: 'ready' }, now);
      t.wait();
      for (const [id, p] of g.prompts) {
        if (moves[id]) act(g, id, moves[id], now);
        else if (p.options) act(g, id, { kind: 'pick', target: p.options[0] }, now);
      }
      t.wait();
    },
    vote(votes) {
      t.wait();
      for (const [id, target] of Object.entries(votes)) act(g, id, { kind: 'pick', target }, now);
      t.wait();
    },
  };
  return t;
}

const know = (t, id, type) => t.view(id).me.knowledge.find((k) => k.type === type);

test('a suggested One night deck has three cards more than players', () => {
  for (let n = 3; n <= 10; n++) {
    const deck = suggestedDeck(n, 'onenight');
    assert.equal(Object.values(deck).reduce((a, b) => a + b, 0), n + 3, `n=${n}`);
    assert.equal(deckProblem(deck, n, 'onenight'), null, `n=${n}`);
  }
});

test('the night resolves in order: the seer sees before the robber robs, the insomniac wakes last', () => {
  const t = night(['werewolf', 'seer', 'robber', 'troublemaker', 'insomniac'], ['villager', 'drunk', 'werewolf']);
  t.play({
    p0: { kind: 'center', index: 1 },
    p1: { kind: 'pick', target: 'p0' },
    p2: { kind: 'pick', target: 'p0' },
    p3: { kind: 'pair', a: 'p2', b: 'p4' },
  });
  assert.equal(t.g.phase, 'debate');
  assert.deepEqual(know(t, 'p0', 'middle'), { type: 'middle', index: 1, card: 'drunk' }, 'a lone wolf looks at the middle');
  assert.equal(know(t, 'p1', 'seen').card, 'werewolf', 'the seer saw the card before the robbery');
  assert.equal(know(t, 'p2', 'robbed').card, 'werewolf', 'the robber took the wolf');
  // Robber (now wolf) and insomniac swapped by the troublemaker: the insomniac wakes as the wolf.
  assert.equal(know(t, 'p4', 'woke').card, 'werewolf');
  assert.equal(t.g.seats[0].now, 'robber');
  assert.equal(t.g.seats[2].now, 'insomniac');
  assert.equal(t.view('p2').me.final, null, 'nobody sees the final cards before the end');
});

test('wolves see each other, the minion sees them, masons see each other', () => {
  const t = night(['werewolf', 'werewolf', 'minion', 'mason', 'mason'], ['villager', 'villager', 'seer']);
  t.play();
  assert.deepEqual(know(t, 'p0', 'pack').ids, ['p0', 'p1']);
  assert.deepEqual(know(t, 'p2', 'wolves').ids, ['p0', 'p1']);
  assert.deepEqual(know(t, 'p4', 'masons').ids, ['p3', 'p4']);
  assert.equal(t.g.phase, 'debate');
});

test('the drunk swaps with the middle without looking, at random if time runs out', () => {
  const t = night(['werewolf', 'drunk', 'villager'], ['seer', 'villager', 'robber']);
  t.play({ p0: { kind: 'center', index: 0 }, p1: { kind: 'center', index: 2 } });
  assert.equal(t.g.seats[1].now, 'robber');
  assert.equal(t.g.center[2], 'drunk');
  assert.deepEqual(know(t, 'p1', 'drank'), { type: 'drank', index: 2 });
});

test('the village wins when a werewolf dies; two votes are needed, a tie kills both', () => {
  const t = night(['werewolf', 'seer', 'villager', 'villager'], ['villager', 'robber', 'troublemaker']);
  t.play({ p0: { kind: 'center', index: 0 } });
  t.vote({ p1: 'p0', p2: 'p0', p3: 'p1', p0: 'p1' });
  assert.equal(t.g.phase, 'end');
  assert.deepEqual(t.g.dead.sort(), ['p0', 'p1']);
  assert.equal(t.g.winner.side, 'village');
  assert.deepEqual(t.view().seats.map((s) => s.role), ['werewolf', 'seer', 'villager', 'villager'], 'every card shows at the end');
});

test('the wolves win when no werewolf dies; nobody dies on single votes', () => {
  const t = night(['werewolf', 'seer', 'villager', 'minion'], ['villager', 'robber', 'troublemaker']);
  t.play({ p0: { kind: 'center', index: 0 } });
  t.vote({ p0: 'p1', p1: 'p2', p2: 'p3', p3: 'p0' });
  assert.deepEqual(t.g.dead, []);
  assert.equal(t.g.winner.side, 'wolves');
  assert.deepEqual(t.g.winner.players.sort(), ['p0', 'p3']);
});

test('the tanner wins by dying, and then the wolves lose', () => {
  const t = night(['werewolf', 'tanner', 'villager', 'villager'], ['villager', 'robber', 'seer']);
  t.play({ p0: { kind: 'center', index: 0 } });
  t.vote({ p0: 'p1', p2: 'p1', p3: 'p1', p1: 'p2' });
  assert.deepEqual(t.g.winner.sides, ['tanner']);
  assert.deepEqual(t.g.winner.players, ['p1']);
});

test('with no werewolf among the players, the village wins only if nobody dies', () => {
  const t = night(['villager', 'seer', 'villager'], ['werewolf', 'werewolf', 'robber']);
  t.play({ p1: { kind: 'center', indices: [0, 1] } });
  assert.deepEqual(know(t, 'p1', 'middle2').cards, ['werewolf', 'werewolf']);
  t.vote({ p0: 'p1', p1: 'p2', p2: 'p0' });
  assert.equal(t.g.winner.side, 'village');
});

test('the hunter takes whoever they voted for along', () => {
  const t = night(['werewolf', 'hunter', 'villager', 'villager'], ['villager', 'robber', 'seer']);
  t.play({ p0: { kind: 'center', index: 0 } });
  t.vote({ p0: 'p1', p2: 'p1', p1: 'p0', p3: 'p2' });
  assert.deepEqual(t.g.dead.sort(), ['p0', 'p1']);
  assert.equal(t.g.winner.side, 'village');
});

test('nothing secret reaches the big screen before the end', () => {
  const t = night(['werewolf', 'seer', 'robber'], ['villager', 'villager', 'troublemaker']);
  t.play({ p1: { kind: 'pick', target: 'p0' } });
  const screen = t.view();
  assert.ok(screen.seats.every((s) => s.role === null));
  assert.equal(screen.center, null);
  assert.equal(screen.me, null);
});
