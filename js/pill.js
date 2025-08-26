export function setupPillState() {
  document.querySelectorAll('.pill input').forEach((input) => {
    const pill = input.closest('.pill');
    const update = () => {
      if (input.type === 'radio') {
        document
          .querySelectorAll(`input[name="${input.name}"]`)
          .forEach((i) =>
            i.closest('.pill')?.classList.toggle('checked', i.checked),
          );
      } else {
        pill.classList.toggle('checked', input.checked);
      }
    };
    input.addEventListener('change', update);
    update();
  });
}
