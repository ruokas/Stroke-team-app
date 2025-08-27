export function setupToolbarNavigation() {
  const toolbar = document.querySelector('.header-actions');
  if (!toolbar) return;

  const getItems = () =>
    Array.from(toolbar.children)
      .map((child) =>
        child.tagName === 'DETAILS' ? child.querySelector('summary') : child,
      )
      .filter((el) => el && el.matches('button, select, summary'));

  toolbar.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

    const items = getItems();
    const index = items.indexOf(document.activeElement);
    if (index === -1) return;

    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    let nextIndex = index + dir;
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    items[nextIndex].focus();
  });
}
