const THEME_KEY = 'theme';

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
      icon.src = root.classList.contains('dark')
        ? 'icons/sun.svg'
        : 'icons/moon.svg';
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
