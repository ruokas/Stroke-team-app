import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import {
  registerFeature,
  runAll,
  clearFeatures,
} from '../js/bootstrap/featureRegistry.js';

test('runs features in dependency order', async () => {
  clearFeatures();
  const executed = [];
  registerFeature({
    id: 'first',
    init: () => executed.push('first'),
  });
  registerFeature({
    id: 'second',
    deps: ['first'],
    init: () => executed.push('second'),
  });
  registerFeature({
    id: 'third',
    deps: ['second'],
    init: () => executed.push('third'),
  });

  await runAll({});
  assert.deepStrictEqual(executed, ['first', 'second', 'third']);
});

test('propagates feature init errors', async () => {
  clearFeatures();
  registerFeature({
    id: 'healthy',
    init: () => {},
  });
  registerFeature({
    id: 'broken',
    deps: ['healthy'],
    init: () => {
      throw new Error('boom');
    },
  });

  await assert.rejects(() => runAll({}), /boom/);
});
