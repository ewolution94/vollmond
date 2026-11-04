import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
// What Vollmond hands Dashboard (public/ewo.config.json), checked with Folio's own rules, and the
// order a setting is decided in: this device's own choice, then Dashboard's default, then the
// built-in one (src/lib/defaults.ts, and public/boot.js before first paint).
import { checkManifest, resolve } from '../vendor/ewo/elements/config-core.js';
import { languageFor, soundsFor, themeFor } from '../src/lib/defaults.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/ewo.config.json', import.meta.url), 'utf8'));

test('the manifest is one Dashboard takes: the family’s language, theme and sounds, on here', () => {
  const { ok, problems, manifest: checked } = checkManifest(manifest);
  assert.deepEqual(problems, []);
  assert.ok(ok);
  assert.equal(checked.app, 'vollmond');
  assert.deepEqual(Object.keys(checked.settings), ['lang', 'theme', 'sounds']);
});

test('with nothing set in Dashboard: the device’s language and theme, sounds on, the page as it ships', () => {
  const { values, sources } = resolve(manifest, {});
  assert.deepEqual(values, { lang: 'system', theme: 'system', sounds: true });
  assert.deepEqual(sources, { lang: 'built-in', theme: 'built-in', sounds: 'own' });
  assert.equal(themeFor('system', values.theme), 'system');
  assert.equal(languageFor('system', values.lang, 'de'), 'de');
  assert.equal(languageFor('system', values.lang, 'en'), 'en');
  assert.equal(soundsFor(null, values.sounds), true);
  // No #ewo-config at all (offline, the dev server): the same.
  assert.equal(soundsFor(null, undefined), true);
});

test('Dashboard’s family default and this app’s own value reach the page', () => {
  assert.deepEqual(resolve(manifest, { family: { theme: 'dark', lang: 'en' } }).values, { lang: 'en', theme: 'dark', sounds: true });
  assert.deepEqual(resolve(manifest, { family: { theme: 'dark', lang: 'en' }, app: { theme: 'light', lang: 'de' } }).values, { lang: 'de', theme: 'light', sounds: true });
  // Sounds stay on whatever the family says (Vollmond's own default comes first); set for Vollmond, off.
  assert.equal(resolve(manifest, { family: { sounds: false } }).values.sounds, true);
  assert.equal(resolve(manifest, { family: { sounds: false }, app: { sounds: false } }).values.sounds, false);
  // A value the family doesn't have falls back to the built-in one.
  assert.deepEqual(resolve(manifest, { family: { theme: 'purple', lang: 'fr' } }).values, { lang: 'system', theme: 'system', sounds: true });
});

test('the device’s own choice beats Dashboard’s default, which beats the built-in one', () => {
  assert.equal(themeFor('light', 'dark'), 'light');
  assert.equal(themeFor('system', 'dark'), 'dark');
  assert.equal(themeFor('system', 'system'), 'system');
  assert.equal(themeFor('system', 'purple'), 'system');
  // QA's `ewo:lang` = `en` is this device's own choice, so it keeps winning.
  assert.equal(languageFor('en', 'de', 'de'), 'en');
  assert.equal(languageFor('system', 'en', 'de'), 'en');
  assert.equal(languageFor('system', 'system', 'de'), 'de');
  assert.equal(languageFor('system', undefined, 'en'), 'en');
  // Sounds: the switch on this device (`vollmond:sounds`), else Dashboard's, else on.
  assert.equal(soundsFor('1', false), true);
  assert.equal(soundsFor('0', true), false);
  assert.equal(soundsFor(null, false), false);
  assert.equal(soundsFor(null, 'off'), true);
});

/** public/boot.js against a stub page: the theme and language it applies before first paint. */
function boot({ saved = {}, config, languages = ['de-DE', 'de'] }) {
  const root = { dataset: {}, lang: 'de', classList: { add() {}, remove() {} }, style: { setProperty() {} } };
  const metas = [
    { content: '#0e1130', media: '(prefers-color-scheme: dark)' },
    { content: '#f1e8d4', media: '(prefers-color-scheme: light)' },
  ];
  const document = {
    documentElement: root,
    getElementById: (id) => (id === 'ewo-config' && config ? { textContent: JSON.stringify(config) } : null),
    querySelectorAll: () => metas,
    addEventListener() {},
  };
  const localStorage = { getItem: (key) => saved[key] ?? null };
  vm.runInNewContext(readFileSync(new URL('../public/boot.js', import.meta.url), 'utf8'), {
    document,
    localStorage,
    matchMedia: () => ({ matches: false }),
    navigator: { languages, language: languages[0] },
    location: { search: '' },
    screen: {},
    addEventListener() {},
    setTimeout() {},
  });
  return { theme: root.dataset.theme, lang: root.lang, colors: metas.map((m) => m.content) };
}

test('before first paint: the saved theme and language, else Dashboard’s, else the system’s', () => {
  // Nothing saved, no Dashboard: today's page (the system's theme, the browser's language).
  assert.deepEqual(boot({}), { theme: undefined, lang: 'de', colors: ['#0e1130', '#f1e8d4'] });
  assert.deepEqual(boot({ languages: ['fr-FR', 'en-GB'] }), { theme: undefined, lang: 'en', colors: ['#0e1130', '#f1e8d4'] });
  assert.equal(boot({ languages: ['fr-FR'] }).lang, 'en');
  assert.deepEqual(boot({ config: { lang: 'system', theme: 'system' } }), { theme: undefined, lang: 'de', colors: ['#0e1130', '#f1e8d4'] });
  // Dashboard's values on a device that hasn't picked.
  assert.deepEqual(boot({ config: { lang: 'en', theme: 'dark' } }), { theme: 'dark', lang: 'en', colors: ['#0e1130', '#0e1130'] });
  // The device's own picks win, `ewo:lang` = `en` (QA's) among them.
  assert.deepEqual(boot({ saved: { 'ewo:theme': 'light', 'ewo:lang': 'en' }, config: { lang: 'de', theme: 'dark' } }), {
    theme: 'light',
    lang: 'en',
    colors: ['#f1e8d4', '#f1e8d4'],
  });
  assert.equal(boot({ saved: { 'ewo:lang': 'de' }, config: { lang: 'en' }, languages: ['en-US'] }).lang, 'de');
});
