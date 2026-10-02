import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, query, queryOne } from '../db.js'
import { requireAuth, requireOwner, nowSeconds } from '../auth.js'
import { recordRedirect, uniqueSlug } from '../lib/slug.js'
import { copySections, deleteSections, getSections, replaceSections } from '../lib/content.js'
import { attachCollectionData } from '../lib/render.js'
import type { Page, PageRow } from '../../shared/types.js'

/**
 * Pages.
 *
 * Every account edits the content of every page; only the owner can create or
 * delete one. The page structure was designed once, and what changes week to
 * week is the copy, the photographs and which sections are switched on.
 *
 * Pages carrying a `page_key` — home, sessions, portfolio, guides, blog — are fixed. The
 * router resolves those by key rather than by slug, so deleting one or renaming
 * its slug would break routing rather than merely remove a page. The API refuses
 * both, for everybody, including the owner.
 */
const router = Router()
router.use(requireAuth)

function toPage(row: PageRow): Page {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pageKey: row.page_key,
    status: row.status,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ogImage: row.og_image,
    noindex: row.noindex === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      const rows = await query<PageRow & { section_count: number }>(
        `SELECT p.*, (SELECT COUNT(*) FROM sections s
                       WHERE s.host_type = 'page' AND s.host_id = p.id) AS section_count
           FROM pages p
          ORDER BY p.page_key IS NULL ASC, p.created_at ASC, p.title ASC`,
      )
      res.json({
        pages: rows.map((row) => ({ ...toPage(row), sectionCount: Number(row.section_count) })),
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/:id', (req, res, next) => {
  void (async () => {
    try {
      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [req.params.id])
      if (!row) {
        res.status(404).json({ error: 'No such page' })
        return
      }
      // Hidden sections are included: the editor has to be able to see and
      // un-hide one, which is the whole reason hiding exists rather than deleting.
      const sections = await getSections('page', row.id, { includeHidden: true })
      // The dashboard preview renders the same components as the site, so its
      // collection widgets need their items — including drafts, which is the one
      // place the preview and the public page legitimately differ.
      await attachCollectionData(sections, { published: false })
      res.json({ page: { ...toPage(row), sections } })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const { title, slug } = (req.body ?? {}) as Record<string, unknown>
      const name = typeof title === 'string' && title.trim() ? title.trim() : 'Untitled page'

      const id = randomUUID()
      await execute(
        `INSERT INTO pages (id, slug, title, status) VALUES (?, ?, ?, 'draft')`,
        [id, await uniqueSlug('pages', typeof slug === 'string' && slug ? slug : name), name.slice(0, 255)],
      )

      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [id])
      res.status(201).json({ page: row ? toPage(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such page' })
        return
      }

      const body = (req.body ?? {}) as Record<string, unknown>
      const str = (v: unknown, max: number) =>
        typeof v === 'string' ? (v.trim() ? v.trim().slice(0, max) : null) : undefined
      const bool = (v: unknown) => (typeof v === 'boolean' ? (v ? 1 : 0) : undefined)

      let nextSlug: string | undefined
      if (typeof body.slug === 'string') {
        if (existing.page_key) {
          res.status(400).json({
            error: `“${existing.title}” has a fixed address because the site routes to it directly.`,
          })
          return
        }
        nextSlug = await uniqueSlug('pages', body.slug || existing.title, existing.id)
      }

      await execute(
        `UPDATE pages
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                meta_title = ?,
                meta_description = ?,
                og_image = ?,
                noindex = COALESCE(?, noindex),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [
          str(body.title, 255) ?? null,
          nextSlug ?? null,
          str(body.metaTitle, 255) ?? existing.meta_title,
          str(body.metaDescription, 500) ?? existing.meta_description,
          str(body.ogImage, 768) ?? existing.og_image,
          bool(body.noindex) ?? null,
          existing.id,
        ],
      )

      if (Array.isArray(body.sections)) {
        await replaceSections('page', existing.id, body.sections as never[])
      }

      // Only a published page has ever had a public address worth preserving.
      if (nextSlug && nextSlug !== existing.slug && existing.status === 'published') {
        await recordRedirect(`/${existing.slug}`, `/${nextSlug}`)
      }

      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [existing.id])
      const sections = await getSections('page', existing.id, { includeHidden: true })
      await attachCollectionData(sections, { published: false })
      res.json({ page: row ? { ...toPage(row), sections } : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * Publish, update or return to draft.
 *
 * One endpoint for all three because they are one decision with three outcomes,
 * and the dashboard's hold-to-confirm button needs a single thing to call. The
 * response carries the public URL so the confirmation dialog can show exactly
 * where the page now lives.
 */
router.post('/:id/status', (req, res, next) => {
  void (async () => {
    try {
      const { status } = (req.body ?? {}) as Record<string, unknown>
      if (status !== 'published' && status !== 'draft') {
        res.status(400).json({ error: 'Status must be published or draft' })
        return
      }

      const existing = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such page' })
        return
      }

      if (status === 'draft' && existing.page_key === 'home') {
        res.status(400).json({ error: 'The home page cannot be unpublished' })
        return
      }

      // `published_at` is set once, the first time the page goes live, and kept
      // afterwards — including through an unpublish, so returning to draft and
      // publishing again does not rewrite the original date. COALESCE rather
      // than a CASE on `status`: see the note on SqlParam in server/db.ts.
      await execute(
        `UPDATE pages
            SET status = ?,
                published_at = COALESCE(published_at, ?),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [status, status === 'published' ? nowSeconds() : null, existing.id],
      )

      res.json({
        ok: true,
        status,
        // `/` for the home page, not `/home` — the key is what the router uses.
        path: existing.page_key === 'home' ? '/' : `/${existing.slug}`,
        wasPublished: existing.status === 'published',
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/duplicate', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const source = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [
        String(req.params.id),
      ])
      if (!source) {
        res.status(404).json({ error: 'No such page' })
        return
      }

      const id = randomUUID()
      const title = `${source.title} (copy)`
      await execute(
        `INSERT INTO pages (id, slug, title, status, meta_description, noindex)
         VALUES (?, ?, ?, 'draft', ?, ?)`,
        [id, await uniqueSlug('pages', title), title.slice(0, 255), source.meta_description, source.noindex],
      )
      await copySections('page', source.id, id)

      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [id])
      res.status(201).json({ page: row ? toPage(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<PageRow>(`SELECT * FROM pages WHERE id = ?`, [
        String(req.params.id),
      ])
      if (!existing) {
        res.status(404).json({ error: 'No such page' })
        return
      }
      if (existing.page_key) {
        res.status(400).json({
          error: `“${existing.title}” is one of the pages the site routes to directly and cannot be deleted.`,
        })
        return
      }

      await deleteSections('page', existing.id)
      await execute(`DELETE FROM pages WHERE id = ?`, [existing.id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
