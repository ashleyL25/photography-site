import { execute, query } from '../db.js'
import type { Term, TermRow, TermScope } from '../../shared/types.js'

export function toTerm(row: TermRow & { count?: number }): Term {
  return {
    id: row.id,
    kind: row.kind,
    appliesTo: row.applies_to,
    slug: row.slug,
    name: row.name,
    description: row.description,
    swatch: row.swatch,
    position: row.position,
    ...(row.count !== undefined ? { count: Number(row.count) } : {}),
  }
}

export async function listTerms(scope: TermScope): Promise<Term[]> {
  const rows = await query<TermRow>(
    `SELECT * FROM terms WHERE applies_to = ? ORDER BY kind ASC, position ASC, name ASC`,
    [scope],
  )
  return rows.map(toTerm)
}

/**
 * Terms with how many *published* items carry each one.
 *
 * The count drives the filter rail on the public listings, where a category
 * showing "(4)" and then yielding nothing because three of the four are drafts
 * is worse than no count at all. The join therefore filters on status rather
 * than counting every link row.
 */
export async function listTermsWithCounts(scope: TermScope): Promise<Term[]> {
  const table = scope === 'post' ? 'posts' : 'albums'

  const rows = await query<TermRow & { count: number }>(
    `SELECT t.*, (
       SELECT COUNT(*) FROM term_links tl
         JOIN ${table} x ON x.id = tl.object_id
        WHERE tl.term_id = t.id AND tl.object_type = ? AND x.status = 'published'
     ) + (
       SELECT COUNT(*) FROM ${table} y
        WHERE y.category_id = t.id AND y.status = 'published'
     ) AS count
       FROM terms t
      WHERE t.applies_to = ?
      ORDER BY t.kind ASC, t.position ASC, t.name ASC`,
    [scope, scope],
  )
  return rows.map(toTerm)
}

/** Tag links for several objects at once, grouped by object id. Avoids an N+1. */
export async function tagsFor(scope: TermScope, objectIds: string[]): Promise<Map<string, Term[]>> {
  const out = new Map<string, Term[]>()
  if (objectIds.length === 0) return out

  const placeholders = objectIds.map(() => '?').join(', ')
  const rows = await query<TermRow & { object_id: string }>(
    `SELECT t.*, tl.object_id
       FROM term_links tl
       JOIN terms t ON t.id = tl.term_id
      WHERE tl.object_type = ? AND tl.object_id IN (${placeholders})
      ORDER BY t.position ASC, t.name ASC`,
    [scope, ...objectIds],
  )

  for (const row of rows) {
    const list = out.get(row.object_id) ?? []
    list.push(toTerm(row))
    out.set(row.object_id, list)
  }
  return out
}

/**
 * Replaces one object's tag links.
 *
 * Delete-then-insert rather than a diff: the set is a handful of rows, the
 * editor always submits the complete list, and a diff would be more code to
 * reach the same state.
 *
 * Ids that do not name a term in the right scope are dropped silently. The
 * alternative — refusing the whole save because one tag was deleted in another
 * tab — would lose a post to protect a label.
 */
export async function setTags(
  scope: TermScope,
  objectId: string,
  termIds: string[],
): Promise<void> {
  await execute(`DELETE FROM term_links WHERE object_type = ? AND object_id = ?`, [scope, objectId])
  if (termIds.length === 0) return

  const placeholders = termIds.map(() => '?').join(', ')
  const valid = await query<{ id: string }>(
    `SELECT id FROM terms WHERE applies_to = ? AND kind = 'tag' AND id IN (${placeholders})`,
    [scope, ...termIds],
  )

  for (const term of valid) {
    await execute(
      `INSERT IGNORE INTO term_links (term_id, object_type, object_id) VALUES (?, ?, ?)`,
      [term.id, scope, objectId],
    )
  }
}

export async function clearTags(scope: TermScope, objectId: string): Promise<void> {
  await execute(`DELETE FROM term_links WHERE object_type = ? AND object_id = ?`, [scope, objectId])
}

/**
 * Removes links whose object no longer exists.
 *
 * `term_links` is polymorphic, so no foreign key can enforce this — the delete
 * handlers clear their own rows, and this sweeps anything a crash left behind.
 * Cheap, and called opportunistically when a term is deleted.
 */
export async function pruneTermLinks(): Promise<void> {
  await execute(
    `DELETE tl FROM term_links tl
      LEFT JOIN posts p ON p.id = tl.object_id AND tl.object_type = 'post'
      LEFT JOIN albums c ON c.id = tl.object_id AND tl.object_type = 'portfolio'
      WHERE p.id IS NULL AND c.id IS NULL`,
  )
}

/** Validates a category id against its scope, returning null rather than throwing. */
export async function validCategoryId(
  scope: TermScope,
  id: unknown,
): Promise<string | null> {
  if (typeof id !== 'string' || !id) return null
  const rows = await query<{ id: string }>(
    `SELECT id FROM terms WHERE id = ? AND applies_to = ? AND kind = 'category'`,
    [id, scope],
  )
  return rows[0]?.id ?? null
}
