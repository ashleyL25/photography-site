import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, queryOne } from '../db.js'
import { requireAuth, requireOwner } from '../auth.js'
import { recordRedirect, uniqueSlug } from '../lib/slug.js'
import { copySections, deleteSections, getSections, replaceSections } from '../lib/content.js'
import { attachCollectionData } from '../lib/render.js'
import { getAlbum, listAlbums, photoRegistry, toAlbumSummary } from '../lib/catalog.js'
import { validCategoryId } from '../lib/taxonomy.js'
import { flag, optionalText, setStatus } from '../lib/publishing.js'
import type { AlbumRow } from '../../shared/types.js'

/**
 * Albums — the portfolio, one real shoot each.
 *
 * An album is its facts (title, category, date, where, the story) and its
 * photographs, in order, chosen from the media library. Those drive the album's
 * page directly; sections are optional extras that render beneath the gallery.
 * Which session page an album appears on follows from its category.
 */
const router = Router()
router.use(requireAuth)

/** ISO date or nothing — the column sorts the portfolio, so it must be sortable. */
function isoDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !value) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function photoList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => v.slice(0, 768))
    .slice(0, 600)
}

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      const albums = await listAlbums(false)
      const summaries = albums.map((a) => ({ ...toAlbumSummary(a), status: a.status, updatedAt: a.updatedAt }))
      res.json({ albums: summaries, photos: await photoRegistry(summaries.map((a) => a.cover ?? '')) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/:id', (req, res, next) => {
  void (async () => {
    try {
      const album = await getAlbum({ id: req.params.id }, false)
      if (!album) {
        res.status(404).json({ error: 'No such album' })
        return
      }
      const sections = await getSections('album', album.id, { includeHidden: true })
      await attachCollectionData(sections, { published: false })
      res.json({ album: { ...album, sections }, photos: await photoRegistry([...album.photos, album.cover ?? '']) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/', (req, res, next) => {
  void (async () => {
    try {
      const { title, categoryId } = (req.body ?? {}) as Record<string, unknown>
      const name = typeof title === 'string' && title.trim() ? title.trim() : 'New album'
      const id = randomUUID()
      const today = new Date().toISOString().slice(0, 10)
      await execute(
        `INSERT INTO albums (id, slug, title, status, category_id, shoot_date, date_label, photos)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, '[]')`,
        [
          id,
          await uniqueSlug('albums', name),
          name.slice(0, 255),
          await validCategoryId('portfolio', categoryId),
          today,
          new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        ],
      )
      res.status(201).json({ album: await getAlbum({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<AlbumRow>(`SELECT * FROM albums WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such album' })
        return
      }
      const body = (req.body ?? {}) as Record<string, unknown>
      const nextSlug =
        typeof body.slug === 'string' ? await uniqueSlug('albums', body.slug || existing.title, existing.id) : undefined
      const photos = photoList(body.photos)
      const categoryId = body.categoryId !== undefined ? await validCategoryId('portfolio', body.categoryId) : undefined
      const shootDate = isoDate(body.shootDate)

      // For each optional column: the sent value when the key was sent (empty
      // clears it), otherwise what was there.
      const keep = <T,>(sent: T | undefined, current: T) => (sent === undefined ? current : sent)

      await execute(
        `UPDATE albums
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                category_id = ?,
                featured = COALESCE(?, featured),
                shoot_date = ?,
                date_label = ?,
                cover = ?,
                story = ?,
                location = ?,
                conditions = ?,
                requests = ?,
                photos = COALESCE(?, photos),
                meta_title = ?,
                meta_description = ?,
                noindex = COALESCE(?, noindex),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [
          optionalText(body.title, 255) ?? null,
          nextSlug ?? null,
          keep(categoryId, existing.category_id),
          flag(body.featured) ?? null,
          keep(shootDate, existing.shoot_date),
          keep(optionalText(body.dateLabel, 80), existing.date_label),
          keep(optionalText(body.cover, 768), existing.cover),
          keep(optionalText(body.story, 4000), existing.story),
          keep(optionalText(body.location, 255), existing.location),
          keep(optionalText(body.conditions, 255), existing.conditions),
          keep(optionalText(body.requests, 500), existing.requests),
          photos ? JSON.stringify(photos) : null,
          keep(optionalText(body.metaTitle, 255), existing.meta_title),
          keep(optionalText(body.metaDescription, 500), existing.meta_description),
          flag(body.noindex) ?? null,
          existing.id,
        ],
      )

      if (Array.isArray(body.sections)) await replaceSections('album', existing.id, body.sections as never[])

      if (nextSlug && nextSlug !== existing.slug && existing.status === 'published') {
        await recordRedirect(`/portfolio/${existing.slug}`, `/portfolio/${nextSlug}`)
      }

      const album = await getAlbum({ id: existing.id }, false)
      const sections = await getSections('album', existing.id, { includeHidden: true })
      res.json({
        album: album ? { ...album, sections } : null,
        photos: album ? await photoRegistry([...album.photos, album.cover ?? '']) : {},
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/status', (req, res, next) => {
  void (async () => {
    try {
      const result = await setStatus('albums', String(req.params.id), (req.body ?? {}).status)
      if (!result.ok) {
        res.status(result.code).json({ error: result.error })
        return
      }
      const row = await queryOne<{ slug: string }>(`SELECT slug FROM albums WHERE id = ?`, [req.params.id])
      res.json({ ok: true, status: req.body.status, path: `/portfolio/${row?.slug}`, wasPublished: result.wasPublished })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/duplicate', (req, res, next) => {
  void (async () => {
    try {
      const source = await queryOne<AlbumRow>(`SELECT * FROM albums WHERE id = ?`, [String(req.params.id)])
      if (!source) {
        res.status(404).json({ error: 'No such album' })
        return
      }
      const id = randomUUID()
      const title = `${source.title} (copy)`
      await execute(
        `INSERT INTO albums (id, slug, title, status, category_id, shoot_date, date_label, cover, story, location, conditions, requests, photos)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          await uniqueSlug('albums', title),
          title.slice(0, 255),
          source.category_id,
          source.shoot_date,
          source.date_label,
          source.cover,
          source.story,
          source.location,
          source.conditions,
          source.requests,
          source.photos,
        ],
      )
      await copySections('album', source.id, id)
      res.status(201).json({ album: await getAlbum({ id }, false) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', requireOwner, (req, res, next) => {
  void (async () => {
    try {
      const id = String(req.params.id)
      await deleteSections('album', id)
      await execute(`DELETE FROM albums WHERE id = ?`, [id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
