import dotenv from 'dotenv';
import pg from 'pg';
import { buildPgConfig } from '../dbConfig.js';
import { FakePool } from './testPool.js';

dotenv.config();

function createPool() {
  if (process.env.NODE_ENV === 'test') {
    return new FakePool();
  }
  const poolConfig = buildPgConfig();
  return new pg.Pool(poolConfig);
}

export const pool = createPool();

export async function withClient(handler) {
  let client;
  try {
    client = await pool.connect();
    return await handler(client);
  } finally {
    if (client) {
      client.release();
    }
  }
}
