import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildPgConfig } from './dbConfig.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  client: 'pg',
  connection: buildPgConfig(),
  migrations: {
    directory: path.join(__dirname, 'migrations'),
  },
};
