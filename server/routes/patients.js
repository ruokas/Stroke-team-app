import express from 'express';
import { withClient } from '../db/index.js';
import { fetchPatients, upsertPatient, deletePatient } from '../db/patients.js';
import { parsePatientPayload } from '../validators/patients.js';

const router = express.Router();

// GET /api/patients - return all patient records
router.get('/', async (_req, res) => {
  try {
    const rows = await withClient((client) => fetchPatients(client));
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching patients', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients - upsert incoming patient data
router.post('/', async (req, res) => {
  const parsed = parsePatientPayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const record = await withClient((client) =>
      upsertPatient(client, parsed.value),
    );
    if (!record) {
      return res.status(409).json({ error: 'Patient update is stale' });
    }
    res.status(201).json(record);
  } catch (err) {
    console.error('Error upserting patient', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/patients/:id - remove patient by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing patient id' });
  }
  try {
    const record = await withClient((client) => deletePatient(client, id));
    if (!record) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    return res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting patient', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
