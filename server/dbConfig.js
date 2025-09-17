import dotenv from 'dotenv';

dotenv.config();

const TRUE_VALUES = ['1', 'true', 'yes', 'on'];

/**
 * Build a shared PostgreSQL configuration that mirrors the runtime server logic.
 * Automatically enables TLS when DATABASE_SSL is truthy or when the URL looks
 * like a Supabase connection string.
 */
export function buildPgConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (typeof connectionString !== 'string' || connectionString.trim() === '') {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sslFlag = process.env.DATABASE_SSL;
  const isSupabase = connectionString.includes('supabase.co');

  let enableSsl;
  if (typeof sslFlag === 'string' && sslFlag.trim() !== '') {
    enableSsl = TRUE_VALUES.includes(sslFlag.trim().toLowerCase());
  } else {
    enableSsl = isSupabase;
  }

  return {
    connectionString,
    ...(enableSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
