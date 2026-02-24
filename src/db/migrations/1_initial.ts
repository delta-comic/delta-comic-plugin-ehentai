import type { Kysely } from 'kysely'

async function up(db: Kysely<any>) {
  //#region translate_tag begin
  await db.schema
    .createTable('translate_tag')
    .addColumn('group', 'text', col => col.notNull())
    .addColumn('raw', 'text', col => col.notNull())
    .addColumn('translate', 'text', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .addPrimaryKeyConstraint('key', ['group', 'raw'])
    .execute()

  await db.schema
    .createIndex('translate_tag_index')
    .on('translate_tag')
    .column('group')
    .column('raw')
    .execute()
  //#endregion

  //#region translate_group begin
  await db.schema
    .createTable('translate_group')
    .addColumn('raw', 'text', col => col.notNull().primaryKey())
    .addColumn('translate', 'text', col => col.notNull())
    .execute()

  await db.schema.createIndex('translate_group_index').on('translate_group').column('raw').execute()
  //#endregion
}

async function down(db: Kysely<any>) {
  await db.schema.dropTable('translate_tag').ifExists().execute()
  await db.schema.dropTable('translate_group').ifExists().execute()
}

export default { up, down }