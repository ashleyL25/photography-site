import { randomUUID } from 'node:crypto'
import { execute, query } from '../db.js'

/**
 * Title → URL slug.
 *
 * Accents are decomposed and stripped rather than transliterated, so "Café" is
 * `cafe` and not `cafa` or `caf`. Normalising to NFD splits a letter from its
 * combining mark, and the mark falls into the non-alphanumeric bucket that is
 * removed anyway — one line instead of a lookup table.
 *
 * Apostrophes are dropped rather than turned into hyphens, because
 * `a-writers-desk` reads and searches better than `a-writer-s-desk`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\p{Diacritic}]/gu, '')
    .replace(/['’`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

/**
 * A slug that is not already taken in `table`.
 *
 * `excludeId` is the row being edited — without it, saving a post without
 * changing its title would see its own slug, decide it was taken, and rename it
 * to `-2` on every save.
 *
 * Suffixes count up rather than appending a random string: a collision is rare
 * and `notes-on-editing-2` is a URL a person can read out loud.
 */
export async function uniqueSlug(
  table: 'pages' | 'posts' | 'albums' | 'session_types' | 'guides',
  desired: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(desired) || 'untitled'

  // One query for every slug in the family rather than a loop of existence
  // checks — the set is tiny and this bounds it to a single round trip.
  const rows = await query<{ slug: string }>(
    `SELECT slug FROM ${table} WHERE (slug = ? OR slug LIKE ?) AND id <> ?`,
    [base, `${base}-%`, excludeId ?? ''],
  )

  const taken = new Set(rows.map((r) => r.slug))
  if (!taken.has(base)) return base

  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }

  // Unreachable in practice; better than looping forever if it ever is not.
  return `${base}-${Date.now().toString(36)}`
}

/** The same rule for taxonomy terms, which are unique per kind and scope. */
export async function uniqueTermSlug(
  kind: string,
  appliesTo: string,
  desired: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(desired) || 'term'

  const rows = await query<{ slug: string }>(
    `SELECT slug FROM terms
      WHERE kind = ? AND applies_to = ? AND (slug = ? OR slug LIKE ?) AND id <> ?`,
    [kind, appliesTo, base, `${base}-%`, excludeId ?? ''],
  )

  const taken = new Set(rows.map((r) => r.slug))
  if (!taken.has(base)) return base

  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

/**
 * Records that a path used to live somewhere else.
 *
 * Written whenever a *published* item's slug changes. An unpublished draft has
 * never had a public URL, so renaming one needs no redirect and would only
 * clutter the table.
 *
 * `INSERT ... ON DUPLICATE KEY UPDATE` rather than a plain insert because a slug
 * can be changed back and forth: `a → b → a` must leave `/a` pointing at itself
 * being harmless rather than at a stale `/b`. The self-referential case is
 * filtered out entirely.
 */
export async function recordRedirect(fromPath: string, toPath: string): Promise<void> {
  if (!fromPath || !toPath || fromPath === toPath) return

  await execute(
    `INSERT INTO redirects (id, from_path, to_path) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE to_path = VALUES(to_path), created_at = UNIX_TIMESTAMP()`,
    [randomUUID(), fromPath, toPath],
  )

  // Anything that used to point at the old path now points at the new one, so a
  // chain of renames stays one hop rather than becoming a linked list.
  await execute(`UPDATE redirects SET to_path = ? WHERE to_path = ? AND from_path <> ?`, [
    toPath,
    fromPath,
    toPath,
  ])

  // A redirect to itself would be a loop.
  await execute(`DELETE FROM redirects WHERE from_path = to_path`)
}
