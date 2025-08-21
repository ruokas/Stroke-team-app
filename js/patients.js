import { getPayload, setPayload } from './storage.js';

const patients = {};
let activeId = null;
let counter = 1;

function generateId() {
  return `p${counter++}`;
}

export function addPatient() {
  const current = getPayload();
  if (activeId) patients[activeId] = current;
  const id = generateId();
  patients[id] = { ...current };
  activeId = id;
  setPayload(patients[id]);
  return id;
}

export function switchPatient(id) {
  if (!patients[id]) return;
  if (activeId) patients[activeId] = getPayload();
  activeId = id;
  setPayload(patients[id]);
}

export function removePatient(id) {
  if (!patients[id]) return;
  delete patients[id];
  if (activeId === id) {
    const nextId = Object.keys(patients)[0];
    activeId = nextId || null;
    if (nextId) setPayload(patients[nextId]);
  }
}

export function getActivePatient() {
  return activeId;
}

export default {
  addPatient,
  switchPatient,
  removePatient,
  getActivePatient,
};
