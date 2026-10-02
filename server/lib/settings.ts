import { execute, queryOne } from '../db.js'
import { hydrateSettings, type SettingsKey } from '../../shared/settings.js'

/**
 * Settings groups, each one row of JSON in `settings`.
 *
 * Read on nearly every public request — the site payload carries all five —
 * so they are cached per process. Passenger may run more than one worker, and a
 * save in one is not seen by another until its cache is dropped; the cost is one
 * stale page load after a settings change, which is the right trade against a
 * database round trip per visitor.
 */

const cache = new Map<SettingsKey, Record<string, unknown>>()

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>(`SELECT \`value\` FROM settings WHERE \`key\` = ?`, [key])
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    `INSERT INTO settings (\`key\`, \`value\`, updated_at) VALUES (?, ?, UNIX_TIMESTAMP())
     ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = UNIX_TIMESTAMP()`,
    [key, value],
  )
  cache.delete(key as SettingsKey)
}

/** A settings group, filled out against its field list so a missing key has its default. */
export async function getSettings(key: SettingsKey): Promise<Record<string, unknown>> {
  const hit = cache.get(key)
  if (hit) return hit

  const raw = await getSetting(key)
  let parsed: unknown = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      // A corrupt row must not take the site down; the defaults are the
      // shipped copy, which is far easier to notice and fix than a 500.
      console.error(`settings: ${key} JSON is unparseable, falling back to defaults`)
    }
  }

  const value = hydrateSettings(key, parsed)
  cache.set(key, value)
  return value
}

export async function saveSettings(key: SettingsKey, value: Record<string, unknown>): Promise<void> {
  await setSetting(key, JSON.stringify(value))
  cache.set(key, value)
}

export function invalidateSettings(): void {
  cache.clear()
}
