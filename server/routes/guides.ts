import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, queryOne } from '../db.js'
import { requireAuth, requireOwner } from '../auth.js'
import { recordRedirect, uniqueSlug } from '../lib/slug.js'
import { cleanAgainst, copySections, deleteSections, getSections, replaceSections } from '../lib/content.js'
import { getGuide, listGuides, chapterCounts } from '../lib/catalog.js'
import { flag, optionalText, setStatus } from '../lib/publishing.js'
import { GUIDE_FIELDS } from '../../shared/settings.js'
import { fieldDefaults, widgetDefaults } from '../../shared/widgets.js'
import type { GuideRow } from '../../shared/types.js'

/**
 * Prep guides — the page a client is sent the day they book.
 *
 * The masthead and the opening letter are the guide's details. The chapters are
 * sections: a Chapter widget starts one, and every block after it belongs to it
 * until the next. That keeps a guide editable with the same page builder as
 * everything else, while still rendering as numbered chapters with an index.
 */
const router = Router()
router.use(requireAuth)

const STARTER_SECTIONS = ['guide_hero', 'guide_letter', 'guide_chapter', 'guide_prose', 'guide_close']

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      const guides = await listGuides(false)
      const counts = await chapterCounts(guides.map((g) => g.id))
      res.json({ guides: guides.map((g) => ({ ...g, chapters: counts.get(g.id) ?? 0 })) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/:id', (req, res, next) => {
  void (async () => {
    try {
      const guide = await getGuide({ id: req.params.id }, false)
      if (!guide) {
        res.status(404).json({ error: 'No such guide' })
        return
      }
      const sections = await getSections('guide', guide.id, { includeHidden: true })
      res.json({ guide: { ...guide, sections } })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/', (req, res, next) => {
  void (async () => {
    try {
      const { title } = (req.body ?? {}) as Record<string, unknown>
      const name = typeof title === 'string' && title.trim() ? title.trim() : 'New guide'
      const position =
        (await queryOne<{ n: number }>(`SELECT COALESCE(MAX(position), 0) + 1 AS n FROM guides`))?.n ?? 1
      const id = randomUUID()
      await execute(
        `INSERT INTO guides (id, slug, title, status, position, details) VALUES (?, ?, ?, 'draft', ?, ?)`,
        [id, await uniqueSlug('guides', name), name.slice(0, 255), position, JSON.stringify(fieldDefaults(GUIDE_FIELDS))],
      )
      await replaceSections(
        'guide',
        id,
        STARTER_SECTIONS.map((type) => ({ type, ...widgetDefaults(type) })),
      )
      res.status(201).json({ guide: await getGuide({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<GuideRow>(`SELECT * FROM guides WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such guide' })
        return
      }
      const body = (req.body ?? {}) as Record<string, unknown>
      const nextSlug =
        typeof body.slug === 'string' ? await uniqueSlug('guides', body.slug || existing.title, existing.id) : undefined

      let sessionId: string | null | undefined
      if (body.sessionTypeId !== undefined) {
        sessionId =
          typeof body.sessionTypeId === 'string' && body.sessionTypeId
            ? ((await queryOne<{ id: string }>(`SELECT id FROM session_types WHERE id = ?`, [body.sessionTypeId]))?.id ??
              null)
            : null
      }

      await execute(
        `UPDATE guides
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                details = COALESCE(?, details),
                session_type_id = ${sessionId === undefined ? 'session_type_id' : '?'},
                meta_title = ?,
                meta_description = ?,
                noindex = COALESCE(?, noindex),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [
          optionalText(body.title, 255) ?? null,
          nextSlug ?? null,
          body.details !== undefined ? JSON.stringify(cleanAgainst(GUIDE_FIELDS, body.details)) : null,
          ...(sessionId === undefined ? [] : [sessionId]),
          body.metaTitle !== undefined ? (optionalText(body.metaTitle, 255) ?? null) : existing.meta_title,
          body.metaDescription !== undefined ? (optionalText(body.metaDescription, 500) ?? null) : existing.meta_description,
          flag(body.noindex) ?? null,
          existing.id,
        ],
      )

      // Each side names the other: the session's guide follows the guide's session.
      if (sessionId !== undefined) {
        await execute(`UPDATE session_types SET guide_id = NULL WHERE guide_id = ? AND id <> ?`, [
          existing.id,
          sessionId ?? '',
        ])
        if (sessionId) await execute(`UPDATE session_types SET guide_id = ? WHERE id = ?`, [existing.id, sessionId])
      }

      if (Array.isArray(body.sections)) await replaceSections('guide', existing.id, body.sections as never[])

      if (nextSlug && nextSlug !== existing.slug && existing.status === 'published') {
        await recordRedirect(`/guides/${existing.slug}`, `/guides/${nextSlug}`)
      }

      const guide = await getGuide({ id: existing.id }, false)
      const sections = await getSections('guide', existing.id, { includeHidden: true })
      res.json({ guide: guide ? { ...guide, sections } : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/status', (req, res, next) => {
  void (async () => {
    try {
      const result = await setStatus('guides', String(req.params.id), (req.body ?? {}).status)
      if (!result.ok) {
        res.status(result.code).json({ error: result.error })
        return
      }
      const row = await queryOne<{ slug: string }>(`SELECT slug FROM guides WHERE id = ?`, [req.params.id])
      res.json({ ok: true, status: req.body.status, path: `/guides/${row?.slug}`, wasPublished: result.wasPublished })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/duplicate', (req, res, next) => {
  void (async () => {
    try {
      const source = await queryOne<GuideRow>(`SELECT * FROM guides WHERE id = ?`, [String(req.params.id)])
      if (!source) {
        res.status(404).json({ error: 'No such guide' })
        return
      }
      const id = randomUUID()
      const title = `${source.title} (copy)`
      await execute(
        `INSERT INTO guides (id, slug, title, status, position, details) VALUES (?, ?, ?, 'draft', ?, ?)`,
        [id, await uniqueSlug('guides', title), title.slice(0, 255), source.position + 1, source.details],
      )
      await copySections('guide', source.id, id)
      res.status(201).json({ guide: await getGuide({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const id = String(req.params.id)
      await deleteSections('guide', id)
      await execute(`UPDATE session_types SET guide_id = NULL WHERE guide_id = ?`, [id])
      await execute(`DELETE FROM guides WHERE id = ?`, [id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
