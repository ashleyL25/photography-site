import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { execute, query, queryOne } from '../db.js'
import { getSettings } from '../lib/settings.js'
import { getSections } from '../lib/content.js'
import { attachCollectionData } from '../lib/render.js'
import { getPostBySlug, listPosts, type ListOptions } from '../lib/collections.js'
import { listTermsWithCounts } from '../lib/taxonomy.js'
import {
  chapterCounts,
  collectUrls,
  getAlbum,
  getGuide,
  getSessionType,
  listAlbums,
  listGuides,
  listSessionTypes,
  photoRegistry,
  portfolioCategories,
  toAlbumSummary,
  toGuideSummary,
  toPublicSession,
} from '../lib/catalog.js'
import { isPublicPostBlocked, recordPublicPost } from '../rate-limit.js'
import { sendMail, mailConfigured } from '../lib/mail.js'
import type { PageRow, SearchHit, Section } from '../../shared/types.js'

/**
 * Everything the public site reads.
 *
 * No authentication anywhere in this file, and correspondingly every query that
 * can see content asks for published rows — set here, in code, never from a
 * request parameter. There is no combination of query string values that
 * reaches a draft.
 */
const router = Router()

const CACHE_PUBLIC = 'public, max-age=60, stale-while-revalidate=300'

/** True when the request carries the current private-pricing key. */
async function isUnlocked(req: Request): Promise<boolean> {
  const given = (req.query as Record<string, unknown>).pricing
  if (typeof given !== 'string' || !given) return false
  const pricing = await getSettings('pricing')
  const key = ((pricing.private ?? {}) as Record<string, unknown>).key
  return typeof key === 'string' && key.length > 0 && given === key
}

/* ------------------------------------------------------------------ *
 * Boot payload
 * ------------------------------------------------------------------ */

/**
 * Everything the shell and the widgets need, in one request: settings, the
 * published sessions with their prices worked out, album and guide summaries,
 * the portfolio categories, and the photo registry for every image those
 * mention.
 *
 * One request rather than one per widget is what lets every section render the
 * moment the page arrives — the sessions list on the homepage, the tabs in the
 * pricing block and the filter bar on the portfolio all read from here.
 *
 * Shared with the dashboard, which builds the same payload with drafts
 * included so its previews show what is being edited.
 */
export async function buildSitePayload(opts: { published: boolean; unlocked: boolean }) {
  const [site, pricing, policy, library, inquiry, sessionsRaw, albumsRaw, guidesRaw, categories, postTerms, portfolioTerms] =
    await Promise.all([
      getSettings('site'),
      getSettings('pricing'),
      getSettings('policy'),
      getSettings('library'),
      getSettings('inquiry'),
      listSessionTypes(opts.published),
      listAlbums(opts.published),
      listGuides(opts.published),
      portfolioCategories(),
      listTermsWithCounts('post'),
      listTermsWithCounts('portfolio'),
    ])

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const guideRefs = new Map(guidesRaw.map((g) => [g.id, { slug: g.slug, published: g.status === 'published' || !opts.published }]))
  const sessionRefs = new Map(
    sessionsRaw.map((s) => [s.id, { slug: s.slug, published: s.status === 'published' || !opts.published }]),
  )

  const sessions = sessionsRaw.map((s) =>
    toPublicSession(s, { pricing, unlocked: opts.unlocked, categories: categoryById, guides: guideRefs }),
  )
  const counts = await chapterCounts(guidesRaw.map((g) => g.id))
  const guides = guidesRaw.map((g) => toGuideSummary(g, counts.get(g.id) ?? 0, sessionRefs))
  const albums = albumsRaw.map(toAlbumSummary)

  // The rate card is what a private session's figures are computed from, so it
  // leaves the server only with the key — otherwise "By request" could be undone
  // with a calculator.
  const publicPricing = opts.unlocked ? pricing : { ...pricing, rate_card: {} }

  const theme = await getSettings('theme')
  const settings = { site, theme, pricing: publicPricing, policy, library, inquiry }
  const photos = await photoRegistry(collectUrls([sessions, guides, albums, site, library]))

  return {
    settings,
    sessions,
    albums,
    guides,
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    postTerms,
    terms: { post: postTerms, portfolio: portfolioTerms },
    unlocked: opts.unlocked,
    photos,
  }
}

