import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

test('index.html has no accessibility violations', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia =
        window.matchMedia ||
        (() => ({
          matches: false,
          addListener: () => {},
          removeListener: () => {},
        }));
      if (!window.HTMLCanvasElement) return;
      window.HTMLCanvasElement.prototype.getContext = () => ({
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      });
    },
  });
  dom.window.eval(axe.source);
  const results = await dom.window.axe.run();
  assert.strictEqual(
    results.violations.length,
    0,
    JSON.stringify(results.violations, null, 2),
  );
});
