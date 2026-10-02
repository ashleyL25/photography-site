import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, queryOne } from '../db.js'
import { requireAuth, requireOwner } from '../auth.js'
import { recordRedirect, uniqueSlug } from '../lib/slug.js'
import { copySections, deleteSections, getSections, replaceSections } from '../lib/content.js'
import { cleanAgainst } from '../lib/content.js'
import { attachCollectionData } from '../lib/render.js'
import { getSessionType, listSessionTypes } from '../lib/catalog.js'
import { validCategoryId } from '../lib/taxonomy.js'
import { flag, optionalText, setStatus } from '../lib/publishing.js'
import { SESSION_FIELDS, cleanPackages, emptyPackageSet } from '../../shared/settings.js'
import { fieldDefaults, widgetDefaults } from '../../shared/widgets.js'
import type { SessionTypeRow } from '../../shared/types.js'

/**
 * Session types — Senior Pictures, Graduation, Engagements and the rest.
 *
 * A session is three things kept together: its **details** (the copy and
 * photographs every list and card draws on), its **packages** (the tier
 * ladder, priced off the rate card), and its **page** (sections, like any other
 * page). The connections — which guide it sends, which portfolio category is
 * "sessions like yours" — are columns, so they can be enforced.
 */
const router = Router()
router.use(requireAuth)

