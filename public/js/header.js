export function setupHeaderHeight() {
  const header = document.querySelector('header');
  const setHeaderHeight = () =>
    document.documentElement.style.setProperty(
      '--header-height',
      header.offsetHeight + 'px',
    );
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);
}
