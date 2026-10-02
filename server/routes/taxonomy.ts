import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, query, queryOne } from '../db.js'
import { requireAuth } from '../auth.js'
import { uniqueTermSlug } from '../lib/slug.js'
import { listTermsWithCounts, pruneTermLinks, toTerm } from '../lib/taxonomy.js'
import { SWATCHES } from '../../shared/palette.js'
import type { TermRow, TermScope } from '../../shared/types.js'

/**
 * Categories and tags, for both the blog and the portfolio.
 *
 * The scope is part of the path — `/api/admin/terms/post` and
 * `/api/admin/terms/portfolio` — rather than a query parameter, because it is
 * genuinely a different collection and not a filter over one. A blog category
 * called "Craft" and a portfolio category of the same name are unrelated.
 */
const router = Router()
router.use(requireAuth)

const SWATCH_NAMES = new Set(SWATCHES.map((s) => s.value))

function scopeFrom(value: string): TermScope | null {
  return value === 'post' || value === 'portfolio' ? value : null
}

router.get('/:scope', (req, res, next) => {
  void (async () => {
    try {
      const scope = scopeFrom(req.params.scope)
      if (!scope) {
        res.status(400).json({ error: 'Scope must be post or portfolio' })
        return
      }
      res.json({ terms: await listTermsWithCounts(scope) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:scope', (req, res, next) => {
  void (async () => {
    try {
      const scope = scopeFrom(req.params.scope)
      if (!scope) {
        res.status(400).json({ error: 'Scope must be post or portfolio' })
        return
      }

      const { kind, name, description, swatch, slug } = (req.body ?? {}) as Record<string, unknown>
      if (kind !== 'category' && kind !== 'tag') {
        res.status(400).json({ error: 'Kind must be category or tag' })
        return
      }
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'A name is required' })
        return
      }

      const next = await queryOne<{ n: number }>(
        `SELECT COALESCE(MAX(position), 0) + 1 AS n FROM terms WHERE applies_to = ? AND kind = ?`,
        [scope, kind],
      )

      const id = randomUUID()
      await execute(
        `INSERT INTO terms (id, kind, applies_to, slug, name, description, swatch, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          kind,
          scope,
          await uniqueTermSlug(kind, scope, typeof slug === 'string' && slug ? slug : name),
          name.trim().slice(0, 120),
          typeof description === 'string' ? description.trim().slice(0, 500) || null : null,
          typeof swatch === 'string' && SWATCH_NAMES.has(swatch as never) ? swatch : 'accent',
          next?.n ?? 1,
        ],
      )

      const row = await queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [id])
      res.status(201).json({ term: row ? toTerm(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:scope/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such term' })
        return
      }

      const { name, description, swatch, slug } = (req.body ?? {}) as Record<string, unknown>

      let nextSlug: string | null = null
      if (typeof slug === 'string') {
        nextSlug = await uniqueTermSlug(
          existing.kind,
          existing.applies_to,
          slug.trim() || (typeof name === 'string' ? name : existing.name),
          existing.id,
        )
      }

      await execute(
        `UPDATE terms
            SET name = COALESCE(?, name),
                slug = COALESCE(?, slug),
                description = ?,
                swatch = COALESCE(?, swatch)
          WHERE id = ?`,
        [
          typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : null,
          nextSlug,
          description !== undefined
            ? typeof description === 'string'
              ? description.trim().slice(0, 500) || null
              : null
            : existing.description,
          typeof swatch === 'string' && SWATCH_NAMES.has(swatch as never) ? swatch : null,
          existing.id,
        ],
      )

      const row = await queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [existing.id])
      res.json({ term: row ? toTerm(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * Deleting a term never deletes content.
 *
 * `posts.category_id` and `albums.category_id` are ON DELETE SET NULL, and the
 * tag links cascade — so a post that had the category loses its label and keeps
 * everything else. Anything stronger would make removing a label a way to lose
 * a year of writing.
 */
router.delete('/:scope/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such term' })
        return
      }
      await execute(`DELETE FROM terms WHERE id = ?`, [existing.id])
      await pruneTermLinks()
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:scope/reorder', (req, res, next) => {
  void (async () => {
    try {
      const { order } = (req.body ?? {}) as Record<string, unknown>
      if (!Array.isArray(order)) {
        res.status(400).json({ error: 'Send the full ordered list of term ids' })
        return
      }
      let position = 1
      for (const id of order) {
        if (typeof id !== 'string') continue
        await execute(`UPDATE terms SET position = ? WHERE id = ?`, [position++, id])
      }
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * Moves every item off one term and onto another, then deletes the first.
 *
 * The thing people actually want when they realize they have both "Editing" and
 * "Editorial". Without it the only route is re-tagging by hand, which is exactly
 * the tedium that leaves a site with three near-identical categories forever.
 */
router.post('/:scope/:id/merge', (req, res, next) => {
  void (async () => {
    try {
      const scope = scopeFrom(req.params.scope)
      const { intoId } = (req.body ?? {}) as Record<string, unknown>
      if (!scope || typeof intoId !== 'string') {
        res.status(400).json({ error: 'Choose a term to merge into' })
        return
      }
      if (intoId === req.params.id) {
        res.status(400).json({ error: 'That is the same term' })
        return
      }

      const [from, into] = await Promise.all([
        queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [req.params.id]),
        queryOne<TermRow>(`SELECT * FROM terms WHERE id = ?`, [intoId]),
      ])
      if (!from || !into) {
        res.status(404).json({ error: 'No such term' })
        return
      }
      if (from.kind !== into.kind || from.applies_to !== into.applies_to) {
        res.status(400).json({ error: 'Both terms must be the same kind and scope' })
        return
      }

      if (from.kind === 'category') {
        const table = scope === 'post' ? 'posts' : 'albums'
        await execute(`UPDATE ${table} SET category_id = ? WHERE category_id = ?`, [into.id, from.id])
      } else {
        // INSERT IGNORE, because an item carrying both tags already would
        // otherwise collide on the composite primary key.
        const links = await query<{ object_id: string }>(
          `SELECT object_id FROM term_links WHERE term_id = ? AND object_type = ?`,
          [from.id, scope],
        )
        for (const link of links) {
          await execute(
            `INSERT IGNORE INTO term_links (term_id, object_type, object_id) VALUES (?, ?, ?)`,
            [into.id, scope, link.object_id],
          )
        }
      }

      await execute(`DELETE FROM terms WHERE id = ?`, [from.id])
      await pruneTermLinks()
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
