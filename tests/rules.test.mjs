import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, control, createGame, setAway, view, GRACE } from '../server/rules.mjs';
import { seeded, SETTINGS, table } from './helpers.mjs';

const V = 'villager', W = 'werewolf';

test('the deal: everyone gets a card, wolves know each other', () => {
  const t = table([W, W, 'seer', V, V, V, V]);
  assert.equal(t.g.phase, 'deal');
  const wolf = t.view('p0');
  assert.equal(wolf.me.role, W);
  assert.deepEqual(wolf.me.pack.map((p) => p.id), ['p0', 'p1']);
  const villager = t.view('p3');
  assert.equal(villager.me.role, V);
  assert.equal(villager.me.pack, null);
  // Nobody living sees another's card, and the big screen sees none.
  assert.ok(villager.seats.filter((s) => s.id !== 'p3').every((s) => s.role === null));
  assert.ok(t.view().seats.every((s) => s.role === null));
});

test('a random deal uses exactly the deck', () => {
  const players = Array.from({ length: 9 }, (_, i) => ({ id: `p${i}` }));
  const deck = { werewolf: 2, seer: 1, witch: 1, hunter: 1, villager: 4 };
  const g = createGame({ players, settings: SETTINGS, deck, rng: seeded(7), now: 0 });
  const counts = {};
  for (const s of g.seats) counts[s.role] = (counts[s.role] ?? 0) + 1;
  assert.deepEqual(counts, deck);
});

test('a plain round: the wolves kill, the village votes, the night falls again', () => {
  const t = table([W, V, V, V, V, 'seer']);
  t.deal();
  assert.equal(t.g.phase, 'night');
  assert.equal(t.g.night, 1);
  t.night({ wolf: 'p1', seer: 'p0' });
  assert.equal(t.g.phase, 'dawn');
  assert.deepEqual(t.view().morning.map((d) => d.id), ['p1']);
  assert.equal(t.view().morning[0].cause, 'night', 'the cause stays vague');
  assert.equal(t.view().morning[0].role, V, 'the card is shown on death');
  t.wait();
  assert.equal(t.g.phase, 'debate');
  assert.equal(t.g.day, 1);
  t.vote({ p2: 'p3', p3: 'p2', p4: 'p3', p5: 'p0', p0: 'p3' });
  assert.equal(t.g.phase, 'verdict');
  assert.equal(t.view().verdict.out, 'p3');
  t.wait();
  assert.equal(t.g.phase, 'night');
  assert.equal(t.g.night, 2);
});

test('the Seer sees a card the moment she picks it, or only the side', () => {
  const t = table([W, V, V, V, 'seer']);
  t.deal();
  t.act('p4', { kind: 'pick', target: 'p0' });
  assert.deepEqual(t.view('p4').me.knowledge.at(-1), { type: 'seen', night: 1, target: 'p0', side: 'wolves', role: W });
  assert.throws(() => t.act('p4', { kind: 'pick', target: 'p1' }), /done/);

  const s = table([W, V, V, V, 'seer'], { seer: 'side' });
  s.deal();
  s.act('p4', { kind: 'pick', target: 'p0' });
  assert.equal(s.view('p4').me.knowledge.at(-1).role, undefined);
  assert.equal(s.view('p4').me.knowledge.at(-1).side, 'wolves');
});

test('a night step ends early once everyone has acted and the pack agrees', () => {
  const t = table([W, W, V, V, V, V, V]);
  t.deal();
  const until = t.g.until;
  for (const id of ['p2', 'p3', 'p4', 'p5', 'p6']) t.act(id, { kind: 'pick', target: t.g.prompts.get(id).options[0] });
  t.act('p0', { kind: 'pick', target: 'p2' });
  t.act('p1', { kind: 'pick', target: 'p3' });
  assert.equal(t.g.deadline, until, 'the pack disagrees: the full time');
  // The pack sees each other's picks live.
  assert.deepEqual(t.view('p0').me.pack.map((p) => p.pick), ['p2', 'p3']);
  t.act('p1', { kind: 'pick', target: 'p2' });
  assert.equal(t.g.deadline, t.now + GRACE);
  t.wait();
  assert.equal(t.g.phase, 'dawn');
  assert.deepEqual(t.g.morning.map((d) => d.id), ['p2']);
});

