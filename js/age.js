import * as dom from './state.js';

export function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  if (isNaN(birth.getTime()) || birth > today) return '';
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age.toString() : '';
}

export function updateAge() {
  const dobEl = dom.getADobInput();
  const ageEl = dom.getAAgeInput();
  const age = calcAge(dobEl?.value);
  if (ageEl) ageEl.value = age;
  const disp = document.getElementById('a_age_display');
  if (disp) disp.textContent = age ? `${age} m.` : '';
}
