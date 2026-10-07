// Release 2's classic roles: each one's power, and how it plays with the rest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, neighbours } from '../server/rules.mjs';
import { deckProblem, suggestedDeck, cardsFor } from '../server/roles.mjs';
import { table } from './helpers.mjs';

const V = 'villager', W = 'werewolf';
const knows = (t, id, type) => t.view(id).me.knowledge.filter((k) => k.type === type);

test('decks: the Thief brings two cards, siblings come in full sets, modes keep to their roles', () => {
  assert.equal(cardsFor({ thief: 1 }, 8, 'classic'), 10);
  assert.equal(deckProblem({ werewolf: 2, thief: 1, villager: 7 }, 8), null);
  assert.equal(deckProblem({ werewolf: 2, thief: 1, villager: 5 }, 8), 'deck-size');
  assert.equal(deckProblem({ werewolf: 2, sister: 1, villager: 5 }, 8), 'set');
  assert.equal(deckProblem({ werewolf: 2, brother: 3, villager: 3 }, 8), null);
  assert.equal(deckProblem({ werewolf: 2, robber: 1, villager: 5 }, 8), 'mode');
  assert.equal(suggestedDeck(20).piper, 1);
  assert.equal(suggestedDeck(20, 'quick').piper, undefined);
});

test('the Thief takes one of the two cards before Cupid, and must take a wolf if both are', () => {
  const t = table(['thief', W, V, V, V, V], {}, 1, ['seer', V]);
  t.deal();
  assert.equal(t.g.phase, 'thief');
  assert.deepEqual(t.view('p0').me.prompt.cards, ['seer', V]);
  assert.equal(t.view('p1').me.prompt.kind, 'suspect', 'everyone else taps something');
  t.step({ take: 0 });
  assert.equal(t.g.seats[0].role, 'seer');
  assert.equal(knows(t, 'p0', 'took')[0].role, 'seer');
  assert.equal(t.g.phase, 'night');
  assert.equal(t.view('p0').me.prompt.kind, 'seer', 'he plays his new card at once');

  const w = table(['thief', W, V, V, V, V, V, V], {}, 1, [W, W]);
  w.deal();
  assert.equal(w.view('p0').me.prompt.must, true);
  assert.throws(() => act(w.g, 'p0', { kind: 'take', index: null }, w.now), /must-take/);
  w.step({ take: 1 });
  assert.equal(w.g.seats[0].side, 'wolves');
  assert.deepEqual(w.view('p1').me.pack.map((p) => p.id).sort(), ['p0', 'p1']);
});

test('a Thief who keeps his card plays as a villager', () => {
  const t = table(['thief', W, V, V, V, V], {}, 1, ['seer', V]);
  t.deal();
  t.step({ take: null });
  assert.equal(t.g.seats[0].role, 'villager');
});

test('the Wild Child turns wolf when the role model dies', () => {
  const t = table(['wildchild', W, V, V, V, V, V]);
  t.deal();
  assert.equal(t.g.phase, 'dusk');
  t.night({ model: 'p2', wolf: 'p2' });
  assert.equal(knows(t, 'p0', 'model')[0].target, 'p2');
  assert.equal(t.g.seats[0].side, 'wolves');
  assert.equal(knows(t, 'p0', 'turned').length, 1);
  assert.ok(t.view('p1').me.pack.some((p) => p.id === 'p0'), 'the pack sees its new member');
});

test('Sisters and Brothers know each other from the deal', () => {
  const t = table(['sister', 'sister', 'brother', 'brother', 'brother', W, V]);
  assert.deepEqual(knows(t, 'p0', 'siblings')[0].ids, ['p0', 'p1']);
  assert.deepEqual(knows(t, 'p3', 'siblings')[0].ids, ['p2', 'p3', 'p4']);
  assert.deepEqual(knows(t, 'p6', 'siblings'), []);
});

test('the Fox sniffs a player and the two beside them; a miss costs the nose', () => {
  const t = table(['fox', V, V, W, V, V, V]);
  t.deal();
  t.act('p0', { kind: 'pick', target: 'p2' });
  const hit = knows(t, 'p0', 'fox')[0];
  assert.deepEqual(hit.ids, ['p2', 'p1', 'p3']);
  assert.equal(hit.found, true);
  assert.equal(t.g.foxActive, true);

  const m = table(['fox', V, V, V, V, V, W]);
  m.deal();
  m.act('p0', { kind: 'pick', target: 'p3' });
  assert.equal(knows(m, 'p0', 'fox')[0].found, false);
  m.night({ wolf: 'p5' });
  m.wait();
  m.vote({});
  m.wait();
  assert.equal(m.g.prompts.get('p0').kind, 'suspect', 'no more sniffing');
});

test('neighbours skip the dead', () => {
  const t = table([V, V, V, V, W]);
  t.g.seats[1].alive = false;
  assert.deepEqual(neighbours(t.g, 'p2').map((s) => s.id), ['p0', 'p3']);
});

test('the bear growls at dawn when a wolf sits beside its tamer', () => {
  const t = table([V, 'bear', W, V, V, V]);
  t.deal();
  t.night({ wolf: 'p4' });
  assert.equal(t.view('p3').growl, true);
  const q = table(['bear', V, V, W, V, V]);
  q.deal();
  q.night({ wolf: 'p4' });
  assert.equal(q.view('p1').growl, false);
});

