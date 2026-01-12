import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import patientsRouter from './routes/patients.js';
import eventsRouter from './routes/events.js';

const app = express();

app.use(express.json());

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

app.get('/', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/icons', express.static(path.join(rootDir, 'icons')));
app.use('/locales', express.static(path.join(rootDir, 'locales')));
app.use('/manifest.json', express.static(path.join(rootDir, 'manifest.json')));
app.use('/sw.js', express.static(path.join(rootDir, 'sw.js')));

// Redirect legacy /patients path to the new /api/patients endpoint
app.use('/patients', (_req, res) => {
  res.redirect(307, '/api/patients');
});

app.use('/api/patients', patientsRouter);
app.use('/api/events', eventsRouter);

export default app;
