import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR, cleanAvatar } from '../server/game.mjs';
import { emblemRanges } from '../vendor/ewo/elements/emblem-core.js';

// The page draws shields with Folio's heraldry emblem (vendor/ewo); the server checks avatars on its
// own (the runtime image carries no vendor files). This keeps the two in step after a vendor update
// that adds fields or charges (2026-10-20: 14 fields, 24 charges).

test("the server's ranges are the heraldry emblem's", () => {
  assert.deepEqual([AVATAR.fields, AVATAR.charges], emblemRanges('heraldry'));
});

test('every field and charge the maker offers is kept, nothing past them', () => {
  const [fields, charges] = emblemRanges('heraldry');
  assert.deepEqual(cleanAvatar({ field: fields - 1, charge: charges - 1 }), { field: fields - 1, charge: charges - 1 });
  assert.equal(cleanAvatar({ field: fields, charge: 0 }), null);
  assert.equal(cleanAvatar({ field: 0, charge: charges }), null);
});
