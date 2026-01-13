export async function fetchPatients(client) {
  const { rows } = await client.query('SELECT * FROM patients');
  return rows;
}

export async function upsertPatient(client, payload) {
  const query =
    'INSERT INTO patients (patient_id, name, payload, last_updated) VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW())) ' +
    'ON CONFLICT (patient_id) DO UPDATE SET name = EXCLUDED.name, payload = EXCLUDED.payload, last_updated = COALESCE($4::timestamptz, NOW()) ' +
    'WHERE $4::timestamptz IS NULL OR patients.last_updated IS NULL OR $4::timestamptz >= patients.last_updated ' +
    'RETURNING *';
  const values = [
    payload.patientId,
    payload.name,
    payload.payload ?? null,
    payload.lastUpdated ?? null,
  ];
  const { rows } = await client.query(query, values);
  return rows[0] ?? null;
}

export async function deletePatient(client, patientId) {
  const { rows } = await client.query(
    'DELETE FROM patients WHERE patient_id = $1 RETURNING *',
    [patientId],
  );
  return rows[0] ?? null;
}
