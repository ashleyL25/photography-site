import { query, type SqlParam } from '../db.js'
import { tagsFor } from './taxonomy.js'
import { toTerm } from './taxonomy.js'
import { normalizeSource, type CollectionSource } from '../../shared/widgets.js'
import type { Post, PostRow, Term, TermRow } from '../../shared/types.js'

/**
 * Reading blog posts out of the database.
 *
 * Every public listing, every search, and every collection widget ends up here,
 * so filtering, ordering and pagination are written once. The alternative —
 * a bespoke query per screen — is how a site ends up with a blog index that
 * hides drafts and a homepage widget that does not.
 *
 * Which is the rule this module enforces above all others: **`status` is decided
 * by the caller's authority, never by a query parameter.** Public routes pass
 * `published: true`; the dashboard passes `false`. There is no request field
 * that can flip it.
 */

/* ------------------------------------------------------------------ *
 * Row → object
 * ------------------------------------------------------------------ */

interface PostJoin extends PostRow {
  author_name: string | null
  author_display: string | null
  author_avatar: string | null
  author_bio: string | null
  cat_id: string | null
  cat_kind: TermRow['kind'] | null
  cat_applies: TermRow['applies_to'] | null
  cat_slug: string | null
  cat_name: string | null
  cat_desc: string | null
  cat_swatch: string | null
  cat_position: number | null
}

function joinedCategory(row: {
  cat_id: string | null
  cat_kind: TermRow['kind'] | null
  cat_applies: TermRow['applies_to'] | null
  cat_slug: string | null
  cat_name: string | null
  cat_desc: string | null
  cat_swatch: string | null
  cat_position: number | null
}): Term | null {
  if (!row.cat_id || !row.cat_slug || !row.cat_name) return null
  return toTerm({
    id: row.cat_id,
    kind: row.cat_kind ?? 'category',
    applies_to: row.cat_applies ?? 'post',
    slug: row.cat_slug,
    name: row.cat_name,
    description: row.cat_desc,
    swatch: row.cat_swatch ?? 'gilt',
    position: row.cat_position ?? 0,
    created_at: 0,
  })
}

function toPost(row: PostJoin, tags: Term[]): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    featuredImage: row.featured_image,
    featuredAlt: row.featured_alt,
    status: row.status,
    template: row.template,
    featured: row.featured === 1,
    readingMinutes: row.reading_minutes,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ogImage: row.og_image,
    noindex: row.noindex === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    author: row.author_id
      ? {
          id: row.author_id,
          name: row.author_display || row.author_name || 'Ashley',
          avatarUrl: row.author_avatar,
          bio: row.author_bio,
        }
      : null,
    category: joinedCategory(row),
    tags,
  }
}

/* ------------------------------------------------------------------ *
 * Shared SELECT fragments
 * ------------------------------------------------------------------ */

const POST_SELECT = `
  SELECT p.*,
         u.name AS author_name, u.display_name AS author_display,
         u.avatar_url AS author_avatar, u.bio AS author_bio,
         t.id AS cat_id, t.kind AS cat_kind, t.applies_to AS cat_applies,
         t.slug AS cat_slug, t.name AS cat_name, t.description AS cat_desc,
         t.swatch AS cat_swatch, t.position AS cat_position
    FROM posts p
    LEFT JOIN users u ON u.id = p.author_id
    LEFT JOIN terms t ON t.id = p.category_id`

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

export interface ListOptions {
  /** Restrict to published items. Set by the route, never by the request. */
  published: boolean
  search?: string
  /** Category slugs or ids. */
  categories?: string[]
  /** Tag slugs or ids. */
  tags?: string[]
  featuredOnly?: boolean
  order?: 'newest' | 'oldest' | 'title' | 'random'
  /** Unix seconds. */
  dateFrom?: number
  dateTo?: number
  limit?: number
  offset?: number
  /** Excluded from the results — used for "related posts" on a post's own page. */
  excludeId?: string
}

function orderClause(order: ListOptions['order'], alias: string, dateColumn: string): string {
  switch (order) {
    case 'oldest':
      return `${alias}.${dateColumn} ASC, ${alias}.created_at ASC`
    case 'title':
      return `${alias}.title ASC`
    case 'random':
      return `RAND()`
    default:
      // `published_at` is null for a draft, so the dashboard's default order
      // falls back to creation time rather than bunching every draft together.
      return `COALESCE(${alias}.${dateColumn}, ${alias}.created_at) DESC`
  }
}

/**
 * Builds the WHERE fragments common to both content types.
 *
 * Categories and tags accept either a slug or an id, because a filter arriving
 * from a URL (`?category=craft`) and one arriving from a widget's saved config
 * (an id) are the same question. Matching on both costs one extra comparison and
 * removes a whole class of "the widget works but the link doesn't" bug.
 */
