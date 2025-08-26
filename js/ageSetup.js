import { updateAge } from './age.js';

export function setupAgeListener(inputs) {
  inputs.a_dob.addEventListener('input', updateAge);
}
