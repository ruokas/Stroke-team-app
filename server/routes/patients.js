import express from 'express';
import { withClient } from '../db/index.js';
import { fetchPatients, upsertPatient } from '../db/patients.js';
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
    res.status(201).json(record);
  } catch (err) {
    console.error('Error upserting patient', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
