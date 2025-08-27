export const SCHEMA_VERSION = 1;

export function migrateSchema(rec) {
  // Attempt to migrate an older schema to the current version.
  // Currently, schema v0 simply wrapped the payload without versioning.
  if (rec.version === 0) return { version: 1, data: rec.data };
  if (rec.version === 1) return { version: SCHEMA_VERSION, data: rec.data };
  throw new Error(`Unknown schema version ${rec.version}`);
}
