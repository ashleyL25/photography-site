import { execute, queryOne } from '../db.js'
import { nowSeconds } from '../auth.js'

/**
 * Publish, update or return to draft — the same three outcomes for a session, an
 * album and a guide, so written once.
 *
 * `published_at` is set the first time something goes live and kept afterwards,
 * including through an unpublish, so returning to draft and publishing again
 * does not rewrite the original date. COALESCE rather than a CASE on `status`:
 * see the note on SqlParam in server/db.ts.
 */
export async function setStatus(
  table: 'session_types' | 'albums' | 'guides',
  id: string,
  status: unknown,
): Promise<{ ok: true; wasPublished: boolean } | { ok: false; code: number; error: string }> {
  if (status !== 'published' && status !== 'draft') {
    return { ok: false, code: 400, error: 'Status must be published or draft' }
  }
  const existing = await queryOne<{ status: string }>(`SELECT status FROM ${table} WHERE id = ?`, [id])
  if (!existing) return { ok: false, code: 404, error: 'Not found' }

  await execute(
    `UPDATE ${table}
        SET status = ?, published_at = COALESCE(published_at, ?), updated_at = UNIX_TIMESTAMP()
      WHERE id = ?`,
    [status, status === 'published' ? nowSeconds() : null, id],
  )
  return { ok: true, wasPublished: existing.status === 'published' }
}

/** A trimmed string or null, for an optional column; undefined when the key was not sent. */
export function optionalText(value: unknown, max: number): string | null | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export function flag(value: unknown): number | undefined {
  return typeof value === 'boolean' ? (value ? 1 : 0) : undefined
}
