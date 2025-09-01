const THEME_KEY = 'theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = saved || 'light';
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(preferred);
}

export function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const root = document.documentElement;

  const update = () => {
    btn.textContent = root.classList.contains('dark') ? '☀️' : '🌙';
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
