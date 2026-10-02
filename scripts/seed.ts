#!/usr/bin/env tsx
/**
 * Fills an empty database with the site exactly as it was before the dashboard.
 *
 *   npm run db:seed
 *
 * Nothing here is retyped. It imports the data files the hand-built site was
 * rendered from — kept in scripts/seed-data — and converts them: every session
 * and its tiers, every guide chapter and block, every shoot, every paragraph of
 * page copy, the vendor lists, the policies. The two albums the site used to
 * fetch from pic.ashleyphotographyia.com at runtime are imported too, so the
 * portfolio is complete without that connection.
 *
 * **Idempotent.** Every insert is keyed on a slug, URL or key and skipped when it
 * exists, so running it twice adds nothing and overwrites nothing.
 */

import { randomUUID } from 'node:crypto'
import mysql from 'mysql2/promise'
import { loadEnv } from '../shared/load-env.js'
import { hashPassword } from '../shared/password.js'
import { widgetDefaults } from '../shared/widgets.js'
import { settingsDefaults } from '../shared/settings.js'
import type { PackageSet, Tier, TierPrice } from '../shared/types.js'

import { PHOTOS } from './seed-data/photos.generated.ts'
import {
  ABOUT,
  ABOUT_PAGE,
  BLACK_AND_WHITE,
  CONTACT_PAGE,
  CTA,
  EXPERIENCE_PAGE,
  FAQ,
  FEATURED,
  GALLERY,
  HERO,
  INQUIRY,
  INTRO,
  MARQUEE,
  PORTFOLIO,
  PORTFOLIO_FILTERS,
  PROCESS,
  SESSIONS,
  SESSIONS_PAGE,
  SITE,
} from './seed-data/site.ts'
import {
  ADD_ONS,
  ALBUM,
  ALWAYS_INCLUDED,
  BOOKING,
  PACKAGE_SETS,
  PRICING_BY_REQUEST,
  PRICING_KEY,
  PRIVATE_PRICING,
  RATE_CARD,
} from './seed-data/packages.ts'
import { EDITING_STYLE, RESCHEDULE_NOTE, RETOUCHING, weatherColumns } from './seed-data/policy.ts'
import { HAIR_AND_MAKEUP, LOCATIONS, LUNCH_STOPS } from './seed-data/vendors.ts'
import { GUIDES, GUIDES_INDEX, type Block, type Chapter } from './seed-data/guides.ts'
import { SHOOTS, photosFor } from './seed-data/shoots.ts'

loadEnv()

const db = await mysql.createConnection({
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST ?? '127.0.0.1'),
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
})

const now = () => Math.floor(Date.now() / 1000)

async function one<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const [rows] = await db.query(sql, params)
  return ((rows as T[])[0] ?? null) as T | null
}

