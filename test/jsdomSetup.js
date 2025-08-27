import { beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function applyDom() {
  const dom = new JSDOM(html, { url: 'http://localhost' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.MouseEvent = dom.window.MouseEvent;
  global.CustomEvent = dom.window.CustomEvent;
  Object.defineProperty(global, 'navigator', {
    value: {
      ...dom.window.navigator,
      clipboard: {
        writeText: async (txt) => {
          global.__copied = txt;
        },
      },
    },
    configurable: true,
  });
  global.localStorage = dom.window.localStorage;
  global.URL = dom.window.URL;
  global.Blob = dom.window.Blob;
  global.FileReader = dom.window.FileReader;
  global.setInterval = dom.window.setInterval;
  document.execCommand = () => true;
  global.confirm = () => true;
  global.prompt = () => '';
  global.window.isSecureContext = true;
}

applyDom();

beforeEach(async () => {
  applyDom();
  const { toast } = await import('../js/toast.js');
  toast.showToast = () => {};
});
