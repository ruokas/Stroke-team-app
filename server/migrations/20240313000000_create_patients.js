export function up(knex) {
  return knex.schema.createTable('patients', (table) => {
    table.increments('patient_id').primary();
    table.string('name');
    table.jsonb('payload');
    table.timestamp('created').defaultTo(knex.fn.now());
    table.timestamp('last_updated').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTable('patients');
}
