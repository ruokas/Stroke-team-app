import {
  getPayload,
  setPayload,
  deletePatient as deleteStoredPatient,
} from './storage.js';
import { getInputs } from './state.js';

const patients = {};
let activeId = null;

function generateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function persistActivePatient(inputs) {
  patients[activeId] = {
    ...getPayload(),
    summary: inputs.summary?.value || '',
    name: patients[activeId].name,
  };
}

export function addPatient(id, data = {}) {
  const inputs = getInputs();
  if (activeId) persistActivePatient(inputs);
  const newId = id || generateId();
  const {
    summary = '',
    name = `Pacientas ${Object.keys(patients).length + 1}`,
    ...payload
  } = data || {};
  patients[newId] = { ...payload, summary, name };
  activeId = newId;
  setPayload(payload);
  if (inputs.summary) inputs.summary.value = summary;
  return newId;
}

export function switchPatient(id) {
  if (!patients[id]) return;
  const inputs = getInputs();
  if (activeId) persistActivePatient(inputs);
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

export function updateActivePatient() {
  if (!activeId || !patients[activeId]) return;
  const { name, summary } = patients[activeId];
  patients[activeId] = { ...getPayload(), name, summary };
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

export function hydratePatients(storedRecords = {}) {
  Object.keys(patients).forEach((id) => delete patients[id]);
  activeId = null;
  if (!storedRecords || typeof storedRecords !== 'object') return null;
  const entries = Object.entries(storedRecords);
  if (!entries.length) return null;
  let pickedId = null;
  let pickedTime = -1;
  let index = 0;
  for (const [id, rec] of entries) {
    const data = rec?.data;
    const payload =
      data && data.version !== undefined ? data.data : rec?.data || rec;
    if (!payload || typeof payload !== 'object') continue;
    const name =
      rec?.name || payload?.a_name || payload?.name || `Pacientas ${index + 1}`;
    const summary = payload?.summary || rec?.summary || '';
    patients[id] = { ...payload, summary, name };
    const updatedAt = new Date(
      rec?.lastUpdated ?? rec?.last_updated ?? rec?.created ?? 0,
    ).getTime();
    if (updatedAt >= pickedTime) {
      pickedTime = updatedAt;
      pickedId = id;
    }
    index += 1;
  }
  return pickedId || Object.keys(patients)[0] || null;
}

export default {
  addPatient,
  switchPatient,
  removePatient,
  renamePatient,
  updateActivePatient,
  getActivePatient,
  getActivePatientId,
  getPatients,
};
