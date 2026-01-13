import { updateAge } from './age.js';

export function setupAgeListener(inputs) {
  if (inputs.a_dob) {
    inputs.a_dob.addEventListener('input', updateAge);
  }
}