/** Plain paragraphs → the HTML a rich-text field stores. */
function html(paragraphs: string[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')
}

/* ------------------------------------------------------------------ *
 * Photographs
 * ------------------------------------------------------------------ */

console.log('\nSeeding Ashley Photography\n\nPhotographs')

/** Manifest id → the URL every image field will store. */
const PHOTO_URL = new Map<string, string>()

function mainWidth(widths: number[]) {
  return widths.includes(1440) ? 1440 : widths[widths.length - 1]
}

async function seedMedia(entry: {
  url: string
  prefix: string
  widths: number[]
  width: number
  height: number
  color: string
  lqip: string
  filename: string
  folder: string
}) {
  const existing = await one<{ id: string }>('SELECT id FROM media WHERE url = ?', [entry.url])
  if (existing) return
  await db.query(
    `INSERT INTO media (id, r2_key, url, prefix, widths, color, lqip, filename, mime, bytes, width, height, folder)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'image/webp', 0, ?, ?, ?)`,
    [
      randomUUID(),
      entry.url,
      entry.prefix,
      JSON.stringify(entry.widths),
      entry.color,
      entry.lqip,
      entry.filename,
      Math.min(entry.width, 65535),
      Math.min(entry.height, 65535),
      entry.folder,
    ],
  )
}

for (const photo of PHOTOS) {
  const url = `${photo.src}-${mainWidth(photo.widths)}.webp`
  PHOTO_URL.set(photo.id, url)
  await seedMedia({
    url,
    prefix: photo.src,
    widths: photo.widths,
    width: photo.width,
    height: photo.height,
    color: photo.color,
    lqip: photo.lqip,
    filename: photo.id,
    folder: photo.category,
  })
}
console.log(`  ✓ ${PHOTOS.length} photographs that ship with the site`)

/** A manifest id as a URL; an id that is not in the manifest is dropped rather than guessed. */
const url = (id: string | undefined) => (id ? (PHOTO_URL.get(id) ?? '') : '')
/** The first id that exists — how the About page chose its portraits. */
const firstUrl = (ids: string[]) => ids.map((id) => PHOTO_URL.get(id)).find(Boolean) ?? ''

/* ------------------------------------------------------------------ *
 * The albums that used to arrive from the gallery dashboard
 * ------------------------------------------------------------------ */

interface RemoteAlbum {
  slug: string
  title: string
  category: string
  date: number | null
  story: string | null
  location: string | null
  conditions: string | null
  requests: string | null
  photos: { id: string; src: string; widths: number[]; width: number; height: number; color: string; lqip: string }[]
}

let remote: { albums: RemoteAlbum[]; categories: { value: string; label: string }[] } = { albums: [], categories: [] }
try {
  const res = await fetch('https://pic.ashleyphotographyia.com/api/portfolio')
  if (res.ok) remote = (await res.json()) as typeof remote
} catch {
  console.log('  · could not reach the gallery dashboard — its albums are skipped')
}

for (const album of remote.albums) {
  for (const p of album.photos) {
    await seedMedia({
      url: `${p.src}-${mainWidth(p.widths)}.webp`,
      prefix: p.src,
      widths: p.widths,
      width: p.width,
      height: p.height,
      color: p.color,
      lqip: p.lqip,
      filename: `${album.slug}-${p.id.slice(0, 8)}`,
      folder: album.category,
    })
  }
}
if (remote.albums.length) {
  console.log(`  ✓ ${remote.albums.reduce((n, a) => n + a.photos.length, 0)} photographs from ${remote.albums.length} published albums`)
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

console.log('\nSettings')

async function seedSetting(key: string, value: Record<string, unknown>) {
  const existing = await one<{ key: string }>('SELECT `key` FROM settings WHERE `key` = ?', [key])
  if (existing) {
    console.log(`  · ${key} already set`)
    return
  }
  await db.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [key, JSON.stringify(value)])
  console.log(`  ✓ ${key}`)
}

await seedSetting('site', {
  ...settingsDefaults('site'),
  identity: {
    name: SITE.name,
    tagline: SITE.tagline,
    base: SITE.base,
    serves: SITE.serves,
    since: String(SITE.since),
    reply: 'Within 48 hours',
  },
  contact: { email: SITE.email, instagram: SITE.instagram, instagram_handle: SITE.instagramHandle },
})

// The "why the count varies" copy is written per editing level inside every
// guide's gallery chapter — taken from the first guide of each kind.
function whyFor(style: 'retouched' | 'natural'): string {
  for (const guide of GUIDES) {
    if ((EDITING_STYLE[guide.id] ?? 'natural') !== style) continue
    const chapter = guide.chapters.find((c) => c.id === 'your-gallery')
    const columns = chapter?.blocks.find((b) => b.kind === 'columns')
    if (columns && columns.kind === 'columns' && columns.items[1]) return columns.items[1].body
  }
  return ''
}

await seedSetting('pricing', {
  rate_card: { ...RATE_CARD, four: 895, album: ALBUM },
  private: {
    key: PRICING_KEY,
    price_label: PRICING_BY_REQUEST.price,
    from_label: 'Pricing by request',
    note: PRICING_BY_REQUEST.note,
  },
  always_included: ALWAYS_INCLUDED,
  black_and_white: BLACK_AND_WHITE,
  add_ons: ADD_ONS.map((a) => ({ label: a.label, price: a.price, detail: a.detail ?? '' })),
  booking: {
    eyebrow: BOOKING.eyebrow,
    heading: BOOKING.heading,
    steps: BOOKING.steps.map((s) => ({ title: s.title, body: s.body })),
  },
})

await seedSetting('policy', {
  retouched: { ...RETOUCHING.retouched, why: whyFor('retouched') },
  natural: { ...RETOUCHING.natural, why: whyFor('natural') },
  // Written with the placeholder so each widget can name its own word.
  weather: weatherColumns('{session}'),
  reschedule: RESCHEDULE_NOTE,
})

const vendor = (v: { name: string; area: string; address?: string; does: string; note?: string; url?: string }) => ({
  name: v.name,
  area: v.area,
  address: v.address ?? '',
  does: v.does,
  note: v.note ?? '',
  url: v.url ?? '',
})
await seedSetting('library', {
  hair_and_makeup: HAIR_AND_MAKEUP.map(vendor),
  lunch_stops: LUNCH_STOPS.map(vendor),
  locations: LOCATIONS,
})

await seedSetting('inquiry', {
  ...settingsDefaults('inquiry'),
  extra_sessions: INQUIRY.sessions.slice(SESSIONS.length),
  undecided: INQUIRY.undecided,
  timeframes: INQUIRY.timeframes,
  heard_from: INQUIRY.heardFrom,
})

/* ------------------------------------------------------------------ *
 * Owner
 * ------------------------------------------------------------------ */

console.log('\nAccount')
const ownerEmail = process.env.OWNER_EMAIL || 'almcdowell.home@gmail.com'
const ownerPassword = process.env.OWNER_PASSWORD
if (!ownerPassword) {
  console.error('\nSet OWNER_PASSWORD in .env before seeding.\n')
  process.exit(1)
}
const owner = await one<{ id: string }>('SELECT id FROM users WHERE email = ?', [ownerEmail])
let ownerId = owner?.id
if (!owner) {
  ownerId = randomUUID()
  await db.query(
    `INSERT INTO users (id, email, password_hash, name, display_name, role) VALUES (?, ?, ?, 'Ashley McDowell', 'Ashley', 'owner')`,
    [ownerId, ownerEmail, await hashPassword(ownerPassword)],
  )
  console.log(`  ✓ ${ownerEmail} (owner)`)
} else {
  console.log(`  · ${ownerEmail} already exists`)
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

console.log('\nCategories')

const CATEGORY_ID = new Map<string, string>()
const SWATCH_CYCLE = ['accent', 'forest', 'sage', 'champagne', 'charcoal']

async function seedTerm(scope: 'post' | 'portfolio', slug: string, name: string, position: number) {
  const existing = await one<{ id: string }>(
    `SELECT id FROM terms WHERE kind = 'category' AND applies_to = ? AND slug = ?`,
    [scope, slug],
  )
  if (existing) return existing.id
  const id = randomUUID()
  await db.query(
    `INSERT INTO terms (id, kind, applies_to, slug, name, swatch, position) VALUES (?, 'category', ?, ?, ?, ?, ?)`,
    [id, scope, slug, name, SWATCH_CYCLE[position % SWATCH_CYCLE.length], position],
  )
  return id
}

let position = 0
for (const filter of PORTFOLIO_FILTERS) {
  if (filter.id === 'all') continue
  CATEGORY_ID.set(filter.id, await seedTerm('portfolio', filter.id, filter.label, position++))
}
for (const c of remote.categories) {
  if (!CATEGORY_ID.has(c.value)) CATEGORY_ID.set(c.value, await seedTerm('portfolio', c.value, c.label, position++))
}
console.log(`  ✓ ${CATEGORY_ID.size} portfolio categories`)

let postPosition = 0
for (const [slug, name] of [
  ['sessions', 'Sessions'],
  ['planning', 'Planning'],
  ['locations', 'Locations'],
] as const) {
  await seedTerm('post', slug, name, postPosition++)
}
console.log('  ✓ 3 journal categories')

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

type Host = 'page' | 'session' | 'album' | 'guide'

interface SeedSection {
  type: string
  content?: Record<string, unknown>
  styles?: Record<string, unknown>
}

async function seedSections(host: Host, hostId: string, sections: SeedSection[]) {
  const [existing] = await db.query('SELECT id FROM sections WHERE host_type = ? AND host_id = ?', [host, hostId])
  if ((existing as unknown[]).length > 0) return
  let i = 0
  for (const section of sections) {
    const base = widgetDefaults(section.type)
    await db.query(
      `INSERT INTO sections (id, host_type, host_id, widget_type, position, hidden, content, styles)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        randomUUID(),
        host,
        hostId,
        section.type,
        i++,
        JSON.stringify({ ...base.content, ...(section.content ?? {}) }),
        JSON.stringify({ ...base.styles, ...(section.styles ?? {}) }),
      ],
    )
  }
}

/* ------------------------------------------------------------------ *
 * Guides
 * ------------------------------------------------------------------ */

console.log('\nGuides')

const GUIDE_ID = new Map<string, string>()

/** One guide block → the widget that draws it. */
function blockSections(chapter: Chapter, guideId: string): SeedSection[] {
  const out: SeedSection[] = []
  const blocks = chapter.blocks
  for (let i = 0; i < blocks.length; i++) {
    const block: Block = blocks[i]
    switch (block.kind) {
      case 'prose':
        // The weather chapter's reschedule rule comes from the policy settings.
        if (chapter.id === 'weather' && block.text.length === 1 && block.text[0] === RESCHEDULE_NOTE) break
        out.push({ type: 'guide_prose', content: { body: html(block.text) } })
        break
      case 'timeline':
        out.push({ type: 'guide_timeline', content: { items: block.items } })
        break
      case 'steps':
        out.push({ type: 'guide_steps', content: { items: block.items } })
        break
      case 'checklist':
        out.push({ type: 'guide_checklist', content: { items: block.items } })
        break
      case 'compare':
        out.push({
          type: 'guide_compare',
          content: { yes_title: block.yes.title, yes_items: block.yes.items, no_title: block.no.title, no_items: block.no.items },
        })
        break
      case 'note':
        out.push({ type: 'guide_note', content: { text: block.text } })
        break
      case 'vendors':
        out.push({ type: 'guide_vendors', content: { list: block.items === LUNCH_STOPS ? 'lunch_stops' : 'hair_and_makeup' } })
        break
      case 'locations':
        out.push({ type: 'guide_locations', content: {} })
        break
      case 'columns': {
        const style = EDITING_STYLE[guideId] ?? 'natural'
        if (chapter.id === 'your-gallery' && block.items[0]?.title === RETOUCHING[style].label) {
          out.push({ type: 'guide_editing', content: { why_title: block.items[1]?.title ?? '' } })
        } else if (chapter.id === 'weather') {
          const match = /we move the (\w+),/.exec(block.items.map((c) => c.body).join(' '))
          const followedByReschedule =
            blocks[i + 1]?.kind === 'prose' && (blocks[i + 1] as { text: string[] }).text[0] === RESCHEDULE_NOTE
          out.push({ type: 'guide_weather', content: { word: match?.[1] ?? 'session', show_reschedule: followedByReschedule } })
        } else {
          out.push({ type: 'guide_columns', content: { items: block.items } })
        }
        break
      }
    }
  }
  return out
}

let guidePosition = 1
for (const guide of GUIDES) {
  const existing = await one<{ id: string }>('SELECT id FROM guides WHERE slug = ?', [guide.id])
  if (existing) {
    GUIDE_ID.set(guide.id, existing.id)
    console.log(`  · /guides/${guide.id} already exists`)
    continue
  }
  const id = randomUUID()
  GUIDE_ID.set(guide.id, id)
  await db.query(
    `INSERT INTO guides (id, slug, title, status, position, details, published_at) VALUES (?, ?, ?, 'published', ?, ?, ?)`,
    [
      id,
      guide.id,
      guide.title,
      guidePosition++,
      JSON.stringify({
        eyebrow: guide.eyebrow,
        subtitle: guide.subtitle,
        photo: url(guide.photoId),
        intro: html(guide.intro),
        sign_off: guide.signOff,
        meta: guide.meta,
      }),
      now(),
    ],
  )

  const sections: SeedSection[] = [{ type: 'guide_hero' }, { type: 'guide_letter' }]
  for (const chapter of guide.chapters) {
    sections.push({ type: 'guide_chapter', content: { title: chapter.title, lead: chapter.lead ?? '', anchor: chapter.id } })
    sections.push(...blockSections(chapter, guide.id))
  }
  sections.push({
    type: 'guide_close',
    content: {
      body: 'No question about this is too small — what to do with your hands, whether a color will work, whether we should move the whole thing because of the forecast. Message me and I will answer properly.',
    },
  })
  await seedSections('guide', id, sections)
  console.log(`  ✓ /guides/${guide.id} — ${guide.chapters.length} chapters`)
}

/* ------------------------------------------------------------------ *
 * Sessions
 * ------------------------------------------------------------------ */

console.log('\nSessions')

/**
 * A tier's figure back into *how* it was priced.
 *
 * packages.ts computed each price from the rate card and printed it; the
 * dashboard stores the recipe instead, so the rate card can move them. Senior
 * prices and the discounted bundles were hand-set and stay fixed.
 */
function priceOf(sessionId: string, tier: { price: string; includes: string[] }): TierPrice {
  const value = Number(tier.price.replace(/[^0-9]/g, ''))
  const hasAlbum = tier.includes.some((line) => /printed album/i.test(line))
  const base = hasAlbum ? value - ALBUM : value
  const card = RATE_CARD as Record<string, number>
  const fixed: TierPrice = { mode: 'fixed', lengths: [], amount: base, text: '', album: hasAlbum }

  if (!value) return { mode: 'text', lengths: [], amount: 0, text: tier.price, album: false }
  if (sessionId === 'seniors') return fixed

  const keys = Object.keys(card)
  const single = keys.find((k) => card[k] === base)
  if (single) return { mode: 'rate', lengths: [single], amount: 0, text: '', album: hasAlbum }
  for (const a of keys) {
    for (const b of keys) {
      if (a < b && card[a] + card[b] === base) return { mode: 'rate', lengths: [a, b], amount: 0, text: '', album: hasAlbum }
    }
  }
  return fixed
}

let sessionPosition = 1
for (const session of SESSIONS) {
  const existing = await one<{ id: string }>('SELECT id FROM session_types WHERE slug = ?', [session.id])
  if (existing) {
    console.log(`  · /sessions/${session.id} already exists`)
    continue
  }

  const set = PACKAGE_SETS.find((p) => p.id === session.id)
  const packages: PackageSet = {
    intro: set?.intro ?? '',
    note: set?.note ?? '',
    tiers: (set?.tiers ?? []).map(
      (t): Tier => ({
        id: t.id,
        name: t.name,
        price: priceOf(session.id, t),
        unit: t.unit,
        summary: t.summary,
        time: t.spec.time,
        locations: t.spec.locations,
        outfits: t.spec.outfits,
        images: t.spec.images,
        includes: t.includes,
        featured: t.featured === true,
      }),
    ),
  }

  const id = randomUUID()
  await db.query(
    `INSERT INTO session_types (id, slug, title, status, position, portfolio_category_id, guide_id, private_pricing, details, packages, published_at)
     VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      session.id,
      session.title,
      sessionPosition++,
      CATEGORY_ID.get(session.filter) ?? null,
      GUIDE_ID.get(session.id) ?? null,
      PRIVATE_PRICING.includes(session.id) ? 1 : 0,
      JSON.stringify({
        index: session.index,
        blurb: session.blurb,
        runs: session.runs,
        photo: url(session.photoId),
        hero_photo: url(session.heroPhotoId),
        gallery: session.gallery.map(url).filter(Boolean),
        detail: html(session.detail),
        points: session.points,
        editing_style: EDITING_STYLE[session.id] ?? 'natural',
      }),
      JSON.stringify(packages),
      now(),
    ],
  )
  const guideId = GUIDE_ID.get(session.id)
  if (guideId) await db.query('UPDATE guides SET session_type_id = ? WHERE id = ?', [id, guideId])

  await seedSections('session', id, [
    { type: 'session_hero' },
    { type: 'session_overview' },
    { type: 'session_pricing' },
    { type: 'session_guide' },
    { type: 'session_albums' },
    { type: 'session_nav' },
    {
      type: 'cta_close',
      content: {
        body: 'Tell me roughly when, and where you picture it. If you are not sure which tier fits, describe what you want and I will tell you — including when the cheaper one is the right answer.',
      },
    },
  ])
  console.log(`  ✓ /sessions/${session.id} — ${packages.tiers.map((t) => `${t.name} (${t.price.mode})`).join(', ')}`)
}

/* ------------------------------------------------------------------ *
 * Albums
 * ------------------------------------------------------------------ */

console.log('\nAlbums')

async function seedAlbum(a: {
  slug: string
  title: string
  category: string
  shootDate: string
  dateLabel: string
  story: string
  location?: string | null
  conditions?: string | null
  requests?: string | null
  cover: string
  photos: string[]
}) {
  const existing = await one<{ id: string }>('SELECT id FROM albums WHERE slug = ?', [a.slug])
  if (existing) {
    console.log(`  · /portfolio/${a.slug} already exists`)
    return
  }
  await db.query(
    `INSERT INTO albums (id, slug, title, status, category_id, shoot_date, date_label, cover, story, location, conditions, requests, photos, published_at)
     VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      a.slug,
      a.title,
      CATEGORY_ID.get(a.category) ?? null,
      a.shootDate,
      a.dateLabel,
      // Stored only when it differs from the first photograph, which is the default.
      a.cover && a.cover !== a.photos[0] ? a.cover : null,
      a.story || null,
      a.location || null,
      a.conditions || null,
      a.requests || null,
      JSON.stringify(a.photos),
      now(),
    ],
  )
  console.log(`  ✓ /portfolio/${a.slug} — ${a.photos.length} photographs`)
}

for (const shoot of SHOOTS) {
  await seedAlbum({
    slug: shoot.slug,
    title: shoot.title,
    category: shoot.category,
    shootDate: shoot.sort,
    dateLabel: shoot.date,
    story: shoot.story,
    location: shoot.location,
    conditions: shoot.conditions,
    requests: shoot.requests,
    cover: url(shoot.cover),
    photos: photosFor(shoot).map((p) => url(p.id)).filter(Boolean),
  })
}

for (const album of remote.albums) {
  const when = album.date ? new Date(album.date * 1000) : null
  const photos = album.photos.map((p) => `${p.src}-${mainWidth(p.widths)}.webp`)
  await seedAlbum({
    slug: album.slug,
    title: album.title,
    category: album.category,
    shootDate: when ? when.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    dateLabel: when ? when.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '',
    story: album.story ?? '',
    location: album.location,
    conditions: album.conditions,
    requests: album.requests,
    cover: photos[0] ?? '',
    photos,
  })
}

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

console.log('\nPages')

async function seedPage(p: {
  slug: string
  title: string
  key?: string
  metaTitle?: string
  metaDescription: string
  sections: SeedSection[]
}) {
  const existing = await one<{ id: string }>('SELECT id FROM pages WHERE slug = ?', [p.slug])
  if (existing) {
    console.log(`  · /${p.slug} already exists`)
    return
  }
  const id = randomUUID()
  await db.query(
    `INSERT INTO pages (id, slug, title, page_key, status, meta_title, meta_description, published_at)
     VALUES (?, ?, ?, ?, 'published', ?, ?, ?)`,
    [id, p.slug, p.title, p.key ?? null, p.metaTitle ?? null, p.metaDescription, now()],
  )
  await seedSections('page', id, p.sections)
  console.log(`  ✓ /${p.slug === 'home' ? '' : p.slug} — ${p.sections.length} sections`)
}

/** Anchor and index-rail name for a homepage section. */
const rail = (anchor: string, label: string) => ({ anchor, rail_label: label })

await seedPage({
  slug: 'home',
  key: 'home',
  title: 'Home',
  metaTitle: 'Ashley Photography — Senior, Couple & Family Portraits in Des Moines, Iowa',
  metaDescription:
    'Natural-light portrait photography based in Urbandale, serving the Des Moines metro and central Iowa. Senior pictures, graduation, engagements, couples, families and pets.',
  sections: [
    {
      type: 'home_hero',
      content: {
        eyebrow: HERO.eyebrow,
        lead: HERO.lead,
        script: HERO.script,
        sub: HERO.sub,
        scroll_label: HERO.scroll,
        scroll_target: '#about',
        image: url('engagement-june2022-54'),
        alt: 'A couple standing close together in a summer field, framed by a tree in full white blossom',
      },
      styles: rail('hero', 'Opening'),
    },
    { type: 'marquee', content: { items: MARQUEE } },
    {
      type: 'story',
      content: {
        eyebrow: INTRO.eyebrow,
        heading: INTRO.heading,
        body: html(INTRO.body),
        stats: INTRO.stats,
        image: url('seniors-elise-portrait-55'),
        alt: 'A senior in a blue floral dress standing on a tree-lined path in late afternoon light',
        image_offset: url('backgrounds-2024-07-05-park-practice-122'),
        alt_offset: 'White wildflowers catching the light against deep green undergrowth',
        caption: 'Central Iowa · 2024',
      },
      styles: rail('story', 'The Work'),
    },
    { type: 'sessions_index', styles: rail('sessions', 'Sessions') },
    {
      type: 'selected_work',
      content: {
        items: FEATURED.map((f) => ({ image: url(f.photoId), caption: f.caption, span: f.span })),
      },
      styles: rail('work', 'Selected'),
    },
    {
      type: 'process',
      content: { steps: PROCESS.map((p) => ({ title: p.title, body: p.body, image: url(p.photoId) })) },
      styles: rail('process', 'Process'),
    },
    {
      type: 'about_intro',
      content: {
        eyebrow: ABOUT.eyebrow,
        heading: ABOUT.heading,
        body: html(ABOUT.body),
        image: url(ABOUT.photoId),
        signature: ABOUT.signature,
      },
      styles: rail('about', 'Ashley'),
    },
    {
      type: 'inquiry_cta',
      content: { eyebrow: CTA.eyebrow, heading: CTA.heading, body: CTA.body, action: CTA.action, image: url(CTA.photoId) },
      styles: rail('contact', 'Inquire'),
    },
  ],
})

await seedPage({
  slug: 'sessions',
  key: 'sessions',
  title: 'Sessions',
  metaTitle: 'Sessions — Ashley Photography',
  metaDescription:
    'Senior pictures, graduation, engagements, couples, families and pets. Pricing, what each session includes, and a prep guide for every one.',
  sections: [
    {
      type: 'page_hero',
      content: { eyebrow: SESSIONS_PAGE.eyebrow, heading: SESSIONS_PAGE.heading, body: SESSIONS_PAGE.body, image: url(SESSIONS_PAGE.photoId) },
    },
    { type: 'session_cards' },
    { type: 'always_included' },
  ],
})

const { arc, principles, finishing, receive, weather, close } = EXPERIENCE_PAGE
await seedPage({
  slug: 'experience',
  title: 'The experience',
  metaTitle: 'The experience — Ashley Photography',
  metaDescription:
    'How a session runs from the first message to the finished album: planning, the day itself, what you receive, and what happens if the weather turns.',
  sections: [
    {
      type: 'page_hero',
      content: { eyebrow: EXPERIENCE_PAGE.eyebrow, heading: EXPERIENCE_PAGE.heading, body: EXPERIENCE_PAGE.intro, image: url(EXPERIENCE_PAGE.photoId) },
    },
    {
      type: 'timeline_arc',
      content: {
        eyebrow: arc.eyebrow,
        heading: arc.heading,
        lead: arc.lead,
        items: arc.items,
        image: url('engagement-june2022-176'),
        alt: '',
        caption: 'Central Iowa · golden hour',
      },
    },
    { type: 'numbered_cards', content: { eyebrow: principles.eyebrow, heading: principles.heading, items: principles.items } },
    {
      type: 'finishing_levels',
      content: {
        eyebrow: finishing.eyebrow,
        heading: finishing.heading,
        body: finishing.body,
        applies_retouched: finishing.applies.retouched,
        applies_natural: finishing.applies.natural,
      },
    },
    {
      type: 'checklist_split',
      content: {
        eyebrow: receive.eyebrow,
        heading: receive.heading,
        body: receive.body,
        items: receive.items,
        link_label: 'Packages and add-ons',
        link_href: '/contact#investment',
      },
    },
    { type: 'weather_policy', content: { eyebrow: weather.eyebrow, heading: weather.heading, word: 'session' } },
    {
      type: 'session_links',
      content: {
        close_heading: close.heading,
        close_body: close.body,
        close_label: 'Ask me something',
        close_href: '/contact',
      },
    },
  ],
})

await seedPage({
  slug: 'portfolio',
  key: 'portfolio',
  title: 'Portfolio',
  metaTitle: 'Portfolio — Ashley Photography',
  metaDescription:
    'Portrait sessions across the Des Moines metro and central Iowa: seniors, graduation, engagements, couples, families and pets.',
  sections: [
    { type: 'page_hero', content: { eyebrow: PORTFOLIO.eyebrow, heading: PORTFOLIO.heading, body: PORTFOLIO.body, image: url(PORTFOLIO.photoId) } },
    { type: 'portfolio_listing' },
  ],
})

await seedPage({
  slug: 'guides',
  key: 'guides',
  title: 'Client guides',
  metaTitle: 'Client guides — Ashley Photography',
  metaDescription:
    'Prep guides for every session type: what to wear, when to book hair and makeup, where we shoot, what to bring, and how the day runs.',
  sections: [
    {
      type: 'page_hero',
      content: { eyebrow: GUIDES_INDEX.eyebrow, heading: GUIDES_INDEX.heading, body: GUIDES_INDEX.body, image: url(GUIDES_INDEX.photoId) },
    },
    { type: 'guides_listing' },
    {
      type: 'text_block',
      content: {
        layout: 'split',
        eyebrow: 'Why these exist',
        heading: 'Nobody should be guessing the night before',
        body: html([
          'Almost every worry people bring to a session is a planning worry rather than a photography one: whether the outfit works, whether the haircut was a mistake, whether the forecast means it is off. I try to answer all of those in advance, so you can relax on the day of your session.',
          'Your guide arrives the day you book. The checklists tick off and stay ticked on your own device, so you can pack over two evenings without losing your place, and every one of them prints cleanly if you would rather have it on paper on the kitchen table.',
          'Not booked yet? Read them anyway — they are a clear preview of what a shoot with me actually feels like.',
        ]),
        buttons: [{ label: 'Start an inquiry', href: '/contact', style: 'primary' }],
      },
    },
  ],
})

await seedPage({
  slug: 'about',
  title: 'About',
  metaTitle: 'About — Ashley Photography',
  metaDescription: 'Natural-light portrait photography based in Urbandale, serving the Des Moines metro and central Iowa.',
  sections: [
    {
      type: 'page_hero',
      content: { eyebrow: ABOUT_PAGE.eyebrow, heading: ABOUT_PAGE.heading, body: ABOUT_PAGE.intro, image: url('backgrounds-2024-07-05-park-practice-127') },
    },
    {
      type: 'about_essays',
      content: {
        portrait: firstUrl(ABOUT_PAGE.portraits),
        portrait_alt: 'Ashley',
        caption: SITE.base,
        secondary: firstUrl(ABOUT_PAGE.secondary),
        secondary_alt: 'Ashley',
        columns: ABOUT_PAGE.columns,
      },
    },
    { type: 'milestones', content: { heading: 'How it went', entries: ABOUT_PAGE.timeline } },
    { type: 'aside_cta', content: { aside_title: ABOUT_PAGE.aside.title, aside_body: ABOUT_PAGE.aside.body } },
  ],
})

await seedPage({
  slug: 'contact',
  title: 'Contact',
  metaTitle: 'Contact — Ashley Photography',
  metaDescription:
    'Pricing and inquiries for senior, graduation, engagement, couples, family and pet sessions across the Des Moines metro and central Iowa.',
  sections: [
    {
      type: 'page_hero',
      content: { eyebrow: CONTACT_PAGE.eyebrow, heading: CONTACT_PAGE.heading, body: CONTACT_PAGE.body, image: url(CONTACT_PAGE.photoId) },
    },
    { type: 'inquiry_form' },
    { type: 'investment' },
    { type: 'faq', content: { items: FAQ, eyebrow: 'Questions', heading: 'The things people ask first' } },
    {
      type: 'faq',
      content: {
        eyebrow: 'Terms',
        heading: 'Dates, deposits and bad weather',
        intro: 'No contracts you need a lawyer for. Everything that could cost you money or move your date is on this list.',
        link_label: 'And once you have booked',
        link_href: '/guides',
        items: BOOKING.terms,
      },
      styles: { anchor: 'terms', background: 'canvas' },
    },
    {
      type: 'gallery_timeline',
      content: { eyebrow: GALLERY.eyebrow, heading: GALLERY.heading, body: GALLERY.body, points: GALLERY.timeline },
    },
  ],
})

await seedPage({
  slug: 'blog',
  key: 'blog',
  title: 'Journal',
  metaTitle: 'Journal — Ashley Photography',
  metaDescription: 'Sessions, locations and planning notes from Ashley Photography.',
  sections: [
    {
      type: 'page_hero',
      content: {
        eyebrow: 'The journal',
        heading: 'Notes from behind the camera.',
        body: 'Sessions I loved, places worth knowing about, and the planning advice I give everybody.',
        image: url('backgrounds-italy-2025-324'),
      },
    },
    { type: 'blog_listing' },
  ],
})

await db.end()

console.log('\n─────────────────────────────────────────────')
console.log('Seeded.\n')
console.log(`  Sign in at /dashboard as ${ownerEmail}`)
console.log('  with the OWNER_PASSWORD in .env, then change it under Your account.')
console.log('─────────────────────────────────────────────\n')

