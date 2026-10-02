/**
 * Everything editable that is not a page: the site's identity and navigation,
 * pricing, policy copy, vendor lists, the inquiry form's options — and the
 * detail panels of a session and a guide.
 *
 * All of it is described as field lists, the same `FieldDef`s the widgets use,
 * so the dashboard edits every one of these with the same form renderer and the
 * server cleans every one of them the same way. Adding a setting is a line here.
 */

import { fieldDefaults, hydrateFields, type FieldDef } from './widgets.js'
import type { PackageSet, PublicTier, Tier, TierPrice } from './types.js'

/* ------------------------------------------------------------------ *
 * Site — identity, contact, navigation, footer, search
 * ------------------------------------------------------------------ */

export const SITE_FIELDS: readonly FieldDef[] = [
  {
    name: 'identity',
    label: 'Name and place',
    type: 'group',
    children: [
      { name: 'name', label: 'Business name', type: 'text', default: 'Ashley Photography' },
      { name: 'tagline', label: 'Tagline', type: 'text', default: 'Portrait photography in central Iowa' },
      { name: 'base', label: 'Based in', type: 'text', default: 'Urbandale, Iowa' },
      { name: 'serves', label: 'Traveling to', type: 'text', default: 'Des Moines metro · Central Iowa · Travel welcome' },
      { name: 'since', label: 'Booking since', type: 'text', default: '2021' },
      { name: 'reply', label: 'Typically replies', type: 'text', default: 'Within 48 hours' },
    ],
  },
  {
    name: 'contact',
    label: 'Contact',
    type: 'group',
    children: [
      { name: 'email', label: 'Email', type: 'text', default: 'ashleydesignia@gmail.com', help: 'Shown on the site. Inquiries are delivered to the address set on the server.' },
      { name: 'instagram', label: 'Instagram link', type: 'link', default: 'https://www.instagram.com/photosbyashley__/' },
      { name: 'instagram_handle', label: 'Instagram handle', type: 'text', default: '@photosbyashley__' },
    ],
  },
  {
    name: 'nav',
    label: 'Navigation',
    type: 'repeater',
    itemLabel: 'Link',
    maxItems: 8,
    wide: true,
    help: 'The links across the top of every page. Contact is always added at the end on a phone and in the footer.',
    default: [
      { label: 'Portfolio', href: '/portfolio', sessions_menu: false },
      { label: 'Sessions', href: '/sessions', sessions_menu: true },
      { label: 'Experience', href: '/experience', sessions_menu: false },
      { label: 'Investment', href: '/contact#investment', sessions_menu: false },
      { label: 'About', href: '/about', sessions_menu: false },
    ],
    children: [
      { name: 'label', label: 'Label', type: 'text', default: '' },
      { name: 'href', label: 'Link', type: 'link', default: '/' },
      { name: 'sessions_menu', label: 'Drop down the list of sessions', type: 'boolean', default: false },
    ],
  },
  {
    name: 'header',
    label: 'Header',
    type: 'group',
    children: [
      { name: 'cta_label', label: 'Button', type: 'text', default: 'Inquire' },
      { name: 'cta_href', label: 'Button link', type: 'link', default: '/contact' },
    ],
  },
  {
    name: 'footer',
    label: 'Footer',
    type: 'group',
    children: [
      { name: 'note', label: 'Line at the bottom', type: 'text', default: 'Every photograph on this site is my own work' },
      { name: 'cta_label', label: 'Button', type: 'text', default: 'Inquire' },
    ],
  },
  {
    name: 'seo',
    label: 'Search and sharing',
    type: 'group',
    children: [
      { name: 'suffix', label: 'After every page title', type: 'text', default: ' — Ashley Photography' },
      {
        name: 'description',
        label: 'Default description',
        type: 'textarea',
        default:
          'Natural-light portrait photography based in Urbandale, serving the Des Moines metro and central Iowa. Senior pictures, graduation, engagements, couples, families and pets.',
      },
      { name: 'og_image', label: 'Default share image', type: 'image', default: '' },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * The lengths a tier can be priced from.
 *
 * Fixed keys with editable figures, rather than a free list, because the tiers
 * refer to them by key: renaming "two hours" must not orphan every tier priced
 * off it. Seven lengths cover everything sold; a tier that needs something odd
 * is a fixed price.
 */
export const RATE_LENGTHS = [
  { value: 'short', label: 'Forty-five minutes' },
  { value: 'hour', label: 'One hour' },
  { value: 'ninety', label: 'Ninety minutes' },
  { value: 'two', label: 'Two hours' },
  { value: 'half', label: 'Two and a half hours' },
  { value: 'three', label: 'Three hours' },
  { value: 'four', label: 'Four hours' },
] as const

export const PRICING_FIELDS: readonly FieldDef[] = [
  {
    name: 'rate_card',
    label: 'Rate card',
    type: 'group',
    help: 'Every tier priced from the rate card follows these. To move the whole business up or down, change these and nothing else.',
    children: [
      { name: 'short', label: 'Forty-five minutes', type: 'number', default: 295, min: 0, step: 5, suffix: '$' },
      { name: 'hour', label: 'One hour', type: 'number', default: 375, min: 0, step: 5, suffix: '$' },
      { name: 'ninety', label: 'Ninety minutes', type: 'number', default: 475, min: 0, step: 5, suffix: '$' },
      { name: 'two', label: 'Two hours', type: 'number', default: 575, min: 0, step: 5, suffix: '$' },
      { name: 'half', label: 'Two and a half hours', type: 'number', default: 675, min: 0, step: 5, suffix: '$' },
      { name: 'three', label: 'Three hours', type: 'number', default: 775, min: 0, step: 5, suffix: '$' },
      { name: 'four', label: 'Four hours', type: 'number', default: 895, min: 0, step: 5, suffix: '$' },
      { name: 'album', label: 'Printed album', type: 'number', default: 200, min: 0, step: 5, suffix: '$', help: 'Added to any tier marked as including an album.' },
    ],
  },
  {
    name: 'private',
    label: 'Private pricing',
    type: 'group',
    help: 'Sessions marked private show "By request" instead of figures. Send a client a link ending ?pricing=<key> and the figures appear for the rest of their visit.',
    children: [
      { name: 'key', label: 'Key', type: 'text', default: 'iowa2026', help: 'Change it and every link already sent stops revealing anything.' },
      { name: 'price_label', label: 'In place of the price', type: 'text', default: 'By request' },
      { name: 'from_label', label: 'In place of “From $…”', type: 'text', default: 'Pricing by request' },
      {
        name: 'note',
        label: 'Note under the tiers',
        type: 'textarea',
        default:
          'Senior and engagement pricing is sent directly rather than posted. Everything each package includes is above — tell me roughly when and where you are thinking, and the full price list comes back with the first reply.',
      },
    ],
  },
  {
    name: 'always_included',
    label: 'In every session',
    type: 'lines',
    wide: true,
    help: 'One per line.',
    default: [
      'Travel included across the Des Moines metro',
      'A private online photo gallery, live for a full year',
      'Full download and print rights to your images',
      'Selected frames also delivered in black and white',
      'A prep guide sent the moment you book',
      'Additional edited images available any time',
    ],
  },
  {
    name: 'black_and_white',
    label: 'Black and white aside',
    type: 'group',
    children: [
      { name: 'eyebrow', label: 'Label', type: 'text', default: 'A small thing I do' },
      {
        name: 'body',
        label: 'Aside',
        type: 'textarea',
        default:
          'Some frames are simply better without color. As I edit, I pick the ones that earn it and deliver those in black and white as well as color — at no extra cost, and no extra decision for you to make.',
      },
    ],
  },
  {
    name: 'add_ons',
    label: 'Add-ons',
    type: 'repeater',
    itemLabel: 'Add-on',
    wide: true,
    default: [],
    children: [
      { name: 'label', label: 'Add-on', type: 'text', default: '' },
      { name: 'price', label: 'Price', type: 'text', default: '', placeholder: '$150 · Quoted · Free' },
      { name: 'detail', label: 'Detail', type: 'textarea', default: '' },
    ],
  },
  {
    name: 'booking',
    label: 'How booking works',
    type: 'group',
    children: [
      { name: 'eyebrow', label: 'Label', type: 'text', default: 'How booking works' },
      { name: 'heading', label: 'Heading', type: 'text', default: 'Four steps, and none of them are complicated.' },
      {
        name: 'steps',
        label: 'Steps',
        type: 'repeater',
        itemLabel: 'Step',
        maxItems: 4,
        default: [],
        children: [
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
        ],
      },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Policy — copy that appears in more than one place
 * ------------------------------------------------------------------ */

export const POLICY_FIELDS: readonly FieldDef[] = [
  {
    name: 'retouched',
    label: 'Fully retouched',
    type: 'group',
    help: 'Shown on the pricing tiers, in every guide’s gallery chapter and on the experience page.',
    children: [
      { name: 'label', label: 'Name', type: 'text', default: 'Fully retouched' },
      { name: 'body', label: 'Explanation', type: 'textarea', default: '' },
      { name: 'why', label: 'Why the count is lower', type: 'textarea', default: '' },
    ],
  },
  {
    name: 'natural',
    label: 'Naturally edited',
    type: 'group',
    children: [
      { name: 'label', label: 'Name', type: 'text', default: 'Naturally edited' },
      { name: 'body', label: 'Explanation', type: 'textarea', default: '' },
      { name: 'why', label: 'Why the count is higher', type: 'textarea', default: '' },
    ],
  },
  {
    name: 'weather',
    label: 'Weather',
    type: 'repeater',
    itemLabel: 'Column',
    maxItems: 4,
    wide: true,
    help: '{session} becomes "session", "walk" or whatever the widget asks for.',
    default: [],
    children: [
      { name: 'title', label: 'Title', type: 'text', default: '' },
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
    ],
  },
  { name: 'reschedule', label: 'Moving a date', type: 'textarea', default: '', wide: true },
]

/* ------------------------------------------------------------------ *
 * Library — the recommendation lists the guides draw on
 * ------------------------------------------------------------------ */

const VENDOR_CHILDREN: readonly FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', default: '' },
  { name: 'area', label: 'Area', type: 'text', default: '' },
  { name: 'address', label: 'Address', type: 'text', default: '' },
  { name: 'does', label: 'What they are good for', type: 'textarea', default: '' },
  { name: 'note', label: 'Your own note', type: 'textarea', default: '', help: 'Shown in italics.' },
  { name: 'url', label: 'Website', type: 'link', default: '' },
]

export const LIBRARY_FIELDS: readonly FieldDef[] = [
  {
    name: 'hair_and_makeup',
    label: 'Hair and makeup',
    type: 'repeater',
    itemLabel: 'Salon',
    wide: true,
    default: [],
    children: VENDOR_CHILDREN,
  },
  {
    name: 'lunch_stops',
    label: 'Lunch stops',
    type: 'repeater',
    itemLabel: 'Lunch stop',
    wide: true,
    default: [],
    children: VENDOR_CHILDREN,
  },
  {
    name: 'locations',
    label: 'Locations',
    type: 'repeater',
    itemLabel: 'Group',
    wide: true,
    default: [],
    children: [
      { name: 'group', label: 'Group', type: 'text', default: '' },
      { name: 'blurb', label: 'Description', type: 'textarea', default: '' },
      { name: 'places', label: 'Places', type: 'lines', default: [], help: 'One per line.' },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Inquiry form
 * ------------------------------------------------------------------ */

export const INQUIRY_FIELDS: readonly FieldDef[] = [
  {
    name: 'extra_sessions',
    label: 'After the sessions in “Which session?”',
    type: 'lines',
    default: ['Something else', 'Just a question'],
    help: 'The published sessions are listed first automatically. One per line.',
  },
  { name: 'undecided', label: 'Undecided tier option', type: 'text', default: 'Not sure yet — help me choose' },
  {
    name: 'timeframes',
    label: '“When are you hoping for?”',
    type: 'lines',
    default: [
      'As soon as you have space',
      'Within the next month',
      'One to three months out',
      'Three to six months out',
      'Later this year',
      'Next year',
      'Only gathering information for now',
    ],
  },
  {
    name: 'heard_from',
    label: '“How did you find me?”',
    type: 'lines',
    default: ['Instagram', 'A friend or family member', 'Google', 'We have worked together before', 'Somewhere else'],
  },
  { name: 'hint', label: 'Line beside the button', type: 'text', default: 'Reply within 48 hours. Nothing is committed by asking.' },
  { name: 'sent_heading', label: 'After sending — heading', type: 'text', default: 'Message sent.' },
  {
    name: 'sent_body',
    label: 'After sending — body',
    type: 'textarea',
    default:
      'Thank you — I will get back to you within a couple of days with dates and a straight answer on which tier fits. If it is urgent, a DM on Instagram is the fastest way to reach me.',
  },
]

export const SETTINGS_GROUPS = {
  site: SITE_FIELDS,
  pricing: PRICING_FIELDS,
  policy: POLICY_FIELDS,
  library: LIBRARY_FIELDS,
  inquiry: INQUIRY_FIELDS,
} as const

export type SettingsKey = keyof typeof SETTINGS_GROUPS

export function settingsDefaults(key: SettingsKey): Record<string, unknown> {
  return fieldDefaults(SETTINGS_GROUPS[key])
}

export function hydrateSettings(key: SettingsKey, saved: unknown): Record<string, unknown> {
  return hydrateFields(SETTINGS_GROUPS[key], saved)
}

/* ------------------------------------------------------------------ *
 * A session's details
 * ------------------------------------------------------------------ */

export const SESSION_FIELDS: readonly FieldDef[] = [
  { name: 'index', label: 'Number', type: 'text', default: '01', help: 'Shown beside the title in lists.' },
  { name: 'blurb', label: 'One-line summary', type: 'textarea', default: '', wide: true, help: 'Used on the homepage list, the sessions page and the masthead.' },
  { name: 'runs', label: 'When and how long', type: 'text', default: '', placeholder: 'Evening, timed to sunset · one to two hours' },
  { name: 'photo', label: 'Card photograph', type: 'image', default: '', help: 'Portrait-shaped. Used on cards and beside the long copy.' },
  { name: 'hero_photo', label: 'Masthead photograph', type: 'image', default: '' },
  { name: 'gallery', label: 'Two smaller photographs', type: 'images', default: [], help: 'Shown under the card photograph on the session’s page.' },
  { name: 'detail', label: 'Long copy', type: 'richtext', default: '', wide: true },
  { name: 'points', label: 'What it includes', type: 'lines', default: [], wide: true, help: 'One per line.' },
  {
    name: 'editing_style',
    label: 'How it is edited',
    type: 'choice',
    default: 'natural',
    options: [
      { value: 'retouched', label: 'Fully retouched' },
      { value: 'natural', label: 'Naturally edited' },
    ],
    help: 'Decides which editing note the pricing and the guide show.',
  },
]

/* ------------------------------------------------------------------ *
 * A guide's details
 * ------------------------------------------------------------------ */

export const GUIDE_FIELDS: readonly FieldDef[] = [
  { name: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'Your prep guide' },
  { name: 'subtitle', label: 'Subtitle', type: 'textarea', default: '', wide: true },
  { name: 'photo', label: 'Photograph', type: 'image', default: '' },
  { name: 'intro', label: 'Opening letter', type: 'richtext', default: '', wide: true },
  { name: 'sign_off', label: 'Signed', type: 'text', default: 'Ashley' },
  {
    name: 'meta',
    label: 'At a glance',
    type: 'repeater',
    itemLabel: 'Row',
    wide: true,
    default: [],
    children: [
      { name: 'label', label: 'Label', type: 'text', default: '' },
      { name: 'value', label: 'Value', type: 'text', default: '' },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Tier prices
 * ------------------------------------------------------------------ */

export function emptyTierPrice(): TierPrice {
  return { mode: 'rate', lengths: ['hour'], amount: 0, text: '', album: false }
}

export function emptyTier(): Tier {
  return {
    id: '',
    name: 'New tier',
    price: emptyTierPrice(),
    unit: 'one hour',
    summary: '',
    time: '',
    locations: '',
    outfits: '',
    images: '',
    includes: [],
    featured: false,
  }
}

export function emptyPackageSet(): PackageSet {
  return { intro: '', note: '', tiers: [] }
}

/** `1450` → `$1,450`. */
export const money = (n: number) => `$${n.toLocaleString('en-US')}`

/**
 * A tier's price as a number, or null for a text price.
 *
 * This is the whole reason the rate card exists: a tier stores *which lengths*
 * it sells rather than a figure, so changing the card moves every tier priced
 * off it and nothing can drift.
 */
export function tierValue(price: TierPrice, pricing: Record<string, unknown>): number | null {
  const card = (pricing.rate_card ?? {}) as Record<string, number>
  const album = price.album ? Number(card.album) || 0 : 0
  if (price.mode === 'text') return null
  if (price.mode === 'fixed') return (Number(price.amount) || 0) + album
  return price.lengths.reduce((sum, key) => sum + (Number(card[key]) || 0), 0) + album
}

export function tierLabel(price: TierPrice, pricing: Record<string, unknown>): string {
  const value = tierValue(price, pricing)
  return value === null ? price.text || 'Quoted' : money(value)
}

/** Normalizes a stored package set, so a half-written one never reaches a renderer. */
export function cleanPackages(input: unknown): PackageSet {
  const src = (input ?? {}) as Partial<PackageSet>
  const text = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '')
  const lengths = RATE_LENGTHS.map((l) => l.value) as string[]

  const tiers = Array.isArray(src.tiers)
    ? src.tiers.slice(0, 6).map((raw, i): Tier => {
        const t = (raw ?? {}) as Partial<Tier>
        const p = (t.price ?? {}) as Partial<TierPrice>
        return {
          id: text(t.id, 80) || `tier-${i + 1}`,
          name: text(t.name, 120),
          price: {
            mode: p.mode === 'fixed' || p.mode === 'text' ? p.mode : 'rate',
            lengths: Array.isArray(p.lengths) ? p.lengths.filter((l): l is string => lengths.includes(l as string)) : [],
            amount: Math.max(0, Number(p.amount) || 0),
            text: text(p.text, 60),
            album: p.album === true,
          },
          unit: text(t.unit, 80),
          summary: text(t.summary, 400),
          time: text(t.time, 120),
          locations: text(t.locations, 120),
          outfits: text(t.outfits, 120),
          images: text(t.images, 120),
          includes: Array.isArray(t.includes)
            ? t.includes.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 300)).slice(0, 12)
            : [],
          featured: t.featured === true,
        }
      })
    : []

  return { intro: text(src.intro), note: text(src.note), tiers }
}

/**
 * The tiers as the public site sees them.
 *
 * `showPrices` is false for a private session reached without the key, and in
 * that case the figures never leave the server — an actual lock now, where the
 * static site could only ever hide numbers that were already in the bundle.
 */
export function publicTiers(
  set: PackageSet,
  pricing: Record<string, unknown>,
  showPrices: boolean,
): PublicTier[] {
  const priv = (pricing.private ?? {}) as Record<string, string>
  return set.tiers.map(({ price, ...rest }) => {
    const value = tierValue(price, pricing)
    return {
      ...rest,
      price: showPrices ? tierLabel(price, pricing) : priv.price_label || 'By request',
      value: showPrices ? value : null,
    }
  })
}

export function fromPrice(tiers: PublicTier[], showPrices: boolean, pricing: Record<string, unknown>): string {
  const priv = (pricing.private ?? {}) as Record<string, string>
  if (!showPrices) return priv.from_label || 'Pricing by request'
  const values = tiers.map((t) => t.value).filter((v): v is number => v !== null)
  if (values.length === 0) return 'By quote'
  return `From ${money(Math.min(...values))}`
}
