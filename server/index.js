import dotenv from 'dotenv';
import app from './app.js';
import { pool } from './db/index.js';

dotenv.config();

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export { app, pool };
