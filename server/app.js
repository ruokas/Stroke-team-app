import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import patientsRouter from './routes/patients.js';
import eventsRouter from './routes/events.js';

const app = express();

app.use(express.json());

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const publicDir = path.join(projectRoot, 'public');
const staticRoot = fs.existsSync(publicDir) ? publicDir : projectRoot;

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});
app.use('/css', express.static(path.join(staticRoot, 'css')));
app.use('/js', express.static(path.join(staticRoot, 'js')));
app.use('/icons', express.static(path.join(staticRoot, 'icons')));
app.use('/locales', express.static(path.join(staticRoot, 'locales')));
app.use(
  '/manifest.json',
  express.static(path.join(staticRoot, 'manifest.json')),
);
app.use('/sw.js', express.static(path.join(staticRoot, 'sw.js')));

// Redirect legacy /patients path to the new /api/patients endpoint
app.use('/patients', (_req, res) => {
  res.redirect(307, '/api/patients');
});

app.use('/api/patients', patientsRouter);
app.use('/api/events', eventsRouter);

app.use((err, req, res, _next) => {
  if (res.headersSent) {
    return;
  }
  if (req.path.startsWith('/api/events')) {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
