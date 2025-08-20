import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

test('index.html has no accessibility violations', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  dom.window.eval(axe.source);
  const results = await dom.window.axe.run();
  assert.strictEqual(
    results.violations.length,
    0,
    JSON.stringify(results.violations, null, 2),
  );
});
