import { beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const originalFetch = global.fetch;

function resolveLocaleResponse(url) {
  const parsed = new URL(url, 'http://localhost');
  if (!parsed.pathname.startsWith('/locales/')) return null;
  const filePath = new URL('..' + parsed.pathname, import.meta.url);
  const data = readFileSync(filePath);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function applyDom() {
  const dom = new JSDOM(html, { url: 'http://localhost' });
  global.window = dom.window;
  global.window.matchMedia =
    global.window.matchMedia ||
    (() => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    }));
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
  if (originalFetch) {
    global.fetch = async (url, options) => {
      const resolved = resolveLocaleResponse(url);
      if (resolved) return resolved;
      return originalFetch(url, options);
    };
  }
  const { toast } = await import('../js/toast.js');
  toast.showToast = () => {};
  const { initI18n } = await import('../js/i18n.js');
  await initI18n();
});
