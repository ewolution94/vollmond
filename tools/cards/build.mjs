#!/usr/bin/env node
// Prints every card's woodblock into public/cards/<role>.svg (and the back), from roles/*.mjs.
//
//   node tools/cards/build.mjs            all of them
//   node tools/cards/build.mjs seer back  just these
//
// A role's module exports `seed` and a default `draw(kit)` that returns { blue, pink } (the two
// plates, see kit.mjs), optionally `block` [x0, y0, x1, y1] and `whole` (the full card face).
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kit, print } from './kit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../public/cards');
const only = process.argv.slice(2);

await mkdir(OUT, { recursive: true });
const files = (await readdir(path.join(HERE, 'roles'))).filter((f) => f.endsWith('.mjs')).sort();
for (const file of files) {
  const id = file.replace(/\.mjs$/, '');
  if (only.length && !only.includes(id)) continue;
  const mod = await import(path.join(HERE, 'roles', file));
  const k = kit(mod.seed ?? 1);
  const art = mod.default(k);
  const [x0, y0, x1, y1] = art.block ?? [40, 40, 460, 548];
  const block = mod.whole ? `M0,0H500V700H0Z` : k.block(x0, y0, x1, y1);
  const viewBox = mod.whole ? '0 0 500 700' : `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  const svg = print({ id, blue: art.blue, pink: art.pink, block, viewBox });
  await writeFile(path.join(OUT, `${id}.svg`), svg);
  console.log(`${id}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
}
