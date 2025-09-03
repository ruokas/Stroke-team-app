export function up(knex) {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('event');
    table.jsonb('payload');
    table.timestamp('ts').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTable('events');
}
