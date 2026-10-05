/**
 * One-off: converts sections saved with the first Style tab (flat
 * `background` / `rule` / `spacing` strings) to the grouped one. Idempotent —
 * a section already in the new shape is left alone.
 *
 *   node --env-file=.env scripts/migrate-styles.mjs
 */
import mysql from 'mysql2/promise'

const db = await mysql.createConnection({
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const [rows] = await db.query('SELECT id, styles FROM sections')
let changed = 0
for (const row of rows) {
  let s
  try {
    s = JSON.parse(row.styles)
  } catch {
    continue
  }
  if (typeof s.background !== 'string' && s.rule === undefined && typeof s.spacing !== 'string') continue

  const next = { ...s }
  if (typeof s.background === 'string') next.background = { scheme: s.background || 'auto' }
  if (typeof s.spacing === 'string') {
    const map = { compact: 'sm', none: 'none' }
    next.spacing = map[s.spacing] ? { top: map[s.spacing], bottom: map[s.spacing] } : { top: 'auto', bottom: 'auto' }
  }
  if (s.rule !== undefined) {
    next.rules = { top: s.rule === 'line' ? 'line' : s.rule === 'none' ? 'none' : 'auto', bottom: 'none' }
    delete next.rule
  }
  await db.query('UPDATE sections SET styles = ? WHERE id = ?', [JSON.stringify(next), row.id])
  changed++
}
console.log(`Converted ${changed} of ${rows.length} sections.`)
await db.end()
