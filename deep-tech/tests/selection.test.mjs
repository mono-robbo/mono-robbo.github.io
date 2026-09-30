import test from 'node:test';
import assert from 'node:assert/strict';
import { items, stages, containers, itemById, packageQuote } from '../offers.js';

test('two foundation packs have distinct core elements and optional extensions', () => {
  assert.deepEqual(stages.map(stage => stage.id), ['who', 'how']);
  const coreIds = stages.flatMap(stage => stage.coreIds);
  assert.equal(new Set(coreIds).size, coreIds.length);
  assert.ok(stages.every(stage => stage.coreIds.every(id => itemById[id])));
  assert.ok(stages.every(stage => stage.extensionIds.every(id => itemById[id] && !stage.coreIds.includes(id))));
  assert.deepEqual(stages[0].coreIds, ['photo-suite', 'words-pack', 'micro-design']);
  assert.deepEqual(Object.fromEntries(items.map(item => [item.id, item.priceCents])), {
    'photo-suite': 50000,
    'micro-design': 150000,
    'words-pack': 75000,
    'visual-explanation': 75000,
    'technology-visualisation': 50000,
    'detailed-explainer': null
  });
  assert.ok(containers.every(container => container.priceCents === null));
  assert.ok(containers.every(container => container.deliverables.length && container.input && container.process && container.handoff));
});

test('WHO pack starts with three item prices and a 15% discount', () => {
  assert.deepEqual(packageQuote(stages[0]), { subtotal: 275000, saving: 41250, total: 233750 });
  const catalog = { ...itemById, 'photo-suite': { ...itemById['photo-suite'], priceCents: 65000 } };
  assert.deepEqual(packageQuote(stages[0], catalog), { subtotal: 290000, saving: 43500, total: 246500 });
  assert.equal(packageQuote(stages[1]), null);
});

test('an unpriced core element keeps the pack unpriced', () => {
  const catalog = { ...itemById, 'micro-design': { ...itemById['micro-design'], priceCents: null } };
  assert.equal(packageQuote(stages[0], catalog), null);
});
