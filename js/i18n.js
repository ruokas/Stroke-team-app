const DEFAULT_LANG = 'lt';
let translations = {};

function t(key, vars = {}) {
  let str = translations[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return str;
}

async function loadLang(lang) {
  const res = await fetch(`locales/${lang}.json`);
  translations = await res.json();
  document.documentElement.lang = lang;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

async function setLanguage(lang) {
  await loadLang(lang);
  applyTranslations();
}

export async function initI18n() {
  await setLanguage(DEFAULT_LANG);
}

export { t };
