import {
  getPayload,
  setPayload,
  deletePatient as deleteStoredPatient,
} from './storage.js';
import { getInputs } from './state.js';

const patients = {};
let activeId = null;
let counter = 1;

function generateId() {
  return `p${counter++}`;
}

export function addPatient() {
  const inputs = getInputs();
  const current = {
    ...getPayload(),
    summary: inputs.summary?.value || '',
    name:
      patients[activeId]?.name ||
      `Pacientas ${Object.keys(patients).length + 1}`,
  };
  if (activeId) patients[activeId] = current;
  const id = generateId();
  const name = `Pacientas ${Object.keys(patients).length + 1}`;
  patients[id] = { ...current, summary: '', name };
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
      name: patients[activeId].name,
    };
  activeId = id;
  setPayload(patients[id]);
  if (inputs.summary) inputs.summary.value = patients[id].summary || '';
}

export function removePatient(id) {
  if (!patients[id]) return;
  delete patients[id];
  deleteStoredPatient(id);
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

export function renamePatient(id, newName) {
  if (!patients[id]) return;
  patients[id].name = newName;
}

export function getActivePatientId() {
  return activeId;
}

export function getPatients() {
  return patients;
}

export function getActivePatient() {
  return patients[activeId];
}

export default {
  addPatient,
  switchPatient,
  removePatient,
  renamePatient,
  getActivePatient,
  getActivePatientId,
  getPatients,
};
