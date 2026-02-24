import Database from '@tauri-apps/plugin-sql'
import { debounce } from 'es-toolkit'
import { CamelCasePlugin, Kysely, Migrator, type Migration, type SelectQueryBuilder } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'
import { SerializePlugin } from 'kysely-plugin-serialize'
import mitt from 'mitt'
import { shallowRef, triggerRef } from 'vue'

const migrations = import.meta.glob<Migration>('./migrations/*.ts', {
  eager: true,
  import: 'default'
})

import * as TranslateDB from './translate'
export * as TranslateDB from './translate'

export interface DB {
  translate_key: TranslateDB.Tag.Table
  translate_group: TranslateDB.Group.Table
}
const database = await Database.load(`sqlite:eh.db`)

const emitter = mitt<{ onChange: void }>()

const MUTATION_KEYWORDS = /\b(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i
const triggerUpdate = debounce(() => {
  console.debug('[db sync] db changed')
  emitter.emit('onChange')
  triggerRef(db)
}, 300)

export const db = await (async () => {
  const db = shallowRef(
    new Kysely<DB>({
      dialect: new TauriSqliteDialect({
        database: {
          close(db) {
            return database.close(db)
          },
          path: database.path,
          async select<T>(query: string, bindValues?: unknown[]) {
            console.debug('eh_sql!', query, bindValues)
            const result = await database.select<T>(query, bindValues)
            if (MUTATION_KEYWORDS.test(query)) triggerUpdate()
            return result
          },
          async execute(query: string, bindValues?: unknown[]) {
            console.debug('eh_sql!', query, bindValues)
            const result = await database.execute(query, bindValues)
            if (MUTATION_KEYWORDS.test(query)) triggerUpdate()
            return result
          }
        }
      }),
      plugins: [new CamelCasePlugin(), new SerializePlugin()]
    })
  )
  const migrator = new Migrator({
    db: db.value,
    provider: {
      async getMigrations() {
        return migrations
      }
    }
  })
  await migrator.migrateToLatest()
  return db
})()