/**
 * Shapes shared by the API and the client.
 *
 * Database rows use the column names verbatim (snake_case) so a query result can
 * be typed without a mapping layer; everything the API composes for the client
 * is camelCase. Where both exist for one concept the row type carries a `Row`
 * suffix.
 */

/* ------------------------------------------------------------------ *
 * Accounts
 * ------------------------------------------------------------------ */

/**
 * Two roles, and the split is about blast radius rather than seniority.
 *
 * `owner` is Ashley's account. It can do everything `editor` can, plus the
 * things that break the site rather than change it: adding and removing
 * accounts, and creating and deleting pages.
 *
 * `editor` is for anybody else trusted with the content — every page, post,
 * session, album and guide, the media library and the settings — without the
 * ability to delete a page out from under the navigation or lock the owner out.
 */
export type UserRole = 'owner' | 'editor'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  display_name: string | null
  role: UserRole
  avatar_url: string | null
  bio: string | null
  created_at: number
  last_login_at: number | null
}

export interface UserPublic {
  id: string
  email: string
  name: string
  displayName: string
  role: UserRole
  avatarUrl: string | null
  bio: string | null
  createdAt: number
  lastLoginAt: number | null
}

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ */

export type ContentStatus = 'draft' | 'published'

/** What a section can be attached to. Matches `WidgetHost` in widgets.ts. */
export type SectionHost = 'page' | 'post' | 'session' | 'album' | 'guide'

export interface SectionRow {
  id: string
  host_type: SectionHost
  host_id: string
  widget_type: string
  position: number
  hidden: number
  content: string
  styles: string
}

export interface Section {
  id: string
  type: string
  position: number
  hidden: boolean
  content: Record<string, unknown>
  styles: Record<string, unknown>
  /** Posts a blog widget resolved to, attached by the server before sending. */
  data?: Post[]
}

export interface PageRow {
  id: string
  slug: string
  title: string
  /**
   * Set for the pages the router reaches by name — home, sessions, portfolio,
   * guides, blog. A keyed page keeps its slug and cannot be deleted.
   */
  page_key: string | null
  status: ContentStatus
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  noindex: number
  created_at: number
  updated_at: number
  published_at: number | null
}

export interface Page {
  id: string
  slug: string
  title: string
  pageKey: string | null
  status: ContentStatus
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  noindex: boolean
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  sections?: Section[]
}

export interface PostRow {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string | null
  featured_image: string | null
  featured_alt: string | null
  status: ContentStatus
  author_id: string | null
  category_id: string | null
  template: string | null
  featured: number
  reading_minutes: number
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  noindex: number
  created_at: number
  updated_at: number
  published_at: number | null
}

export interface Post {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string | null
  featuredImage: string | null
  featuredAlt: string | null
  status: ContentStatus
  template: string | null
  featured: boolean
  readingMinutes: number
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  noindex: boolean
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  author: { id: string; name: string; avatarUrl: string | null; bio: string | null } | null
  category: Term | null
  tags: Term[]
  sections?: Section[]
}

/* ------------------------------------------------------------------ *
 * Session types
 * ------------------------------------------------------------------ */

/**
 * How a tier's price is set.
 *
 * `rate` reads lengths off the rate card and adds them up — "Before The
 * Wedding" is ninety minutes plus two and a half hours — so moving the rate card
 * moves every tier priced from it. `fixed` is a typed figure, for the senior
 * collections and the discounted bundles. `text` is for "Quoted".
 */
export interface TierPrice {
  mode: 'rate' | 'fixed' | 'text'
  /** Rate-card keys, summed. */
  lengths: string[]
  amount: number
  text: string
  /** Adds the album price from the pricing settings. */
  album: boolean
}

export interface Tier {
  id: string
  name: string
  price: TierPrice
  unit: string
  summary: string
  time: string
  locations: string
  outfits: string
  images: string
  includes: string[]
  featured: boolean
}

export interface PackageSet {
  intro: string
  note: string
  tiers: Tier[]
}

/** A tier as the public site receives it — the price already worked out. */
export interface PublicTier extends Omit<Tier, 'price'> {
  /** `$1,595`, `By request`, or the tier's own text. */
  price: string
  /** Numeric value, for "From" figures. Null when hidden or not a number. */
  value: number | null
}

export interface SessionTypeRow {
  id: string
  slug: string
  title: string
  status: ContentStatus
  position: number
  portfolio_category_id: string | null
  guide_id: string | null
  private_pricing: number
  details: string
  packages: string
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  noindex: number
  created_at: number
  updated_at: number
  published_at: number | null
}

export interface SessionType {
  id: string
  slug: string
  title: string
  status: ContentStatus
  position: number
  portfolioCategoryId: string | null
  guideId: string | null
  privatePricing: boolean
  /** Copy and photographs — see SESSION_FIELDS in widgets.ts. */
  details: Record<string, unknown>
  packages: PackageSet
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  noindex: boolean
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  sections?: Section[]
}