/** The page a brand-new session starts with: every section a session page had. */
const STARTER_SECTIONS = [
  'session_hero',
  'session_overview',
  'session_pricing',
  'session_guide',
  'session_albums',
  'session_nav',
  'cta_close',
]

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      res.json({ sessions: await listSessionTypes(false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/:id', (req, res, next) => {
  void (async () => {
    try {
      const session = await getSessionType({ id: req.params.id }, false)
      if (!session) {
        res.status(404).json({ error: 'No such session' })
        return
      }
      const sections = await getSections('session', session.id, { includeHidden: true })
      await attachCollectionData(sections, { published: false })
      res.json({ session: { ...session, sections } })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/', (req, res, next) => {
  void (async () => {
    try {
      const { title } = (req.body ?? {}) as Record<string, unknown>
      const name = typeof title === 'string' && title.trim() ? title.trim() : 'New session'
      const position =
        (await queryOne<{ n: number }>(`SELECT COALESCE(MAX(position), 0) + 1 AS n FROM session_types`))?.n ?? 1

      const id = randomUUID()
      await execute(
        `INSERT INTO session_types (id, slug, title, status, position, details, packages)
         VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
        [
          id,
          await uniqueSlug('session_types', name),
          name.slice(0, 255),
          position,
          JSON.stringify({ ...fieldDefaults(SESSION_FIELDS), index: String(position).padStart(2, '0') }),
          JSON.stringify(emptyPackageSet()),
        ],
      )

      await replaceSections(
        'session',
        id,
        STARTER_SECTIONS.map((type) => ({ type, ...widgetDefaults(type) })),
      )

      res.status(201).json({ session: await getSessionType({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<SessionTypeRow>(`SELECT * FROM session_types WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such session' })
        return
      }
      const body = (req.body ?? {}) as Record<string, unknown>

      const nextSlug =
        typeof body.slug === 'string'
          ? await uniqueSlug('session_types', body.slug || existing.title, existing.id)
          : undefined

      // A guide id is accepted only if that guide exists, so a stale dashboard
      // cannot point a session at something deleted in another tab.
      let guideId: string | null | undefined
      if (body.guideId !== undefined) {
        guideId =
          typeof body.guideId === 'string' && body.guideId
            ? ((await queryOne<{ id: string }>(`SELECT id FROM guides WHERE id = ?`, [body.guideId]))?.id ?? null)
            : null
      }
      const categoryId =
        body.portfolioCategoryId !== undefined ? await validCategoryId('portfolio', body.portfolioCategoryId) : undefined

      await execute(
        `UPDATE session_types
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                details = COALESCE(?, details),
                packages = COALESCE(?, packages),
                private_pricing = COALESCE(?, private_pricing),
                guide_id = ${guideId === undefined ? 'guide_id' : '?'},
                portfolio_category_id = ${categoryId === undefined ? 'portfolio_category_id' : '?'},
                meta_title = ?,
                meta_description = ?,
                og_image = ?,
                noindex = COALESCE(?, noindex),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [
          optionalText(body.title, 255) ?? null,
          nextSlug ?? null,
          body.details !== undefined ? JSON.stringify(cleanAgainst(SESSION_FIELDS, body.details)) : null,
          body.packages !== undefined ? JSON.stringify(cleanPackages(body.packages)) : null,
          flag(body.privatePricing) ?? null,
          ...(guideId === undefined ? [] : [guideId]),
          ...(categoryId === undefined ? [] : [categoryId]),
          body.metaTitle !== undefined ? (optionalText(body.metaTitle, 255) ?? null) : existing.meta_title,
          body.metaDescription !== undefined ? (optionalText(body.metaDescription, 500) ?? null) : existing.meta_description,
          body.ogImage !== undefined ? (optionalText(body.ogImage, 768) ?? null) : existing.og_image,
          flag(body.noindex) ?? null,
          existing.id,
        ],
      )

      // Keep the guide's own pointer back in step, so each side names the other.
      if (guideId !== undefined) {
        await execute(`UPDATE guides SET session_type_id = NULL WHERE session_type_id = ? AND id <> ?`, [
          existing.id,
          guideId ?? '',
        ])
        if (guideId) await execute(`UPDATE guides SET session_type_id = ? WHERE id = ?`, [existing.id, guideId])
      }

      if (Array.isArray(body.sections)) await replaceSections('session', existing.id, body.sections as never[])

      if (nextSlug && nextSlug !== existing.slug && existing.status === 'published') {
        await recordRedirect(`/sessions/${existing.slug}`, `/sessions/${nextSlug}`)
      }

      const session = await getSessionType({ id: existing.id }, false)
      const sections = await getSections('session', existing.id, { includeHidden: true })
      res.json({ session: session ? { ...session, sections } : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/status', (req, res, next) => {
  void (async () => {
    try {
      const result = await setStatus('session_types', String(req.params.id), (req.body ?? {}).status)
      if (!result.ok) {
        res.status(result.code).json({ error: result.error })
        return
      }
      const row = await queryOne<{ slug: string }>(`SELECT slug FROM session_types WHERE id = ?`, [req.params.id])
      res.json({ ok: true, status: req.body.status, path: `/sessions/${row?.slug}`, wasPublished: result.wasPublished })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/** Reorders the sessions. Sent as the complete ordered list of ids. */
router.post('/reorder', (req, res, next) => {
  void (async () => {
    try {
      const { order } = (req.body ?? {}) as Record<string, unknown>
      if (!Array.isArray(order)) {
        res.status(400).json({ error: 'Send the full ordered list of session ids' })
        return
      }
      let position = 1
      for (const id of order) {
        if (typeof id === 'string') await execute(`UPDATE session_types SET position = ? WHERE id = ?`, [position++, id])
      }
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/duplicate', (req, res, next) => {
  void (async () => {
    try {
      const source = await queryOne<SessionTypeRow>(`SELECT * FROM session_types WHERE id = ?`, [String(req.params.id)])
      if (!source) {
        res.status(404).json({ error: 'No such session' })
        return
      }
      const id = randomUUID()
      const title = `${source.title} (copy)`
      await execute(
        `INSERT INTO session_types (id, slug, title, status, position, portfolio_category_id, private_pricing, details, packages)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
        [
          id,
          await uniqueSlug('session_types', title),
          title.slice(0, 255),
          source.position + 1,
          source.portfolio_category_id,
          source.private_pricing,
          source.details,
          source.packages,
        ],
      )
      await copySections('session', source.id, id)
      res.status(201).json({ session: await getSessionType({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const id = String(req.params.id)
      await deleteSections('session', id)
      await execute(`UPDATE guides SET session_type_id = NULL WHERE session_type_id = ?`, [id])
      await execute(`DELETE FROM session_types WHERE id = ?`, [id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
