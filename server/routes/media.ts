import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, query, queryOne } from '../db.js'
import { requireAuth } from '../auth.js'
import { mediaConfigError, mediaConfigured } from '../env.js'
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  deleteObject,
  mediaKey,
  objectExists,
  photoPrefix,
  presignPut,
  publicUrl,
} from '../r2.js'
import { photoRegistry } from '../lib/catalog.js'
import type { MediaItem, MediaRow } from '../../shared/types.js'

/**
 * The media library.
 *
 * Uploads are two round trips and the file itself never touches this server:
 *
 *   1. `POST /sign` mints an id and a presigned PUT URL. No row is written.
 *   2. The browser PUTs the bytes straight to Cloudflare.
 *   3. `POST /commit` verifies the object landed and *then* writes the row.
 *
 * Writing the row first would put entries in the library that 404. The cost of
 * this order is that an abandoned upload leaves an orphaned object in R2 — which
 * costs a fraction of a cent and is invisible, whereas a broken image in a
 * published piece is neither.
 */
const router = Router()
router.use(requireAuth)

function toItem(row: MediaRow): MediaItem {
  let widths: number[] = []
  try {
    widths = row.widths ? (JSON.parse(row.widths) as number[]) : []
  } catch {
    widths = []
  }
  return {
    id: row.id,
    key: row.r2_key,
    url: row.url,
    prefix: row.prefix,
    widths,
    color: row.color,
    lqip: row.lqip,
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    folder: row.folder,
    createdAt: row.created_at,
  }
}

