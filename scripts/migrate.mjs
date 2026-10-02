#!/usr/bin/env node
/**
 * Applies every migration in `migrations/` that has not run yet.
 *
 * Deliberately not a migration framework. The whole job is: read files in name
 * order, skip the ones already recorded, run the rest inside a transaction, and
 * write down what ran. A dependency for that would be more code to audit than
 * the code it replaces, and it would be installed on the server on every deploy.
 *
 *   npm run db:migrate
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { loadEnv } from '../shared/load-env.js'

loadEnv()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations')

const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME']
const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`\nMissing ${missing.join(', ')} — fill them in in .env first.\n`)
  process.exit(1)
}

/**
 * Splits a file into statements on semicolons that are not inside a string or a
 * comment.
 *
 * `multipleStatements` on the connection would avoid this, and it is not worth
 * it: leaving that flag on turns any future missed parameter binding anywhere in
 * the app into a full statement-injection vector. Two dozen lines here buy a
 * connection that can only ever run one statement at a time.
 */
function splitStatements(sql) {
  const statements = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      current += ch
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        current += '*/'
        i++
        continue
      }
      current += ch
      continue
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-') {
        inLineComment = true
        current += ch
        continue
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true
        current += '/*'
        i++
        continue
      }
    }

    if (ch === "'" && !inDouble && !inBacktick) inSingle = !inSingle
    else if (ch === '"' && !inSingle && !inBacktick) inDouble = !inDouble
    else if (ch === '`' && !inSingle && !inDouble) inBacktick = !inBacktick

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      statements.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) statements.push(current.trim())
  return statements.filter((s) => {
    // Comment-only fragments are not statements.
    const stripped = s
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    return stripped.length > 0
  })
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST ?? '127.0.0.1'),
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  multipleStatements: false,
})

await connection.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   VARCHAR(190) NOT NULL,
    applied_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (filename)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci
`)

const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations')
const applied = new Set(appliedRows.map((r) => r.filename))

const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
let ran = 0

for (const file of files) {
  if (applied.has(file)) continue

  const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
  const statements = splitStatements(sql)

  process.stdout.write(`→ ${file} (${statements.length} statements) `)

  /**
   * MySQL commits implicitly on DDL, so a failed CREATE TABLE halfway through
   * cannot be rolled back. The transaction is still worth opening for the DML in
   * a migration, and the real protection is the record below: a file that throws
   * is never marked applied, so rerunning picks up where it stopped. Migrations
   * are therefore written to be safe to re-run from the top where they can be.
   */
  await connection.beginTransaction()
  try {
    for (const statement of statements) await connection.query(statement)
    await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file])
    await connection.commit()
    console.log('✓')
    ran++
  } catch (err) {
    await connection.rollback().catch(() => {})
    console.log('✗')
    console.error(`\n${file} failed:\n  ${err.message}\n`)
    await connection.end()
    process.exit(1)
  }
}

await connection.end()
console.log(ran === 0 ? 'Already up to date.' : `Applied ${ran} migration(s).`)
