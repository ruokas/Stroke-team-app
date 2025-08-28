export function booleanField(key, selector) {
  return {
    key,
    selector,
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  };
}