router.get('/', (req, res, next) => {
  void (async () => {
    try {
      const q = req.query as Record<string, string | undefined>
      const where: string[] = []
      const params: (string | number)[] = []

      if (q.search?.trim()) {
        where.push('(filename LIKE ? OR alt LIKE ?)')
        params.push(`%${q.search.trim()}%`, `%${q.search.trim()}%`)
      }
      if (q.folder) {
        where.push('folder = ?')
        params.push(q.folder)
      }
      if (q.kind === 'image') {
        where.push("mime LIKE 'image/%'")
      } else if (q.kind === 'file') {
        where.push("mime NOT LIKE 'image/%'")
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
      const limit = Math.min(Number(q.limit) || 60, 200)
      const offset = Math.max(Number(q.offset) || 0, 0)

      const [rows, total] = await Promise.all([
        query<MediaRow>(
          `SELECT * FROM media ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
          params,
        ),
        queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM media ${whereSql}`, params),
      ])

      res.json({ items: rows.map(toItem), total: Number(total?.n ?? 0) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/sign', (req, res, next) => {
  void (async () => {
    try {
      if (!mediaConfigured) {
        res.status(503).json({ error: mediaConfigError() })
        return
      }

      const { filename, mime, bytes } = (req.body ?? {}) as Record<string, unknown>

      if (typeof filename !== 'string' || typeof mime !== 'string') {
        res.status(400).json({ error: 'Filename and type are required' })
        return
      }
      if (!ALLOWED_UPLOAD_TYPES[mime]) {
        res.status(415).json({
          error: `${mime} cannot be uploaded. Images, PDFs, EPUBs and Word documents are accepted.`,
        })
        return
      }
      if (typeof bytes === 'number' && bytes > MAX_UPLOAD_BYTES) {
        res.status(413).json({
          error: `That file is ${(bytes / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
        })
        return
      }

      const id = randomUUID()
      const key = mediaKey(id, filename, mime)
      res.json({ id, key, url: await presignPut(key, mime), publicUrl: publicUrl(key) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/commit', (req, res, next) => {
  void (async () => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>
      const { id, key, filename, mime } = body

      if (
        typeof id !== 'string' ||
        typeof key !== 'string' ||
        typeof filename !== 'string' ||
        typeof mime !== 'string'
      ) {
        res.status(400).json({ error: 'Incomplete upload' })
        return
      }
      if (!ALLOWED_UPLOAD_TYPES[mime]) {
        res.status(415).json({ error: 'That file type cannot be uploaded' })
        return
      }
      // The key is rebuilt from the id and name rather than taken as given, so a
      // crafted request cannot commit a row pointing at somebody else's object
      // or at a path outside the media prefix.
      if (key !== mediaKey(id, filename, mime)) {
        // Recomputing includes the current month, so an upload signed either
        // side of midnight on the 1st would legitimately disagree. Accept the
        // client's key only when it still lands inside the media prefix.
        if (!/^media\/\d{4}\/\d{2}\/[A-Za-z0-9._-]+$/.test(key)) {
          res.status(400).json({ error: 'That upload key is not valid' })
          return
        }
      }

      if (!(await objectExists(key))) {
        res.status(409).json({ error: 'The file did not finish uploading. Try again.' })
        return
      }

      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)

      await execute(
        `INSERT INTO media (id, r2_key, url, filename, mime, bytes, width, height, alt, folder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          key,
          publicUrl(key),
          filename.slice(0, 255),
          mime,
          num(body.bytes) ?? 0,
          num(body.width),
          num(body.height),
          typeof body.alt === 'string' ? body.alt.slice(0, 255) || null : null,
          typeof body.folder === 'string' ? body.folder.slice(0, 80) || null : null,
        ],
      )

      const row = await queryOne<MediaRow>(`SELECT * FROM media WHERE id = ?`, [id])
      res.status(201).json({ item: row ? toItem(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Photographs
 *
 * A photograph is uploaded as the set of WebP renditions the site's Photo
 * component renders — generated in the browser from the original, so the
 * full-size file never crosses this server or the bucket. Same two round trips
 * as a file: sign every rendition, the browser PUTs them, then commit.
 * ------------------------------------------------------------------ */

/** The widths the site's srcsets are built from. */
export const PHOTO_WIDTHS = [480, 960, 1440, 2000, 2600]

/**
 * The photo registry for a list of URLs — what the dashboard's previews need to
 * draw the photographs in whatever is being edited exactly as the site will.
 */
/** The folders in use, for the library's filter. */
router.get('/folders', (_req, res, next) => {
  void (async () => {
    try {
      const rows = await query<{ folder: string; n: number }>(
        `SELECT folder, COUNT(*) AS n FROM media WHERE folder IS NOT NULL AND folder <> '' GROUP BY folder ORDER BY folder`,
      )
      res.json({ folders: rows.map((r) => ({ name: r.folder, count: Number(r.n) })) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/registry', (req, res, next) => {
  void (async () => {
    try {
      const urls = Array.isArray(req.body?.urls)
        ? (req.body.urls as unknown[]).filter((u): u is string => typeof u === 'string').slice(0, 1000)
        : []
      res.json({ photos: await photoRegistry(urls) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/sign-photo', (req, res, next) => {
  void (async () => {
    try {
      if (!mediaConfigured) {
        res.status(503).json({ error: mediaConfigError() })
        return
      }
      const { filename } = (req.body ?? {}) as Record<string, unknown>
      if (typeof filename !== 'string' || !filename) {
        res.status(400).json({ error: 'A filename is required' })
        return
      }
      const id = randomUUID()
      const prefix = photoPrefix(id, filename)
      const urls: Record<number, string> = {}
      for (const width of PHOTO_WIDTHS) {
        urls[width] = await presignPut(`${prefix}-${width}.webp`, 'image/webp')
      }
      res.json({ id, prefix, widths: PHOTO_WIDTHS, urls })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/commit-photo', (req, res, next) => {
  void (async () => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>
      const { id, prefix, filename } = body
      if (typeof id !== 'string' || typeof prefix !== 'string' || typeof filename !== 'string') {
        res.status(400).json({ error: 'Incomplete upload' })
        return
      }
      // Rebuilt from the id rather than trusted, so a crafted request cannot
      // commit a row pointing at an object outside the media prefix.
      if (!/^media\/\d{4}\/\d{2}\/[a-z0-9-]+$/.test(prefix) || !prefix.endsWith(id.slice(0, 8))) {
        res.status(400).json({ error: 'That upload is not valid' })
        return
      }

      const widths = (Array.isArray(body.widths) ? body.widths : [])
        .map(Number)
        .filter((w) => PHOTO_WIDTHS.includes(w))
        .sort((a, b) => a - b)
      if (widths.length === 0) {
        res.status(400).json({ error: 'No renditions were uploaded' })
        return
      }
      // The plain URL is the 1440 rendition, or the largest there is when the
      // original was smaller than that.
      const main = widths.includes(1440) ? 1440 : widths[widths.length - 1]
      if (!(await objectExists(`${prefix}-${main}.webp`))) {
        res.status(409).json({ error: 'The photograph did not finish uploading. Try again.' })
        return
      }

      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)
      const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) || null : null)
      const lqip = typeof body.lqip === 'string' && body.lqip.startsWith('data:image/') ? body.lqip.slice(0, 4000) : null

      await execute(
        `INSERT INTO media (id, r2_key, url, prefix, widths, color, lqip, filename, mime, bytes, width, height, alt, folder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'image/webp', ?, ?, ?, ?, ?)`,
        [
          id,
          prefix,
          publicUrl(`${prefix}-${main}.webp`),
          publicUrl(prefix),
          JSON.stringify(widths),
          text(body.color, 40),
          lqip,
          filename.slice(0, 255),
          num(body.bytes) ?? 0,
          num(body.width),
          num(body.height),
          text(body.alt, 255),
          text(body.folder, 80),
        ],
      )

      const row = await queryOne<MediaRow>(`SELECT * FROM media WHERE id = ?`, [id])
      res.status(201).json({ item: row ? toItem(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const { alt, filename, folder } = (req.body ?? {}) as Record<string, unknown>
      await execute(
        `UPDATE media
            SET alt = ?, filename = COALESCE(?, filename), folder = ?
          WHERE id = ?`,
        [
          typeof alt === 'string' ? alt.slice(0, 255) || null : null,
          typeof filename === 'string' && filename.trim() ? filename.trim().slice(0, 255) : null,
          typeof folder === 'string' ? folder.trim().slice(0, 80) || null : null,
          req.params.id,
        ],
      )
      const row = await queryOne<MediaRow>(`SELECT * FROM media WHERE id = ?`, [req.params.id])
      if (!row) {
        res.status(404).json({ error: 'No such file' })
        return
      }
      res.json({ item: toItem(row) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * Deletes the row, then the object.
 *
 * That order, not the reverse. If the object delete fails, the library is
 * correct and R2 holds one orphan nobody can reach. Reversed, a failure after
 * removing the bytes would leave a row pointing at nothing — a broken image in
 * every piece that used it, with no way to tell from the dashboard.
 *
 * Usage is reported rather than blocked: a file can be referenced from a section
 * blob in half a dozen shapes, and the honest answer is "this appears in three
 * places, delete anyway?" rather than a refusal that cannot be trusted either.
 */
router.delete('/:id', (req, res, next) => {
  void (async () => {
    try {
      const row = await queryOne<MediaRow>(`SELECT * FROM media WHERE id = ?`, [req.params.id])
      if (!row) {
        res.status(404).json({ error: 'No such file' })
        return
      }

      await execute(`DELETE FROM media WHERE id = ?`, [row.id])

      // A photograph that ships with the site has no key: removing it from the
      // library is all there is to do. An uploaded one is a set of renditions.
      if (row.r2_key && mediaConfigured) {
        const keys = row.prefix ? toItem(row).widths.map((w) => `${row.r2_key}-${w}.webp`) : [row.r2_key]
        for (const key of keys) {
          try {
            await deleteObject(key)
          } catch (err) {
            console.error('media: row deleted but R2 object remains', key, err)
          }
        }
      }

      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/** Where a file is referenced, so "delete" can say what it will break. */
router.get('/:id/usage', (req, res, next) => {
  void (async () => {
    try {
      const row = await queryOne<MediaRow>(`SELECT * FROM media WHERE id = ?`, [req.params.id])
      if (!row) {
        res.status(404).json({ error: 'No such file' })
        return
      }

      const needle = `%${row.url}%`
      const [sections, posts, albums, pages, sessions, guides, settings] = await Promise.all([
        query<{ host_type: string; host_id: string }>(
          `SELECT DISTINCT host_type, host_id FROM sections WHERE content LIKE ? OR styles LIKE ?`,
          [needle, needle],
        ),
        query<{ id: string; title: string }>(
          `SELECT id, title FROM posts WHERE featured_image = ? OR og_image = ?`,
          [row.url, row.url],
        ),
        query<{ id: string; title: string }>(`SELECT id, title FROM albums WHERE cover = ? OR photos LIKE ?`, [
          row.url,
          needle,
        ]),
        query<{ id: string; title: string }>(`SELECT id, title FROM pages WHERE og_image = ?`, [row.url]),
        query<{ id: string; title: string }>(`SELECT id, title FROM session_types WHERE details LIKE ?`, [needle]),
        query<{ id: string; title: string }>(`SELECT id, title FROM guides WHERE details LIKE ?`, [needle]),
        query<{ key: string }>('SELECT `key` FROM settings WHERE `value` LIKE ?', [needle]),
      ])

      res.json({ sections, posts, albums, pages, sessions, guides, settings })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
