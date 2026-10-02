import { query, queryOne } from '../db.js'
import { toTerm } from './taxonomy.js'
import { hydrateFields } from '../../shared/widgets.js'
import {
  GUIDE_FIELDS,
  SESSION_FIELDS,
  cleanPackages,
  fromPrice,
  publicTiers,
} from '../../shared/settings.js'
import type {
  Album,
  AlbumRow,
  AlbumSummary,
  Guide,
  GuideRow,
  GuideSummary,
  MediaRow,
  PhotoMeta,
  PublicSession,
  SessionType,
  SessionTypeRow,
  Term,
  TermRow,
} from '../../shared/types.js'

/**
 * Session types, albums and guides — reading them out, and shaping them for the
 * public site.
 *
 * As with posts, **published-ness is decided by the caller**: public routes ask
 * for published rows, the dashboard asks for everything. No request parameter
 * reaches the `status` filter.
 */

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    // One unreadable blob renders as empty rather than failing the page it is on.
    return fallback
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

/* ------------------------------------------------------------------ *
 * Session types
 * ------------------------------------------------------------------ */

export function toSessionType(row: SessionTypeRow): SessionType {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    position: row.position,
    portfolioCategoryId: row.portfolio_category_id,
    guideId: row.guide_id,
    privatePricing: row.private_pricing === 1,
    details: hydrateFields(SESSION_FIELDS, parseJson(row.details, {})),
    packages: cleanPackages(parseJson(row.packages, {})),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ogImage: row.og_image,
    noindex: row.noindex === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

export async function listSessionTypes(published: boolean): Promise<SessionType[]> {
  const rows = await query<SessionTypeRow>(
    `SELECT * FROM session_types ${published ? "WHERE status = 'published'" : ''}
      ORDER BY position ASC, created_at ASC`,
  )
  return rows.map(toSessionType)
}

export async function getSessionType(where: { id?: string; slug?: string }, published: boolean) {
  const row = await queryOne<SessionTypeRow>(
    `SELECT * FROM session_types WHERE ${where.id ? 'id' : 'slug'} = ?${published ? " AND status = 'published'" : ''} LIMIT 1`,
    [where.id ?? where.slug ?? ''],
  )
  return row ? toSessionType(row) : null
}

/**
 * A session as the public site receives it.
 *
 * Prices are worked out here, from the rate card, and withheld here when the
 * session is private and the reader has not arrived with the key — so a
 * private figure is never in the response at all.
 */
export function toPublicSession(
  session: SessionType,
  ctx: {
    pricing: Record<string, unknown>
    unlocked: boolean
    categories: Map<string, Term>
    guides: Map<string, { slug: string; published: boolean }>
  },
): PublicSession {
  const d = session.details
  const pricesShown = !session.privatePricing || ctx.unlocked
  const tiers = publicTiers(session.packages, ctx.pricing, pricesShown)
  const guide = session.guideId ? ctx.guides.get(session.guideId) : undefined

  return {
    id: session.id,
    slug: session.slug,
    title: session.title,
    index: str(d.index),
    blurb: str(d.blurb),
    runs: str(d.runs),
    photo: str(d.photo),
    heroPhoto: str(d.hero_photo) || str(d.photo),
    gallery: strs(d.gallery),
    detail: str(d.detail),
    points: strs(d.points),
    editingStyle: d.editing_style === 'retouched' ? 'retouched' : 'natural',
    category: session.portfolioCategoryId
      ? (ctx.categories.get(session.portfolioCategoryId)?.slug ?? null)
      : null,
    guideSlug: guide?.published ? guide.slug : null,
    privatePricing: session.privatePricing,
    pricesShown,
    intro: session.packages.intro,
    note: session.packages.note,
    tiers,
    fromPrice: fromPrice(tiers, pricesShown, ctx.pricing),
    metaDescription: session.metaDescription,
  }
}

/* ------------------------------------------------------------------ *
 * Albums
 * ------------------------------------------------------------------ */

interface AlbumJoin extends AlbumRow {
  cat_slug: string | null
  cat_name: string | null
  cat_swatch: string | null
  cat_position: number | null
}

const ALBUM_SELECT = `
  SELECT a.*, t.slug AS cat_slug, t.name AS cat_name, t.swatch AS cat_swatch, t.position AS cat_position
    FROM albums a
    LEFT JOIN terms t ON t.id = a.category_id`

function toAlbum(row: AlbumJoin): Album {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    category:
      row.category_id && row.cat_slug && row.cat_name
        ? toTerm({
            id: row.category_id,
            kind: 'category',
            applies_to: 'portfolio',
            slug: row.cat_slug,
            name: row.cat_name,
            description: null,
            swatch: row.cat_swatch ?? 'accent',
            position: row.cat_position ?? 0,
            created_at: 0,
          })
        : null,
    featured: row.featured === 1,
    shootDate: row.shoot_date,
    dateLabel: row.date_label,
    cover: row.cover,
    story: row.story,
    location: row.location,
    conditions: row.conditions,
    requests: row.requests,
    photos: strs(parseJson(row.photos, [])),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    noindex: row.noindex === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

/** Newest shoot first; an album with no date sorts by when it was made. */
const ALBUM_ORDER = `ORDER BY COALESCE(a.shoot_date, FROM_UNIXTIME(a.created_at, '%Y-%m-%d')) DESC, a.created_at DESC`

export async function listAlbums(published: boolean): Promise<Album[]> {
  const rows = await query<AlbumJoin>(
    `${ALBUM_SELECT} ${published ? "WHERE a.status = 'published'" : ''} ${ALBUM_ORDER}`,
  )
  return rows.map(toAlbum)
}

export async function getAlbum(where: { id?: string; slug?: string }, published: boolean) {
  const row = await queryOne<AlbumJoin>(
    `${ALBUM_SELECT} WHERE a.${where.id ? 'id' : 'slug'} = ?${published ? " AND a.status = 'published'" : ''} LIMIT 1`,
    [where.id ?? where.slug ?? ''],
  )
  return row ? toAlbum(row) : null
}

export function toAlbumSummary(album: Album): AlbumSummary {
  return {
    id: album.id,
    slug: album.slug,
    title: album.title,
    category: album.category?.slug ?? null,
    dateLabel: album.dateLabel ?? '',
    shootDate: album.shootDate ?? '',
    location: album.location,
    cover: album.cover || album.photos[0] || null,
    count: album.photos.length,
    featured: album.featured,
  }
}

/* ------------------------------------------------------------------ *
 * Guides
 * ------------------------------------------------------------------ */

export function toGuide(row: GuideRow): Guide {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    position: row.position,
    sessionTypeId: row.session_type_id,
    details: hydrateFields(GUIDE_FIELDS, parseJson(row.details, {})),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    noindex: row.noindex === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

export async function listGuides(published: boolean): Promise<Guide[]> {
  const rows = await query<GuideRow>(
    `SELECT * FROM guides ${published ? "WHERE status = 'published'" : ''} ORDER BY position ASC, created_at ASC`,
  )
  return rows.map(toGuide)
}

export async function getGuide(where: { id?: string; slug?: string }, published: boolean) {
  const row = await queryOne<GuideRow>(
    `SELECT * FROM guides WHERE ${where.id ? 'id' : 'slug'} = ?${published ? " AND status = 'published'" : ''} LIMIT 1`,
    [where.id ?? where.slug ?? ''],
  )
  return row ? toGuide(row) : null
}

/** How many chapters each guide has — counted from its chapter widgets. */
export async function chapterCounts(guideIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (guideIds.length === 0) return out
  const rows = await query<{ host_id: string; n: number }>(
    `SELECT host_id, COUNT(*) AS n FROM sections
      WHERE host_type = 'guide' AND widget_type = 'guide_chapter' AND hidden = 0
        AND host_id IN (${guideIds.map(() => '?').join(', ')})
      GROUP BY host_id`,
    guideIds,
  )
  for (const row of rows) out.set(row.host_id, Number(row.n))
  return out
}

export function toGuideSummary(
  guide: Guide,
  chapters: number,
  sessions: Map<string, { slug: string; published: boolean }>,
): GuideSummary {
  const session = guide.sessionTypeId ? sessions.get(guide.sessionTypeId) : undefined
  return {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    subtitle: str(guide.details.subtitle),
    photo: str(guide.details.photo),
    chapters,
    sessionSlug: session?.published ? session.slug : null,
    meta: Array.isArray(guide.details.meta)
      ? (guide.details.meta as { label?: unknown; value?: unknown }[]).map((row) => ({
          label: str(row.label),
          value: str(row.value),
        }))
      : [],
  }
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export async function portfolioCategories(): Promise<Term[]> {
  const rows = await query<TermRow>(
    `SELECT * FROM terms WHERE applies_to = 'portfolio' AND kind = 'category' ORDER BY position ASC, name ASC`,
  )
  return rows.map(toTerm)
}

/* ------------------------------------------------------------------ *
 * The photo registry
 *
 * Every image field stores a plain URL, which keeps content portable and the
 * editor simple. What the Photo component needs beyond the URL — the srcset,
 * the colour, the blur placeholder — is looked up here, for exactly the URLs a
 * response mentions, and sent alongside it.
 * ------------------------------------------------------------------ */

/** Every string in a value that looks like an image URL. */
export function collectUrls(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (/^(\/photos\/|https?:\/\/).+\.(webp|jpe?g|png|avif|gif)$/i.test(value)) into.add(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, into)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectUrls(item, into)
  }
  return into
}

export async function photoRegistry(urls: Iterable<string>): Promise<Record<string, PhotoMeta>> {
  const list = [...new Set(urls)]
  const out: Record<string, PhotoMeta> = {}
  // Chunked, because an album page can mention a few hundred photographs and a
  // single IN list that long is a needless strain on a shared database.
  for (let i = 0; i < list.length; i += 200) {
    const chunk = list.slice(i, i + 200)
    const rows = await query<MediaRow>(
      `SELECT url, prefix, widths, color, lqip, width, height, alt FROM media
        WHERE prefix IS NOT NULL AND url IN (${chunk.map(() => '?').join(', ')})`,
      chunk,
    )
    for (const row of rows) {
      if (!row.prefix) continue
      out[row.url] = {
        prefix: row.prefix,
        widths: parseJson<number[]>(row.widths, []),
        width: row.width ?? 0,
        height: row.height ?? 0,
        color: row.color ?? 'transparent',
        lqip: row.lqip ?? '',
        alt: row.alt,
      }
    }
  }
  return out
}
