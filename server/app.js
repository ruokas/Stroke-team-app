import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import patientsRouter from './routes/patients.js';
import eventsRouter from './routes/events.js';

const app = express();

app.use(express.json());

const EVENT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const STATIC_ROUTES = [
  ['/', 'index.html'],
  ['/css', 'css'],
  ['/js', 'js'],
  ['/icons', 'icons'],
  ['/locales', 'locales'],
  ['/manifest.json', 'manifest.json'],
  ['/sw.js', 'sw.js'],
];

function resolveStaticRoot() {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  );
  const publicDir = path.join(projectRoot, 'public');
  return fs.existsSync(publicDir) ? publicDir : projectRoot;
}

function registerStaticAssets(appInstance, staticRoot) {
  for (const [route, relativePath] of STATIC_ROUTES) {
    const absolutePath = path.join(staticRoot, relativePath);
    if (route === '/') {
      appInstance.get('/', (_req, res) => {
        res.sendFile(absolutePath);
      });
      continue;
    }
    appInstance.use(route, express.static(absolutePath));
  }
}

registerStaticAssets(app, resolveStaticRoot());

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
    res.set(EVENT_CORS_HEADERS);
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