/** What the public site knows about a session type, without its page body. */
export interface PublicSession {
  id: string
  slug: string
  title: string
  index: string
  blurb: string
  runs: string
  photo: string
  heroPhoto: string
  gallery: string[]
  detail: string
  points: string[]
  editingStyle: 'retouched' | 'natural'
  /** Portfolio category slug, for "sessions like yours" and filter links. */
  category: string | null
  guideSlug: string | null
  privatePricing: boolean
  /** True when the prices below are real figures rather than withheld. */
  pricesShown: boolean
  intro: string
  note: string
  tiers: PublicTier[]
  /** "From $375", or "Pricing by request". */
  fromPrice: string
  metaDescription: string | null
}

/* ------------------------------------------------------------------ *
 * Albums
 * ------------------------------------------------------------------ */

export interface AlbumRow {
  id: string
  slug: string
  title: string
  status: ContentStatus
  category_id: string | null
  featured: number
  shoot_date: string | null
  date_label: string | null
  cover: string | null
  story: string | null
  location: string | null
  conditions: string | null
  requests: string | null
  photos: string
  meta_title: string | null
  meta_description: string | null
  noindex: number
  created_at: number
  updated_at: number
  published_at: number | null
}

export interface Album {
  id: string
  slug: string
  title: string
  status: ContentStatus
  category: Term | null
  featured: boolean
  shootDate: string | null
  dateLabel: string | null
  cover: string | null
  story: string | null
  location: string | null
  conditions: string | null
  requests: string | null
  photos: string[]
  metaTitle: string | null
  metaDescription: string | null
  noindex: boolean
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  sections?: Section[]
}

/** An album on a card — enough for the grid, without its photographs. */
export interface AlbumSummary {
  id: string
  slug: string
  title: string
  category: string | null
  dateLabel: string
  shootDate: string
  location: string | null
  cover: string | null
  count: number
  featured: boolean
}

/* ------------------------------------------------------------------ *
 * Guides
 * ------------------------------------------------------------------ */

export interface GuideRow {
  id: string
  slug: string
  title: string
  status: ContentStatus
  position: number
  session_type_id: string | null
  details: string
  meta_title: string | null
  meta_description: string | null
  noindex: number
  created_at: number
  updated_at: number
  published_at: number | null
}

export interface Guide {
  id: string
  slug: string
  title: string
  status: ContentStatus
  position: number
  sessionTypeId: string | null
  details: Record<string, unknown>
  metaTitle: string | null
  metaDescription: string | null
  noindex: boolean
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  sections?: Section[]
}

export interface GuideSummary {
  id: string
  slug: string
  title: string
  subtitle: string
  photo: string
  chapters: number
  sessionSlug: string | null
  /** The at-a-glance rows, shown on the session's page. */
  meta: { label: string; value: string }[]
}

/* ------------------------------------------------------------------ *
 * Taxonomy
 *
 * One table for categories and tags, discriminated by `kind` and scoped by
 * `applies_to`. Two tables would duplicate every query and every screen for a
 * difference that is one column wide.
 * ------------------------------------------------------------------ */

export type TermKind = 'category' | 'tag'
export type TermScope = 'post' | 'portfolio'

export interface TermRow {
  id: string
  kind: TermKind
  applies_to: TermScope
  slug: string
  name: string
  description: string | null
  swatch: string
  position: number
  created_at: number
}

export interface Term {
  id: string
  kind: TermKind
  appliesTo: TermScope
  slug: string
  name: string
  description: string | null
  swatch: string
  position: number
  count?: number
}

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export interface MediaRow {
  id: string
  r2_key: string | null
  url: string
  prefix: string | null
  widths: string | null
  color: string | null
  lqip: string | null
  filename: string
  mime: string
  bytes: number
  width: number | null
  height: number | null
  alt: string | null
  folder: string | null
  created_at: number
}

export interface MediaItem {
  id: string
  key: string | null
  url: string
  /** Rendition prefix — append `-<width>.webp`. Null for files that are not photographs. */
  prefix: string | null
  widths: number[]
  color: string | null
  lqip: string | null
  filename: string
  mime: string
  bytes: number
  width: number | null
  height: number | null
  alt: string | null
  folder: string | null
  createdAt: number
}

/* ------------------------------------------------------------------ *
 * Misc
 * ------------------------------------------------------------------ */

export interface InquiryRow {
  id: string
  name: string
  email: string
  phone: string | null
  session: string | null
  tier: string | null
  timeframe: string | null
  location: string | null
  heard_from: string | null
  message: string
  source_path: string | null
  read_at: number | null
  emailed: number
  created_at: number
}

/**
 * What the Photo component needs to draw a photograph well: a srcset, a colour
 * behind it while it loads, and a blur-up. Keyed by the photograph's URL in the
 * registry every API response carries.
 */
export interface PhotoMeta {
  prefix: string
  widths: number[]
  width: number
  height: number
  color: string
  lqip: string
  alt: string | null
}

export interface SearchHit {
  kind: 'page' | 'post' | 'album' | 'session' | 'guide'
  id: string
  title: string
  slug: string
  href: string
  excerpt: string | null
  image: string | null
  meta: string | null
}

export interface OverviewCounts {
  pages: number
  posts: number
  drafts: number
  sessions: number
  albums: number
  guides: number
  media: number
  inquiries: number
  unread: number
}