function buildFilters(
  alias: string,
  scope: 'post',
  opts: ListOptions,
): { where: string[]; params: SqlParam[] } {
  const where: string[] = []
  const params: SqlParam[] = []

  if (opts.published) where.push(`${alias}.status = 'published'`)

  if (opts.excludeId) {
    where.push(`${alias}.id <> ?`)
    params.push(opts.excludeId)
  }

  if (opts.featuredOnly) where.push(`${alias}.featured = 1`)

  if (opts.search?.trim()) {
    const term = `%${opts.search.trim()}%`
    where.push(`(${alias}.title LIKE ? OR ${alias}.subtitle LIKE ? OR ${alias}.excerpt LIKE ?)`)
    params.push(term, term, term)
  }

  if (opts.categories?.length) {
    const marks = opts.categories.map(() => '?').join(', ')
    where.push(
      `${alias}.category_id IN (SELECT id FROM terms WHERE applies_to = ? AND kind = 'category' AND (id IN (${marks}) OR slug IN (${marks})))`,
    )
    params.push(scope, ...opts.categories, ...opts.categories)
  }

  if (opts.tags?.length) {
    const marks = opts.tags.map(() => '?').join(', ')
    // EXISTS rather than a join: a post carrying three of the selected tags must
    // appear once, and a join would return it three times.
    where.push(
      `EXISTS (SELECT 1 FROM term_links tl JOIN terms tt ON tt.id = tl.term_id
                WHERE tl.object_id = ${alias}.id AND tl.object_type = ?
                  AND tt.applies_to = ? AND (tt.id IN (${marks}) OR tt.slug IN (${marks})))`,
    )
    params.push(scope, scope, ...opts.tags, ...opts.tags)
  }

  const dateColumn = 'published_at'
  if (opts.dateFrom) {
    where.push(`COALESCE(${alias}.${dateColumn}, ${alias}.created_at) >= ?`)
    params.push(opts.dateFrom)
  }
  if (opts.dateTo) {
    where.push(`COALESCE(${alias}.${dateColumn}, ${alias}.created_at) <= ?`)
    params.push(opts.dateTo)
  }

  return { where, params }
}

/* ------------------------------------------------------------------ *
 * Listings
 * ------------------------------------------------------------------ */

export interface ListResult<T> {
  items: T[]
  total: number
}

export async function listPosts(opts: ListOptions): Promise<ListResult<Post>> {
  const { where, params } = buildFilters('p', 'post', opts)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalRow = await query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts p ${whereSql}`,
    params,
  )

  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 100)
  const offset = Math.max(opts.offset ?? 0, 0)

  const rows = await query<PostJoin>(
    `${POST_SELECT} ${whereSql}
     ORDER BY ${orderClause(opts.order, 'p', 'published_at')}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  )

  const tags = await tagsFor('post', rows.map((r) => r.id))
  return {
    items: rows.map((r) => toPost(r, tags.get(r.id) ?? [])),
    total: Number(totalRow[0]?.n ?? 0),
  }
}

export async function getPostBySlug(slug: string, published: boolean): Promise<Post | null> {
  const rows = await query<PostJoin>(
    `${POST_SELECT} WHERE p.slug = ?${published ? " AND p.status = 'published'" : ''} LIMIT 1`,
    [slug],
  )
  if (!rows[0]) return null
  const tags = await tagsFor('post', [rows[0].id])
  return toPost(rows[0], tags.get(rows[0].id) ?? [])
}

export async function getPostById(id: string): Promise<Post | null> {
  const rows = await query<PostJoin>(`${POST_SELECT} WHERE p.id = ? LIMIT 1`, [id])
  if (!rows[0]) return null
  const tags = await tagsFor('post', [id])
  return toPost(rows[0], tags.get(id) ?? [])
}

/* ------------------------------------------------------------------ *
 * Collection widgets
 * ------------------------------------------------------------------ */

function parseDate(value: string): number | undefined {
  if (!value) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined
}

/**
 * Turns a widget's saved `source` into the actual items to render.
 *
 * Manual mode preserves the order the ids were picked in, which a SQL `IN` will
 * not: MySQL returns rows in whatever order suits it, so the list is reordered
 * in Node against the saved array. Getting this wrong looks like the editor
 * ignoring a drag, which is the most infuriating possible bug in a page builder.
 *
 * Unpublished ids simply drop out of a manual list. Publishing is a separate
 * decision from curating, and a homepage must not show a draft because somebody
 * picked it last week.
 */
export async function resolveCollection(
  rawSource: unknown,
  opts: { published: boolean; excludeId?: string } = { published: true },
): Promise<Post[]> {
  const source: CollectionSource = normalizeSource(rawSource)

  if (source.mode === 'manual') {
    if (source.items.length === 0) return []
    const list = await listPosts({ published: opts.published, limit: 100 })
    const byId = new Map(list.items.map((item) => [item.id, item]))
    return source.items
      .map((id) => byId.get(id))
      .filter((item): item is Post => Boolean(item))
      .slice(0, source.limit || 12)
  }

  const { items } = await listPosts({
    published: opts.published,
    excludeId: opts.excludeId,
    categories: source.categories,
    tags: source.tags,
    featuredOnly: source.featuredOnly,
    order: source.order,
    dateFrom: parseDate(source.dateFrom),
    dateTo: parseDate(source.dateTo),
    limit: source.limit || 3,
  })
  return items
}
