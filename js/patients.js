import { getPayload, setPayload } from './storage.js';
import { getInputs } from './state.js';

const patients = {};
let activeId = null;
let counter = 1;

function generateId() {
  return `p${counter++}`;
}

export function addPatient() {
  const inputs = getInputs();
  const current = { ...getPayload(), summary: inputs.summary?.value || '' };
  if (activeId) patients[activeId] = current;
  const id = generateId();
  patients[id] = { ...current, summary: '' };
  activeId = id;
  setPayload(patients[id]);
  if (inputs.summary) inputs.summary.value = '';
  return id;
}

export function switchPatient(id) {
  if (!patients[id]) return;
  const inputs = getInputs();
  if (activeId)
    patients[activeId] = {
      ...getPayload(),
      summary: inputs.summary?.value || '',
    };
  activeId = id;
  setPayload(patients[id]);
  if (inputs.summary) inputs.summary.value = patients[id].summary || '';
}

export function removePatient(id) {
  if (!patients[id]) return;
  delete patients[id];
  if (activeId === id) {
    const nextId = Object.keys(patients)[0];
    activeId = nextId || null;
    if (nextId) {
      setPayload(patients[nextId]);
      const inputs = getInputs();
      if (inputs.summary) inputs.summary.value = patients[nextId].summary || '';
    }
  }
}

export function getActivePatient() {
  return patients[activeId];
}

export default {
  addPatient,
  switchPatient,
  removePatient,
  getActivePatient,
};
