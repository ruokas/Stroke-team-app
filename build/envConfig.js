import dotenv from 'dotenv';

export function loadEnvConfig() {
  dotenv.config({ quiet: true });
  dotenv.config({ path: '.env.production', override: false, quiet: true });

  return {
    apiBase: process.env.API_BASE || '',
    supabaseAnonKey: process.env.SUPABASE_ANONPUBLIC || '',
    supabaseProjectUrl: process.env.SUPABASE_PROJECT_URL || '',
  };
}
