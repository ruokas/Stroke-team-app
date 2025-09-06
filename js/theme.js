const THEME_KEY = 'theme';

const sunIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const moonIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

export function initTheme() {
  const root = document.documentElement;
  if (root.classList.contains('light') || root.classList.contains('dark')) {
    return;
  }
  let saved;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const preferred = saved || (prefersDark ? 'dark' : 'light');
  root.classList.add(preferred);
}

export function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const root = document.documentElement;
  const icon = document.getElementById('themeToggleIcon');

  const update = () => {
    if (icon) {
      icon.innerHTML = root.classList.contains('dark') ? sunIcon : moonIcon;
    }
  };

  btn.addEventListener('click', () => {
    const isDark = root.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    update();
  });

  update();
}
