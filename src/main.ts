import './app.css';
import './lib/scrolling';
import { unlockAudio } from './lib/sound';
// Folio's shared elements (vendor/ewo); each defines itself once.
import '../vendor/ewo/elements/settings-button.js';
import '../vendor/ewo/elements/settings-basics.js';
import '../vendor/ewo/elements/sheet.js';
import '../vendor/ewo/elements/segmented.js';
import '../vendor/ewo/elements/switch.js';
import '../vendor/ewo/elements/badge.js';
import '../vendor/ewo/elements/emblem.js';
import '../vendor/ewo/elements/emblem-maker.js';
import { pressFeedback } from '../vendor/ewo/elements/press.js';
import { configureWaiting } from '../vendor/ewo/elements/waiting.js';
import '../vendor/ewo/elements/connection.js';

unlockAudio();
// Every tap on a phone answers with the games' springy press (plans/mobile-touch.md, the user's go 2026-10-08).
pressFeedback({ preset: 'lively' });
// A wait for the server shows at the control that asked, with Vollmond's working mark: a moon going
// through its phases (Folio's track() via src/lib/waits.ts, development/plans/waiting-states.md; app.css).
configureWaiting({
  mark:
    '<svg class="moonmark" viewBox="0 0 16 16" aria-hidden="true"><defs><mask id="vollmond-phase"><rect width="16" height="16" fill="#fff"/>' +
    '<circle class="shade" cx="8" cy="8" r="6.4" fill="#000"/></mask></defs><circle cx="8" cy="8" r="6" class="dim"/>' +
    '<circle cx="8" cy="8" r="6" class="lit" mask="url(#vollmond-phase)"/></svg>',
});

import { mount } from 'svelte';
import App from './App.svelte';

function start() {
  mount(App, { target: document.getElementById('app')! });
  requestAnimationFrame(() => dispatchEvent(new Event('splash:ready')));
}

// Installed, the app opens on the splash screen (index.html, switched on by public/boot.js; written by
// development/plans/splash-rollout). iOS fades its launch image into the page as soon as the page has
// laid out, so the splash has to be on screen before the app's first render takes the main thread, or
// the fade goes through a blank white web view. It lifts a frame after the app has mounted.
if (document.documentElement.classList.contains('splash')) {
  let started = false;
  const once = () => {
    if (started) return;
    started = true;
    start();
  };
  requestAnimationFrame(() => setTimeout(once));
  setTimeout(once, 100);
} else {
  start();
}

/**
 * The offline shell (see public/sw.js). Production only: a worker in front of the dev server
 * would cache the modules Vite is trying to hot-replace.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
