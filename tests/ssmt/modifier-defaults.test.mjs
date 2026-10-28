import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectModifierType, resizeModifierGroup } from '../../src/features/ssmt/ssmtModifierDefaults.js';

const group = { name: 'Old', minQty: '1', maxQty: '1', choices: [{ id: 'a', price: '2', mrn: '0001' }, { id: 'b', price: '3' }] };
test('Remove defaults zero prices and all areas while preserving identifiers', () => {
  const result = selectModifierType(group, 'Remove', 'Burger', ['SEA', 'AUS'], []);
  assert.equal(result.name, 'Customize (Burger)');
  assert.equal(result.minQty, '0');
  assert.equal(result.maxQty, '2');
  assert.equal(result.choices[0].mrn, '0001');
  assert.equal(result.choices[0].price, '0.00');
  assert.deepEqual(result.choices[0].areaPrices, { SEA: '0.00', AUS: '0.00' });
  assert.equal(group.choices[0].price, '2');
});
test('Addition doubles line count and preserves prices', () => {
  const result = selectModifierType(group, 'Addition', 'Burger', [], []);
  assert.equal(result.name, 'Make It Better (Burger)');
  assert.equal(result.minQty, '0');
  assert.equal(result.maxQty, '4');
  assert.equal(result.choices[0].price, '2');
  assert.equal(resizeModifierGroup({ ...result, choices: [result.choices[0]] }, []).maxQty, '2');
});
test('Custom starts blank and does not acquire automatic counts', () => {
  const result = selectModifierType(group, 'Custom', 'Burger', ['SEA'], []);
  assert.equal(result.name, '');
  assert.equal(result.minQty, '');
  assert.equal(result.maxQty, '');
  assert.equal(result.choices[0].price, '');
  assert.equal(result.choices[0].mrn, '0001');
  assert.equal(resizeModifierGroup(result, ['SEA']).maxQty, '');
});