test('the Raven\'s mark starts the next vote with two votes against', () => {
  const t = table(['raven', W, V, V, V, V]);
  t.deal();
  t.night({ raven: 'p3', wolf: 'p5' });
  assert.equal(t.view('p2').raven, 'p3');
  t.wait();
  t.vote({ p1: 'p2' });
  assert.equal(t.view().verdict.tally.p3, 2);
  assert.equal(t.view().verdict.out, 'p3');
});

test('the Rusty Knight, killed by the wolves, takes the next wolf in the ring a night later', () => {
  const t = table([V, 'knight', V, W, V, W, V, V]);
  t.deal();
  t.night({ wolf: 'p1' });
  assert.deepEqual(t.g.rust, { id: 'p3', night: 1 });
  t.wait();
  t.vote({});
  t.wait();
  t.night({ wolf: 'p0' });
  assert.deepEqual(t.g.morning.map((d) => [d.id, d.cause]).sort(), [['p0', 'wolves'], ['p3', 'rust']]);
});

test('the Scapegoat dies on a tie, whatever the tie setting', () => {
  const t = table(['scapegoat', W, V, V, V, V, V], { tie: 'runoff' });
  t.deal();
  t.night({ wolf: 'p6' });
  t.wait();
  t.vote({ p1: 'p2', p2: 'p1' });
  assert.equal(t.g.phase, 'verdict');
  assert.equal(t.view().verdict.out, 'p0');
  assert.equal(t.view().verdict.scapegoat, true);
});

test('the Stuttering Judge calls a second vote, once', () => {
  const t = table(['judge', W, V, V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p7' });
  t.wait();
  t.wait();
  assert.equal(t.g.prompts.get('p0').judge, true);
  t.act('p0', { kind: 'judge' });
  t.vote({ p0: 'p2', p1: 'p2', p3: 'p2' });
  t.wait();
  assert.equal(t.g.phase, 'vote', 'straight to a second vote');
  assert.equal(t.view().secondVote, true);
  assert.equal(t.g.prompts.get('p0').judge, undefined, 'only once');
  t.vote({ p0: 'p1', p3: 'p1', p4: 'p1' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'village');
});

test('the Big Bad Wolf takes a second victim while no wolf has died', () => {
  const t = table(['bigwolf', W, V, V, V, V, V, V, V]);
  t.deal();
  assert.ok(t.g.prompts.get('p0').extras.second);
  t.night({ wolf: 'p3', second: 'p4' });
  assert.deepEqual(t.g.morning.map((d) => d.id).sort(), ['p3', 'p4']);
  t.wait();
  t.vote({ p0: 'p1', p2: 'p1', p5: 'p1', p6: 'p1' });
  t.wait();
  assert.equal(t.g.prompts.get('p0').extras, undefined, 'a wolf died: no second victim any more');
});

test('the Guard shields from the second victim too', () => {
  const t = table(['bigwolf', W, 'guard', V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p3', second: 'p4', guard: 'p4' });
  assert.deepEqual(t.g.morning.map((d) => d.id), ['p3']);
});

test('the Wolf Father turns the victim into a wolf, once', () => {
  const t = table(['wolffather', W, 'seer', V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p3', infect: true });
  assert.deepEqual(t.g.morning, []);
  assert.equal(t.g.seats[3].side, 'wolves');
  assert.equal(t.view('p3').me.infected, true);
  assert.ok(t.view('p1').me.pack.some((p) => p.id === 'p3'));
  t.wait();
  t.vote({});
  t.wait();
  assert.equal(t.g.prompts.get('p0').extras, undefined);
  assert.equal(t.g.prompts.get('p3').kind, 'wolf', 'the infected hunts with the pack');
});

test('the White Werewolf hunts with the pack, kills a wolf on even nights, and wins only alone', () => {
  const t = table(['whitewolf', W, V, V, V, V, V, V, V]);
  t.deal();
  assert.deepEqual(t.view('p1').me.pack.map((p) => p.id), ['p0', 'p1']);
  assert.equal(t.g.prompts.get('p0').extras, undefined, 'not on night one');
  t.night({ wolf: 'p2' });
  t.wait();
  t.vote({});
  t.wait();
  assert.deepEqual(t.g.prompts.get('p0').extras.white, ['p1']);
  t.night({ wolf: 'p3', white: 'p1' });
  assert.deepEqual(t.g.morning.map((d) => [d.id, d.cause]).sort(), [['p1', 'white'], ['p3', 'wolves']]);
  assert.equal(t.view('p4').morning.find((d) => d.id === 'p1').cause, 'night', 'publicly just a night death');
});

test('the Piper charms two a night and wins when every other living player is charmed', () => {
  const t = table(['piper', W, V, V, V]);
  t.deal();
  t.night({ charm: ['p2', 'p3'], wolf: 'p4' });
  assert.deepEqual(knows(t, 'p2', 'charmed').at(-1).ids, ['p2', 'p3']);
  assert.equal(t.g.phase, 'dawn');
  t.wait();
  t.vote({});
  t.wait();
  assert.deepEqual(t.g.prompts.get('p0').options, ['p1']);
  act(t.g, 'p0', { kind: 'charm', a: 'p1' }, t.now);
  t.night({ wolf: 'p2' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'piper');
});

test('the Angel wins when voted out on day one, and is a villager after', () => {
  const t = table(['angel', W, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p5' });
  t.wait();
  t.vote({ p1: 'p0', p2: 'p0', p3: 'p0' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'angel');

  const s = table(['angel', W, V, V, V, V, V]);
  s.deal();
  s.night({ wolf: 'p6' });
  s.wait();
  s.vote({ p1: 'p2', p3: 'p2', p4: 'p2' });
  s.wait();
  assert.equal(s.g.seats[0].side, 'village');
});