router.get('/site', (req, res, next) => {
  void (async () => {
    try {
      const unlocked = await isUnlocked(req)
      const payload = await buildSitePayload({ published: true, unlocked })
      // An unlocked response carries private figures, so nothing in between may
      // keep it and hand it to the next visitor.
      res.set('Cache-Control', unlocked ? 'private, no-store' : CACHE_PUBLIC).json(payload)
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

async function sectionsPayload(sections: Section[]) {
  return { sections, photos: await photoRegistry(collectUrls(sections.map((s) => s.content))) }
}

async function respondWithPage(row: PageRow | null, res: Response) {
  if (!row) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const sections = await getSections('page', row.id)
  await attachCollectionData(sections, { published: true })
  const { photos } = await sectionsPayload(sections)

  res.set('Cache-Control', CACHE_PUBLIC).json({
    page: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      pageKey: row.page_key,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      ogImage: row.og_image,
      noindex: row.noindex === 1,
      updatedAt: row.updated_at,
      sections,
    },
    photos,
  })
}

router.get('/page-by-key/:key', (req, res, next) => {
  void (async () => {
    try {
      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE page_key = ? AND status = 'published'`, [
        req.params.key,
      ])
      await respondWithPage(row, res)
    } catch (err) {
      next(err as Error)
    }
  })()
})

async function redirectFor(path: string): Promise<string | null> {
  const row = await queryOne<{ to_path: string }>(`SELECT to_path FROM redirects WHERE from_path = ?`, [path])
  return row?.to_path ?? null
}

router.get('/page/:slug', (req, res, next) => {
  void (async () => {
    try {
      const row = await queryOne<PageRow>(`SELECT * FROM pages WHERE slug = ? AND status = 'published'`, [
        req.params.slug,
      ])
      if (!row) {
        // A renamed page keeps working: the client turns this into a redirect
        // rather than a 404, so a link somebody was sent last month still arrives.
        const to = await redirectFor(`/${req.params.slug}`)
        if (to) {
          res.status(301).json({ redirect: to })
          return
        }
      }
      await respondWithPage(row, res)
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Sessions, albums, guides
 *
 * Each returns its own page body. The session's facts and prices are already
 * in the site payload, so they are not repeated here.
 * ------------------------------------------------------------------ */

router.get('/sessions/:slug', (req, res, next) => {
  void (async () => {
    try {
      const session = await getSessionType({ slug: req.params.slug }, true)
      if (!session) {
        const to = await redirectFor(`/sessions/${req.params.slug}`)
        res.status(to ? 301 : 404).json(to ? { redirect: to } : { error: 'Not found' })
        return
      }
      const sections = await getSections('session', session.id)
      await attachCollectionData(sections, { published: true })
      res.set('Cache-Control', CACHE_PUBLIC).json({
        session: {
          id: session.id,
          slug: session.slug,
          title: session.title,
          metaTitle: session.metaTitle,
          metaDescription: session.metaDescription,
          ogImage: session.ogImage,
          noindex: session.noindex,
        },
        ...(await sectionsPayload(sections)),
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/albums/:slug', (req, res, next) => {
  void (async () => {
    try {
      const album = await getAlbum({ slug: req.params.slug }, true)
      if (!album) {
        const to = await redirectFor(`/portfolio/${req.params.slug}`)
        res.status(to ? 301 : 404).json(to ? { redirect: to } : { error: 'Not found' })
        return
      }
      const sections = await getSections('album', album.id)
      await attachCollectionData(sections, { published: true })
      const photos = await photoRegistry(collectUrls([album.photos, album.cover, sections.map((s) => s.content)]))
      res.set('Cache-Control', CACHE_PUBLIC).json({ album: { ...album, sections }, photos })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/guides/:slug', (req, res, next) => {
  void (async () => {
    try {
      const guide = await getGuide({ slug: req.params.slug }, true)
      if (!guide) {
        const to = await redirectFor(`/guides/${req.params.slug}`)
        res.status(to ? 301 : 404).json(to ? { redirect: to } : { error: 'Not found' })
        return
      }
      const sections = await getSections('guide', guide.id)
      const photos = await photoRegistry(collectUrls([guide.details, sections.map((s) => s.content)]))
      res.set('Cache-Control', CACHE_PUBLIC).json({ guide: { ...guide, sections }, photos })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Blog
 * ------------------------------------------------------------------ */

function filtersFromQuery(req: Request): Partial<ListOptions> {
  const many = (value: unknown): string[] | undefined => {
    if (typeof value === 'string' && value) return value.split(',').filter(Boolean)
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
    return undefined
  }
  const q = req.query as Record<string, unknown>
  return {
    search: typeof q.q === 'string' ? q.q.slice(0, 120) : undefined,
    categories: many(q.category),
    tags: many(q.tag),
    order: typeof q.order === 'string' ? (q.order as ListOptions['order']) : undefined,
    limit: Math.min(Number(q.limit) || 12, 48),
    offset: Math.max(Number(q.offset) || 0, 0),
  }
}

router.get('/posts', (req, res, next) => {
  void (async () => {
    try {
      const result = await listPosts({ published: true, ...filtersFromQuery(req) })
      const photos = await photoRegistry(collectUrls(result.items.map((p) => p.featuredImage)))
      res.set('Cache-Control', CACHE_PUBLIC).json({ ...result, photos })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/posts/:slug', (req, res, next) => {
  void (async () => {
    try {
      const post = await getPostBySlug(req.params.slug, true)
      if (!post) {
        const to = await redirectFor(`/blog/${req.params.slug}`)
        res.status(to ? 301 : 404).json(to ? { redirect: to } : { error: 'Not found' })
        return
      }

      const sections = await getSections('post', post.id)
      await attachCollectionData(sections, { published: true, excludeId: post.id })

      // Related posts, by category and falling back to recency, so the strip at
      // the foot of a post arrives with the post rather than a beat after it.
      const related = await listPosts({
        published: true,
        categories: post.category ? [post.category.id] : undefined,
        excludeId: post.id,
        order: 'newest',
        limit: 3,
      })
      const filler =
        related.items.length >= 3
          ? { items: [] }
          : await listPosts({ published: true, excludeId: post.id, order: 'newest', limit: 6 })
      const seen = new Set(related.items.map((p) => p.id))
      const combined = [...related.items, ...filler.items.filter((p) => !seen.has(p.id))].slice(0, 3)

      const photos = await photoRegistry(
        collectUrls([post.featuredImage, sections.map((s) => s.content), combined.map((p) => p.featuredImage)]),
      )
      res.set('Cache-Control', CACHE_PUBLIC).json({ post: { ...post, sections }, related: combined, photos })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

router.get('/search', (req, res, next) => {
  void (async () => {
    try {
      const term = String((req.query as Record<string, unknown>).q ?? '').trim()
      if (term.length < 2) {
        res.json({ hits: [] })
        return
      }
      const like = `%${term}%`
      const limit = 6

      const [sessions, albums, guides, posts] = await Promise.all([
        query<{ id: string; title: string; slug: string; details: string }>(
          `SELECT id, title, slug, details FROM session_types
            WHERE status = 'published' AND (title LIKE ? OR details LIKE ?) ORDER BY position LIMIT ${limit}`,
          [like, like],
        ),
        query<{ id: string; title: string; slug: string; story: string | null; cover: string | null; date_label: string | null }>(
          `SELECT id, title, slug, story, cover, date_label FROM albums
            WHERE status = 'published' AND (title LIKE ? OR story LIKE ? OR location LIKE ?)
            ORDER BY shoot_date DESC LIMIT ${limit}`,
          [like, like, like],
        ),
        query<{ id: string; title: string; slug: string }>(
          `SELECT id, title, slug FROM guides WHERE status = 'published' AND title LIKE ? ORDER BY position LIMIT ${limit}`,
          [like],
        ),
        query<{ id: string; title: string; slug: string; excerpt: string | null; featured_image: string | null }>(
          `SELECT id, title, slug, excerpt, featured_image FROM posts
            WHERE status = 'published' AND (title LIKE ? OR subtitle LIKE ? OR excerpt LIKE ?)
            ORDER BY published_at DESC LIMIT ${limit}`,
          [like, like, like],
        ),
      ])

      const hits: SearchHit[] = [
        ...sessions.map<SearchHit>((s) => ({
          kind: 'session',
          id: s.id,
          title: s.title,
          slug: s.slug,
          href: `/sessions/${s.slug}`,
          excerpt: null,
          image: null,
          meta: 'Session',
        })),
        ...albums.map<SearchHit>((a) => ({
          kind: 'album',
          id: a.id,
          title: a.title,
          slug: a.slug,
          href: `/portfolio/${a.slug}`,
          excerpt: a.story,
          image: a.cover,
          meta: a.date_label,
        })),
        ...guides.map<SearchHit>((g) => ({
          kind: 'guide',
          id: g.id,
          title: g.title,
          slug: g.slug,
          href: `/guides/${g.slug}`,
          excerpt: null,
          image: null,
          meta: 'Guide',
        })),
        ...posts.map<SearchHit>((p) => ({
          kind: 'post',
          id: p.id,
          title: p.title,
          slug: p.slug,
          href: `/blog/${p.slug}`,
          excerpt: p.excerpt,
          image: p.featured_image,
          meta: 'Journal',
        })),
      ]

      res.json({ hits })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * The inquiry form
 * ------------------------------------------------------------------ */

router.post('/inquiry', (req, res, next) => {
  void (async () => {
    try {
      const ip = req.ip ?? 'unknown'
      const body = (req.body ?? {}) as Record<string, unknown>
      const field = (key: string, max: number) =>
        typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : ''

      // Honeypot — a filled hidden field means a bot. Answer 200 so it does not retry.
      if (field('website', 200)) {
        res.json({ ok: true })
        return
      }

      const name = field('name', 160)
      const email = field('email', 255)
      const message = field('message', 8000)
      if (!name || !email || !message) {
        res.status(400).json({ error: 'Please fill in your name, email and a little about what you have in mind.' })
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'That email address does not look right.' })
        return
      }

      if (await isPublicPostBlocked(ip, 'inquiry', 5)) {
        res.status(429).json({ error: 'That is a lot of messages. Try again in a little while.' })
        return
      }
      await recordPublicPost(ip, 'inquiry')

      const row = {
        phone: field('phone', 60),
        session: field('session', 160),
        tier: field('tier', 200),
        timeframe: field('timeframe', 160),
        location: field('location', 300),
        heardFrom: field('heardFrom', 160),
      }

      // Recorded first, emailed second. Mail is the part that can fail silently,
      // and an inquiry that only ever existed as an email is one that can be lost.
      const id = randomUUID()
      await execute(
        `INSERT INTO inquiries (id, name, email, phone, session, tier, timeframe, location, heard_from, message, source_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          email.toLowerCase(),
          row.phone || null,
          row.session || null,
          row.tier || null,
          row.timeframe || null,
          row.location || null,
          row.heardFrom || null,
          message,
          field('sourcePath', 255) || null,
        ],
      )

      if (mailConfigured) {
        // Only the fields somebody actually filled in get a line.
        const lines = [
          ['Session', row.session],
          ['Tier', row.tier],
          ['When', row.timeframe],
          ['Where', row.location],
          ['Phone', row.phone],
          ['Found you through', row.heardFrom],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)

        const result = await sendMail({
          subject: `New inquiry — ${name}${row.session ? ` · ${row.session}` : ''}`,
          replyTo: email,
          text: `${name} <${email}>\n${lines.join('\n')}\n\n${message}\n`,
        })
        if (result.sent) await execute(`UPDATE inquiries SET emailed = 1 WHERE id = ?`, [id])
        else console.error('inquiry: stored but not emailed —', result.error)
      }

      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
