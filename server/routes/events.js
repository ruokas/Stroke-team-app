import express from 'express';
import { withClient } from '../db/index.js';
import { insertEvents } from '../db/events.js';
import { parseEventsPayload } from '../validators/events.js';

const router = express.Router();

const eventCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function applyEventCors(res) {
  res.set(eventCorsHeaders);
}

router.options('/', (_req, res) => {
  applyEventCors(res);
  res.status(204).send();
});

// POST /api/events - batch insert analytics events
router.post('/', async (req, res) => {
  applyEventCors(res);
  const parsed = parseEventsPayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    await withClient(async (client) => {
      await insertEvents(client, parsed.value);
      res.status(201).json({ inserted: parsed.value.length });
    });
  } catch (err) {
    console.error('Error inserting events', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
