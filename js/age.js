import { inputs } from './state.js';

export function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age.toString() : '';
}

export function updateAge() {
  const age = calcAge(inputs.a_dob.value);
  inputs.a_age.value = age;
  const disp = document.getElementById('a_age_display');
  if (disp) disp.textContent = age ? `${age} m.` : '';
}
