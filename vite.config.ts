import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// Plain ESM modules shared with the production server.
// @ts-expect-error untyped server module
import { createCensus } from './server/census.mjs';
// @ts-expect-error untyped server module
import { createApi } from './server/api.mjs';
// @ts-expect-error untyped server module
import { createGames } from './server/game.mjs';

// The real game server inside Vite's (dev and preview), so `npm run dev` is the whole app on one
// port: the same API and Census forwarder as server/server.mjs.
function server(): Plugin {
  const census = createCensus({ site: 'vollmond' });
  const games = createGames();
  const api = createApi({ games });
  const ticker = setInterval(() => games.tick(), 5000);
  ticker.unref();

  const middleware = async (req: any, res: any, next: (error?: unknown) => void) => {
    try {
      if (await census(req, res)) return;
      if (await api.handle(req, res)) return;
      next();
    } catch (error) {
      next(error);
    }
  };
  return {
    name: 'vollmond-server',
    configureServer: (s) => void s.middlewares.use(middleware),
    configurePreviewServer: (s) => void s.middlewares.use(middleware),
  };
}

export default defineConfig({
  plugins: [svelte(), server()],
  // 6000 is the NAS port; locally the previews run beside it.
  server: { port: 6010, strictPort: true },
  preview: { port: 6011, strictPort: true },
  build: {
    target: 'es2022',
    // Browsers with native light-dark(): the default target makes Lightning CSS resolve the
    // tokens once at :root (Folio's finding), and the page relies on them following the theme.
    cssTarget: ['chrome123', 'safari17.5', 'firefox120'],
  },
});
