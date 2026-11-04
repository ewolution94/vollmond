// What this device does on its own: sounds and the narrator's voice. Kept in the browser; storage can
// be blocked, then the defaults hold. A device that hasn't switched sounds takes Dashboard's value
// (#ewo-config, src/lib/defaults.ts), else on. At one table, phones stay silent whatever is set
// here: only the big screen speaks (Game.svelte asks `loud()`).

import { readConfig } from '../../vendor/ewo/elements/config-client.js';
import { soundsFor } from './defaults';
import { i18n } from './i18n.svelte';

const SOUNDS = 'vollmond:sounds';
const VOICE = 'vollmond:voice';

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read(key: string, fallback: boolean) {
  const v = stored(key);
  return v === null ? fallback : v === '1';
}

export const prefs = $state({ sounds: soundsFor(stored(SOUNDS), readConfig().sounds), voice: read(VOICE, false) });

export function setPref(key: 'sounds' | 'voice', on: boolean) {
  prefs[key] = on;
  try {
    localStorage.setItem(key === 'sounds' ? SOUNDS : VOICE, on ? '1' : '0');
  } catch {
    // not kept
  }
  if (key === 'voice' && !on) speechSynthesis?.cancel();
}

let voices: SpeechSynthesisVoice[] = [];
if (typeof speechSynthesis !== 'undefined') {
  const load = () => (voices = speechSynthesis.getVoices());
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}

/** Reads a line out in the page's language, cutting off whatever was being read. */
export function say(text: string) {
  if (typeof speechSynthesis === 'undefined' || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = i18n.lang === 'de' ? 'de' : 'en';
  u.lang = lang === 'de' ? 'de-DE' : 'en-GB';
  u.voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang) && /enhanced|premium|neural/i.test(v.name)) ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
  u.rate = 0.95;
  u.pitch = 0.9;
  speechSynthesis.speak(u);
}
