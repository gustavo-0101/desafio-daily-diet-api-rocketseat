import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.uuid('session_id').after('id').index()
    table.text('name').notNullable()
    table.text('description').notNullable()
    table.boolean('is_diet').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.dropTable('meals')
}
