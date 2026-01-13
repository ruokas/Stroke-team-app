import { randomUUID } from 'node:crypto';

class FakeClient {
  constructor(pool) {
    this.pool = pool;
  }
  async query(text, params) {
    return this.pool._execute(text, params);
  }
  release() {}
}

export class FakePool {
  constructor() {
    this.patients = [];
    this.events = [];
    this.nextPatientId = 1;
    this.nextEventId = 1;
  }
  async connect() {
    return new FakeClient(this);
  }
  async query(text, params) {
    return this._execute(text, params);
  }
  async _execute(text, params = []) {
    text = text.trim();
    if (text.startsWith('INSERT INTO patients')) {
      let [id, name, payload, lastUpdated] = params;
      if (id == null || `${id}`.trim() === '') {
        id = randomUUID();
      }
      const idStr = `${id}`;
      const numericId = Number(idStr);
      if (!Number.isNaN(numericId) && numericId >= this.nextPatientId) {
        this.nextPatientId = numericId + 1;
      }
      let updated = lastUpdated ? new Date(lastUpdated) : new Date();
      if (Number.isNaN(updated.getTime())) updated = new Date();
      const idx = this.patients.findIndex((p) => `${p.patient_id}` === idStr);
      const created =
        idx >= 0 && this.patients[idx].created
          ? this.patients[idx].created
          : new Date();
      const record = {
        patient_id: idStr,
        name,
        payload,
        created,
        last_updated: updated,
      };
      if (idx >= 0) this.patients[idx] = record;
      else this.patients.push(record);
      return { rows: [record] };
    }
    if (text.startsWith('SELECT * FROM patients')) {
      return { rows: [...this.patients] };
    }
    if (text.startsWith('INSERT INTO events')) {
      for (let i = 0; i < params.length; i += 2) {
        this.events.push({
          id: this.nextEventId++,
          event: params[i],
          payload: params[i + 1],
          ts: new Date(),
        });
      }
      return { rows: [] };
    }
    if (text.startsWith('SELECT * FROM events')) {
      return { rows: [...this.events] };
    }
    throw new Error('Unsupported query: ' + text);
  }
  async end() {}
}
