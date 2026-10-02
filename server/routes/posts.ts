import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, queryOne } from '../db.js'
import { currentUser, nowSeconds, requireAuth } from '../auth.js'
import { recordRedirect, uniqueSlug } from '../lib/slug.js'
import {
  cleanSectionContent,
  cleanSectionStyles,
  copySections,
  deleteSections,
  getSections,
  makeExcerpt,
  readingMinutes,
  replaceSections,
  sectionsToText,
} from '../lib/content.js'
import { attachCollectionData } from '../lib/render.js'
import { getPostById, listPosts } from '../lib/collections.js'
import { clearTags, setTags, validCategoryId } from '../lib/taxonomy.js'
import { getTemplate } from '../../shared/templates.js'
import { widgetDefaults } from '../../shared/widgets.js'
import type { PostRow } from '../../shared/types.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res, next) => {
  void (async () => {
    try {
      const q = req.query as Record<string, string | undefined>
      const result = await listPosts({
        // The dashboard sees drafts. This is the only place `published` is false,
        // and it is set here rather than read from the request on purpose.
        published: false,
        search: q.search,
        categories: q.category ? [q.category] : undefined,
        tags: q.tag ? [q.tag] : undefined,
        order: (q.order as never) ?? 'newest',
        limit: Number(q.limit) || 50,
        offset: Number(q.offset) || 0,
      })
      res.json(result)
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/:id', (req, res, next) => {
  void (async () => {
    try {
      const post = await getPostById(req.params.id)
      if (!post) {
        res.status(404).json({ error: 'No such post' })
        return
      }
      const sections = await getSections('post', post.id, { includeHidden: true })
      await attachCollectionData(sections, { published: false, excludeId: post.id })
      res.json({ post: { ...post, sections } })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * A new post, optionally built from a template.
 *
 * The template's sections are written straight into the sections table and the
 * link is then forgotten — `posts.template` records which one was used and
 * nothing reads it back. That is the whole design: a template is a starting
 * point, so editing one later must never rewrite a post somebody has since
 * worked on.
 */
router.post('/', (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      const { title, template } = (req.body ?? {}) as Record<string, unknown>
      const name = typeof title === 'string' && title.trim() ? title.trim() : 'Untitled post'
      const templateId = typeof template === 'string' ? template : 'blank'

      const id = randomUUID()
      await execute(
        `INSERT INTO posts (id, slug, title, status, author_id, template)
         VALUES (?, ?, ?, 'draft', ?, ?)`,
        [id, await uniqueSlug('posts', name), name.slice(0, 255), me.id, templateId],
      )

      const chosen = getTemplate(templateId)
      if (chosen && chosen.sections.length > 0) {
        let position = 0
        for (const section of chosen.sections) {
          const base = widgetDefaults(section.type)
          await execute(
            `INSERT INTO sections (id, host_type, host_id, widget_type, position, hidden, content, styles)
             VALUES (?, 'post', ?, ?, ?, 0, ?, ?)`,
            [
              randomUUID(),
              id,
              section.type,
              position++,
              // Run through the same cleaner as user input: a template is data,
              // and data that skips validation is data that eventually breaks a
              // renderer expecting a shape it never checked.
              JSON.stringify(
                cleanSectionContent(section.type, { ...base.content, ...(section.content ?? {}) }),
              ),
              JSON.stringify(cleanSectionStyles({ ...base.styles, ...(section.styles ?? {}) })),
            ],
          )
        }
      }

      const post = await getPostById(id)
      res.status(201).json({ post })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<PostRow>(`SELECT * FROM posts WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such post' })
        return
      }

      const body = (req.body ?? {}) as Record<string, unknown>
      const str = (v: unknown, max: number) =>
        typeof v === 'string' ? (v.trim() ? v.trim().slice(0, max) : null) : undefined
      const bool = (v: unknown) => (typeof v === 'boolean' ? (v ? 1 : 0) : undefined)

      /**
       * The slug follows the title until it is overridden.
       *
       * The editor sends `slug: ''` when Ashley clears the field, which means
       * "go back to following the title" rather than "make the URL empty". An
       * absent `slug` key means she did not touch it at all, and the stored one
       * is kept even if the title changed — renaming a published post's URL
       * silently would be far worse than a slug that no longer matches.
       */
      let nextSlug: string | undefined
      if (typeof body.slug === 'string') {
        const desired = body.slug.trim() || (str(body.title, 255) ?? existing.title)
        nextSlug = await uniqueSlug('posts', desired, existing.id)
      }

      if (Array.isArray(body.sections)) {
        await replaceSections('post', existing.id, body.sections as never[])
      }

      // Reading time and the fallback excerpt are derived from what was just
      // saved, so a listing page never has to load a post's body to show either.
      const sections = await getSections('post', existing.id, { includeHidden: false })
      const text = sectionsToText(sections)
      const minutes = readingMinutes(text)
      const excerpt =
        str(body.excerpt, 600) ?? (existing.excerpt || (text ? makeExcerpt(text, 200) : null))

      await execute(
        `UPDATE posts
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                subtitle = ?,
                excerpt = ?,
                featured_image = ?,
                featured_alt = ?,
                category_id = ?,
                featured = COALESCE(?, featured),
                reading_minutes = ?,
                meta_title = ?,
                meta_description = ?,
                og_image = ?,
                noindex = COALESCE(?, noindex),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [
          str(body.title, 255) ?? null,
          nextSlug ?? null,
          body.subtitle !== undefined ? (str(body.subtitle, 255) ?? null) : existing.subtitle,
          excerpt,
          body.featuredImage !== undefined
            ? (str(body.featuredImage, 512) ?? null)
            : existing.featured_image,
          body.featuredAlt !== undefined ? (str(body.featuredAlt, 255) ?? null) : existing.featured_alt,
          body.categoryId !== undefined
            ? await validCategoryId('post', body.categoryId)
            : existing.category_id,
          bool(body.featured) ?? null,
          minutes,
          body.metaTitle !== undefined ? (str(body.metaTitle, 255) ?? null) : existing.meta_title,
          body.metaDescription !== undefined
            ? (str(body.metaDescription, 500) ?? null)
            : existing.meta_description,
          body.ogImage !== undefined ? (str(body.ogImage, 512) ?? null) : existing.og_image,
          bool(body.noindex) ?? null,
          existing.id,
        ],
      )

      if (Array.isArray(body.tagIds)) {
        await setTags('post', existing.id, body.tagIds.filter((t): t is string => typeof t === 'string'))
      }

      if (nextSlug && nextSlug !== existing.slug && existing.status === 'published') {
        await recordRedirect(`/blog/${existing.slug}`, `/blog/${nextSlug}`)
      }

      const post = await getPostById(existing.id)
      const fresh = await getSections('post', existing.id, { includeHidden: true })
      await attachCollectionData(fresh, { published: false, excludeId: existing.id })
      res.json({ post: post ? { ...post, sections: fresh } : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/status', (req, res, next) => {
  void (async () => {
    try {
      const { status } = (req.body ?? {}) as Record<string, unknown>
      if (status !== 'published' && status !== 'draft') {
        res.status(400).json({ error: 'Status must be published or draft' })
        return
      }

      const existing = await queryOne<PostRow>(`SELECT * FROM posts WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such post' })
        return
      }

      // `published_at` is set once, the first time the post goes live, and kept
      // afterwards — including through an unpublish, so returning to draft and
      // publishing again does not rewrite the original date. COALESCE rather
      // than a CASE on `status`: see the note on SqlParam in server/db.ts.
      await execute(
        `UPDATE posts
            SET status = ?,
                published_at = COALESCE(published_at, ?),
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [status, status === 'published' ? nowSeconds() : null, existing.id],
      )

      res.json({
        ok: true,
        status,
        path: `/blog/${existing.slug}`,
        wasPublished: existing.status === 'published',
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/duplicate', (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      const source = await queryOne<PostRow>(`SELECT * FROM posts WHERE id = ?`, [req.params.id])
      if (!source) {
        res.status(404).json({ error: 'No such post' })
        return
      }

      const id = randomUUID()
      const title = `${source.title} (copy)`
      await execute(
        `INSERT INTO posts (id, slug, title, subtitle, excerpt, featured_image, featured_alt,
                            status, author_id, category_id, template, reading_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
        [
          id,
          await uniqueSlug('posts', title),
          title.slice(0, 255),
          source.subtitle,
          source.excerpt,
          source.featured_image,
          source.featured_alt,
          me.id,
          source.category_id,
          source.template,
          source.reading_minutes,
        ],
      )
      await copySections('post', source.id, id)

      res.status(201).json({ post: await getPostById(id) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', (req, res, next) => {
  void (async () => {
    try {
      const existing = await queryOne<PostRow>(`SELECT id FROM posts WHERE id = ?`, [req.params.id])
      if (!existing) {
        res.status(404).json({ error: 'No such post' })
        return
      }
      await deleteSections('post', existing.id)
      await clearTags('post', existing.id)
      await execute(`DELETE FROM posts WHERE id = ?`, [existing.id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
