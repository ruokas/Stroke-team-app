export async function up(knex) {
  await knex.schema.alterTable('patients', (table) => {
    table.dropPrimary();
  });

  await knex.raw(
    `ALTER TABLE patients
      ALTER COLUMN patient_id DROP DEFAULT,
      ALTER COLUMN patient_id TYPE text USING patient_id::text`
  );

  await knex.raw('ALTER TABLE patients ALTER COLUMN patient_id SET NOT NULL');
  await knex.raw('DROP SEQUENCE IF EXISTS patients_patient_id_seq');

  await knex.schema.alterTable('patients', (table) => {
    table.primary(['patient_id']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('patients', (table) => {
    table.dropPrimary();
  });

  await knex.raw('CREATE SEQUENCE IF NOT EXISTS patients_patient_id_seq');

  await knex.raw(
    `ALTER TABLE patients
      ALTER COLUMN patient_id TYPE integer USING NULLIF(patient_id, '')::integer,
      ALTER COLUMN patient_id SET DEFAULT nextval('patients_patient_id_seq'),
      ALTER COLUMN patient_id SET NOT NULL`
  );

  await knex.raw(
    `SELECT setval(
      'patients_patient_id_seq',
      COALESCE((SELECT MAX(patient_id) FROM patients), 0),
      true
    )`
  );

  await knex.schema.alterTable('patients', (table) => {
    table.primary(['patient_id']);
  });
}
