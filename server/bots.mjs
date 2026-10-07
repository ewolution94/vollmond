// Bots: players the server plays itself, for trying a game alone and for the tests. They make
// legal moves at random, with a little sense: a wolf follows the pack's pick, and nobody hurries
// a debate before a person has.

const NAMES = ['Kuno', 'Hilde', 'Bertolt', 'Agnes', 'Wendelin', 'Irmgard', 'Ottokar', 'Gisela', 'Rupert', 'Mechthild', 'Eberhard', 'Walburga'];

/** A bot's name that isn't taken yet. */
export function botName(taken) {
  const free = NAMES.filter((n) => !taken.has(`${n} 🤖`.toLowerCase()));
  return `${free[0] ?? `Bot ${taken.size + 1}`} 🤖`;
}

/**
 * The bot's move for what it's asked, or null for nothing to do.
 * @param {ReturnType<typeof import('./rules.mjs').view>} view  the bot's own view
 * @param {() => number} rng
 * @param {{ humansHurried: boolean }} context
 */
export function botMove(view, rng, { humansHurried = false } = {}) {
  const me = view.me;
  const prompt = me?.prompt;
  if (!prompt) return null;
  const pickFrom = (options) => (options?.length ? options[Math.floor(rng() * options.length)] : null);
  if (me.act && prompt.kind !== 'wolf') return null;
  switch (prompt.kind) {
    case 'ready':
      return { kind: 'ready' };
    case 'hurry':
      return humansHurried && !me.hurried ? { kind: 'hurry' } : null;
    case 'cupid': {
      const a = pickFrom(prompt.options);
      const b = pickFrom(prompt.options.filter((x) => x !== a));
      return a && b ? { kind: 'pair', a, b } : null;
    }
    case 'girl':
      return { kind: 'peek', peek: rng() < 0.3 };
    case 'witch': {
      const heal = prompt.heal && rng() < 0.5;
      const poison = prompt.poison && rng() < 0.2 ? pickFrom(prompt.options) : null;
      return { kind: 'witch', heal, poison };
    }
    case 'wolf': {
      // Go with the first pick in the pack's order, so the pack settles on one name quickly.
      const lead = (me.pack ?? []).find((p) => p.alive && p.pick);
      const target = lead ? lead.pick : pickFrom(prompt.options);
      if (me.act?.target === target) return null;
      return target ? { kind: 'pick', target } : null;
    }
    case 'vote':
      return rng() < 0.1 ? { kind: 'pick', target: null } : { kind: 'pick', target: pickFrom(prompt.options) };
    default: {
      const target = pickFrom(prompt.options);
      return target ? { kind: 'pick', target } : null;
    }
  }
}