test('at the deadline a split pack goes with the most picks', () => {
  const t = table([W, W, W, V, V, V, V, V, V], {}, 3);
  t.deal();
  t.act('p0', { kind: 'pick', target: 'p4' });
  t.act('p1', { kind: 'pick', target: 'p4' });
  t.act('p2', { kind: 'pick', target: 'p5' });
  t.wait();
  assert.deepEqual(t.g.morning.map((d) => d.id), ['p4']);
});

test('the Guard shields the victim, and not the same player twice in a row', () => {
  const t = table([W, 'guard', V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p2', guard: 'p2' });
  assert.deepEqual(t.g.morning, []);
  t.wait();
  t.vote({});
  t.wait();
  assert.ok(!t.g.prompts.get('p1').options.includes('p2'));
});

test('the Witch heals the victim once, and poisons once', () => {
  const t = table([W, W, 'witch', V, V, V, V, V]);
  t.deal();
  t.step({ wolf: 'p3' });
  // Witching hour: she sees the victim.
  assert.equal(t.g.prompts.get('p2').victim, 'p3');
  t.step({ heal: true, poison: 'p0' });
  assert.equal(t.g.phase, 'dawn');
  assert.deepEqual(t.g.morning.map((d) => d.id), ['p0']);
  assert.deepEqual(t.view('p2').me.potions, { heal: false, poison: false });
  t.wait();
  t.vote({});
  t.wait();
  t.step({ wolf: 'p4' });
  assert.equal(t.g.phase, 'witch');
  assert.equal(t.g.prompts.get('p2').heal, false);
  assert.throws(() => t.act('p2', { kind: 'witch', heal: true }), /no-potion/);
});

test('a dead Witch is still called, so the night looks the same', () => {
  const t = table([W, 'witch', V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p1' });
  t.wait();
  t.vote({});
  t.wait();
  t.step({ wolf: 'p2' });
  assert.equal(t.g.phase, 'witch', 'the step runs without her');
  assert.ok([...t.g.prompts.values()].every((p) => p.kind === 'guess'));
});

test('the Witch may not save herself when the room says so', () => {
  const t = table([W, 'witch', V, V, V, V], { witchSelf: false });
  t.deal();
  t.step({ wolf: 'p1' });
  assert.equal(t.g.prompts.get('p1').heal, false);
});

test('the Hunter shoots when he dies, at night or by vote', () => {
  const t = table([W, 'hunter', V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p1' });
  t.wait();
  assert.equal(t.g.phase, 'hunter');
  assert.equal(t.view().task.id, 'p1');
  t.act('p1', { kind: 'pick', target: 'p0' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'village');
});

test('Lovers die together, and a wolf and a villager in love win alone', () => {
  const t = table([W, 'cupid', V, V, V, V]);
  t.deal();
  assert.equal(t.g.phase, 'dusk');
  t.night({ cupid: ['p0', 'p2'], wolf: 'p3' });
  assert.equal(t.view('p0').me.lover, 'p2');
  assert.equal(t.view('p2').me.knowledge.find((k) => k.type === 'lover').partner, 'p0');
  // The pack of one is in love with p2: they play for themselves now.
  t.wait();
  t.vote({ p0: 'p4', p2: 'p4', p1: 'p4', p5: 'p4' });
  t.wait();
  t.night({ wolf: 'p5' });
  t.wait();
  // Left: p0 (wolf, lover), p1 (cupid), p2 (lover). The couple can't win yet.
  assert.equal(t.g.phase, 'debate');
  t.vote({ p0: 'p1', p2: 'p1' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'lovers');
  assert.deepEqual(t.g.winner.players.sort(), ['p0', 'p2']);
});

test('one Lover voted out takes the other along', () => {
  const t = table([W, 'cupid', V, V, V, V, V]);
  t.deal();
  t.night({ cupid: ['p3', 'p4'], wolf: 'p6' });
  t.wait();
  t.vote({ p0: 'p3', p1: 'p3', p2: 'p3' });
  assert.deepEqual(t.g.seats.filter((s) => !s.alive).map((s) => [s.id, s.died.cause]), [
    ['p3', 'vote'],
    ['p4', 'grief'],
    ['p6', 'wolves'],
  ].sort());
});

test('the Elder survives the first bite; voted out, he takes the village powers with him', () => {
  const t = table([W, 'elder', 'seer', 'hunter', V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p1', seer: 'p0' });
  assert.deepEqual(t.g.morning, []);
  t.wait();
  t.vote({ p0: 'p1', p4: 'p1', p5: 'p1' });
  assert.equal(t.g.powersLost, true);
  t.wait();
  assert.equal(t.g.prompts.get('p2').kind, 'suspect', 'the Seer sees nothing any more');
  t.night({ wolf: 'p3' });
  t.wait();
  assert.notEqual(t.g.phase, 'hunter', 'the Hunter has no shot');
});

test('the Village Idiot is spared once and loses the vote', () => {
  const t = table([W, 'idiot', V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p2' });
  t.wait();
  t.vote({ p0: 'p1', p3: 'p1', p4: 'p1' });
  const v = t.view();
  assert.equal(v.verdict.idiot, true);
  assert.equal(v.seats[1].alive, true);
  assert.equal(v.seats[1].role, 'idiot');
  t.wait();
  t.night({ wolf: 'p3' });
  t.wait();
  t.wait();
  assert.equal(t.g.phase, 'vote');
  assert.ok(!t.g.prompts.has('p1'));
});

test('the Captain is elected on day one, votes twice, breaks ties, and names a successor', () => {
  const t = table([W, V, V, V, V, V, V], { captain: true });
  t.deal();
  t.night({ wolf: 'p6' });
  t.wait();
  assert.equal(t.g.phase, 'election');
  for (const id of t.g.prompts.keys()) t.act(id, { kind: 'pick', target: 'p1' });
  t.wait();
  assert.equal(t.g.captain, 'p1');
  // The Captain's vote counts twice, and on a tie it decides.
  t.vote({ p1: 'p2', p3: 'p4', p0: 'p4' });
  assert.equal(t.view().verdict.tally.p2, 2);
  assert.equal(t.view().verdict.tally.p4, 2);
  assert.equal(t.view().verdict.out, 'p2');
  t.wait();
  t.night({ wolf: 'p1' });
  t.wait();
  assert.equal(t.g.phase, 'successor');
  t.act('p1', { kind: 'pick', target: 'p3' });
  t.wait();
  assert.equal(t.g.captain, 'p3');
});

test('a tie: nobody dies, or a runoff between the tied', () => {
  const t = table([W, V, V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p6' });
  t.wait();
  t.vote({ p0: 'p1', p1: 'p0' });
  assert.equal(t.view().verdict.out, null);
  assert.deepEqual(t.view().verdict.tie.sort(), ['p0', 'p1']);

  const r = table([W, V, V, V, V, V, V], { tie: 'runoff' });
  r.deal();
  r.night({ wolf: 'p6' });
  r.wait();
  r.vote({ p0: 'p1', p1: 'p0' });
  assert.equal(r.g.phase, 'runoff');
  assert.deepEqual(r.view().runoff.sort(), ['p0', 'p1']);
  assert.deepEqual(r.g.prompts.get('p2').options.sort(), ['p0', 'p1']);
  r.vote({ p2: 'p0', p3: 'p0' });
  r.wait();
  assert.equal(r.g.phase, 'end');
  assert.equal(r.g.winner.side, 'village');
});

test('wolves win at parity, or only when the village is gone', () => {
  const t = table([W, W, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p2' });
  t.wait();
  assert.equal(t.g.phase, 'debate');
  t.vote({ p0: 'p3', p1: 'p3' });
  t.wait();
  // Two wolves, two villagers.
  assert.equal(t.g.phase, 'end');
  assert.equal(t.g.winner.side, 'wolves');

  const u = table([W, W, V, V, V, V], { parity: false });
  u.deal();
  u.night({ wolf: 'p2' });
  u.wait();
  u.vote({ p0: 'p3', p1: 'p3' });
  u.wait();
  assert.equal(u.g.phase, 'night');
});

test('the Little Girl peeks: she glimpses a wolf, and is sometimes seen', () => {
  let caughtOnce = false, freeOnce = false;
  for (let seed = 1; seed < 20 && !(caughtOnce && freeOnce); seed++) {
    const t = table([W, 'girl', V, V, V, V], {}, seed);
    t.deal();
    t.act('p1', { kind: 'peek', peek: true });
    const glimpse = t.view('p1').me.knowledge.find((k) => k.type === 'glimpse');
    assert.equal(glimpse.wolf, 'p0');
    const spotted = t.view('p0').me.knowledge.some((k) => k.type === 'spotted' && k.girl === 'p1');
    assert.equal(spotted, glimpse.caught);
    if (glimpse.caught) caughtOnce = true;
    else freeOnce = true;
  }
  assert.ok(caughtOnce && freeOnce);
});

test('everyone has something to tap at night, so phones look alike', () => {
  const t = table([W, 'seer', 'guard', 'girl', V, V, V]);
  t.deal();
  assert.equal(t.g.prompts.size, 7);
  assert.equal(t.g.prompts.get('p4').kind, 'suspect');
  // The big screen and a villager only see how many are done.
  t.act('p1', { kind: 'pick', target: 'p0' });
  assert.deepEqual(t.view().progress, { done: 1, total: 7 });
  assert.ok(t.view('p4').seats.every((s) => s.acted === null));
});

test('a calm first night: the wolves only meet', () => {
  const t = table([W, V, V, V, V], { firstNight: 'calm' });
  t.deal();
  assert.equal(t.g.prompts.get('p0').kind, 'suspect');
  t.night({});
  assert.deepEqual(t.g.morning, []);
});

test('offline players don\'t hold a step up', () => {
  const t = table([W, V, V, V, V]);
  t.deal();
  setAway(t.g, 'p4', true, t.now);
  for (const id of ['p1', 'p2', 'p3']) t.act(id, { kind: 'pick', target: t.g.prompts.get(id).options[0] });
  t.act('p0', { kind: 'pick', target: 'p1' });
  assert.equal(t.g.deadline, t.now + GRACE);
});

test('the dead see everything when the room allows it; the living and the screen never do', () => {
  const t = table([W, 'seer', V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p2' });
  const ghost = t.view('p2');
  assert.ok(ghost.seats.every((s) => s.role !== null));
  assert.ok(ghost.ghost);
  const alive = t.view('p3');
  assert.equal(alive.seats.find((s) => s.id === 'p1').role, null);

  const h = table([W, 'seer', V, V, V, V], { ghosts: false });
  h.deal();
  h.night({ wolf: 'p2' });
  assert.equal(h.view('p2').seats.find((s) => s.id === 'p0').role, null);
});

test('secret votes stay hidden until the verdict; open ones show live', () => {
  const t = table([W, V, V, V, V], { votes: 'secret' });
  t.deal();
  t.night({ wolf: 'p4' });
  t.wait();
  t.wait();
  t.act('p0', { kind: 'pick', target: 'p1' });
  assert.equal(t.view('p2').votes, null);
  assert.equal(t.view('p2').seats[0].acted, true, 'who has voted shows, not for whom');
  const o = table([W, V, V, V, V]);
  o.deal();
  o.night({ wolf: 'p4' });
  o.wait();
  o.wait();
  o.act('p0', { kind: 'pick', target: 'p1' });
  assert.equal(o.view('p2').votes.p0, 'p1');
});

test('a card shown on death, only its side, or nothing', () => {
  for (const [reveal, role, side] of [['role', 'seer', 'village'], ['side', null, 'village'], ['none', null, null]]) {
    const t = table([W, 'seer', V, V, V], { reveal });
    t.deal();
    t.night({ wolf: 'p1' });
    const s = t.view('p3').seats[1];
    assert.equal(s.role, role, reveal);
    assert.equal(s.side, side, reveal);
  }
});

test('the pack whispers at night, only to itself', () => {
  const t = table([W, W, V, V, V, V, V]);
  t.deal();
  act(t.g, 'p0', { kind: 'chat', text: '  p3 is the seer, trust me  ' }, t.now);
  assert.equal(t.view('p1').me.chat[0].text, 'p3 is the seer, trust me');
  assert.equal(t.view('p3').me.chat, null);
  assert.throws(() => act(t.g, 'p3', { kind: 'chat', text: 'hi' }, t.now), /not-your-turn/);
});

test('the host pauses and resumes the clock, and moves a debate on', () => {
  const t = table([W, V, V, V, V]);
  t.deal();
  t.wait(10_000);
  const left = t.g.deadline - t.now;
  control(t.g, 'pause', t.now);
  assert.equal(t.g.deadline, null);
  t.wait(60_000);
  assert.equal(t.g.phase, 'night');
  control(t.g, 'resume', t.now);
  assert.equal(t.g.deadline - t.now, left);
  t.night({ wolf: 'p1' });
  t.wait();
  assert.equal(t.g.phase, 'debate');
  control(t.g, 'next', t.now);
  assert.equal(t.g.phase, 'vote');
  assert.throws(() => control(t.g, 'next', t.now), /wrong-phase/);
});

test('a majority wanting to vote ends the debate', () => {
  const t = table([W, V, V, V, V, V]);
  t.deal();
  t.night({ wolf: 'p5' });
  t.wait();
  for (const id of ['p0', 'p1']) t.act(id, { kind: 'hurry' });
  assert.equal(t.g.deadline, t.g.until);
  t.act('p2', { kind: 'hurry' });
  assert.equal(t.g.deadline, t.now + GRACE);
});

test('the end shows every card, the chronicle and the awards', () => {
  const t = table([W, 'seer', V, V, V]);
  t.deal();
  t.night({ wolf: 'p2', seer: 'p0' });
  t.wait();
  t.vote({ p1: 'p0', p3: 'p0', p4: 'p0' });
  t.wait();
  assert.equal(t.g.phase, 'end');
  const v = t.view();
  assert.equal(v.winner.side, 'village');
  assert.ok(v.seats.every((s) => s.role));
  assert.ok(v.log.some((e) => e.type === 'seer' && e.target === 'p0'));
  assert.equal(v.awards.find((a) => a.id === 'first').player, 'p2');
  assert.equal(v.awards.find((a) => a.id === 'aim').count, 1);
});

test('moves out of turn are refused', () => {
  const t = table([W, V, V, V, V]);
  t.deal();
  assert.throws(() => t.act('p1', { kind: 'pick', target: 'p1' }), /target/);
  assert.throws(() => t.act('p0', { kind: 'pick', target: 'p0' }), /target/, 'wolves can\'t eat their own');
  assert.throws(() => t.act('zz', { kind: 'pick', target: 'p1' }), /no-seat/);
  assert.throws(() => view(t.g, 'p1') && t.act('p1', { kind: 'pair', a: 'p0', b: 'p2' }), /move/);
});
