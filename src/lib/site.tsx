import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import { registerPhotos } from './photos'
import { prefetch } from './content'
import { settingsDefaults } from '@shared/settings'
import { themeCss, themeFontsHref, themeGroup } from '@shared/theme'
import type { AlbumSummary, GuideSummary, PhotoMeta, PublicSession, Term } from '@shared/types'

/**
 * The site payload — settings, sessions, album and guide summaries — loaded once
 * and shared by everything.
 *
 * Widgets read from here rather than fetching their own data, which is what lets
 * a page render every section the moment its sections arrive: the homepage's
 * session list, the pricing tabs and the portfolio filter bar all come out of
 * this one response.
 */

export interface SiteSettings {
  site: Record<string, unknown>
  theme: Record<string, unknown>
  pricing: Record<string, unknown>
  policy: Record<string, unknown>
  library: Record<string, unknown>
  inquiry: Record<string, unknown>
}

export interface SitePayload {
  settings: SiteSettings
  sessions: PublicSession[]
  albums: AlbumSummary[]
  guides: GuideSummary[]
  categories: { id: string; slug: string; name: string }[]
  postTerms: Term[]
  /** Every category and tag, for the dashboard's filing controls. */
  terms: { post: Term[]; portfolio: Term[] }
  unlocked: boolean
  photos?: Record<string, PhotoMeta>
}

interface SiteContextValue extends SitePayload {
  ready: boolean
  refresh: () => Promise<void>
}

const EMPTY: SitePayload = {
  settings: {
    site: settingsDefaults('site'),
    theme: settingsDefaults('theme'),
    pricing: settingsDefaults('pricing'),
    policy: settingsDefaults('policy'),
    library: settingsDefaults('library'),
    inquiry: settingsDefaults('inquiry'),
  },
  sessions: [],
  albums: [],
  guides: [],
  categories: [],
  postTerms: [],
  terms: { post: [], portfolio: [] },
  unlocked: false,
}

const SiteContext = createContext<SiteContextValue>({ ...EMPTY, ready: false, refresh: async () => {} })

const PRICING_STORE = 'ap-pricing'

/**
 * The private-pricing key, if this visit has one.
 *
 * Arriving on `?pricing=<key>` stores it for the rest of the browser session,
 * so the client can click through to the contact page without the figures
 * vanishing again. `sessionStorage` rather than `localStorage` on purpose: a
 * shared machine forgets when the tab closes. The server decides whether the
 * key is right — a wrong one simply gets the public payload back.
 */
export function pricingKey(): string {
  try {
    const given = new URLSearchParams(window.location.search).get('pricing')
    if (given) {
      sessionStorage.setItem(PRICING_STORE, given)
      return given
    }
    return sessionStorage.getItem(PRICING_STORE) ?? ''
  } catch {
    return new URLSearchParams(window.location.search).get('pricing') ?? ''
  }
}

export function SiteProvider({
  children,
  endpoint = '/site',
}: {
  children: ReactNode
  /** The dashboard swaps in its own endpoint, which includes drafts. */
  endpoint?: string
}) {
  const [payload, setPayload] = useState<SitePayload>(EMPTY)
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    try {
      const key = endpoint === '/site' ? pricingKey() : ''
      const data = await api.get<SitePayload>(key ? `${endpoint}?pricing=${encodeURIComponent(key)}` : endpoint)
      registerPhotos(data.photos)
      setPayload(data)

      // The public site warms the pages a visitor is most likely to open next,
      // once the page they arrived on has had the network to itself.
      if (endpoint === '/site') {
        const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1500))
        idle(() =>
          prefetch([
            '/page-by-key/home',
            '/page-by-key/sessions',
            '/page-by-key/portfolio',
            '/page/about',
            '/page/experience',
            '/page/contact',
            ...data.sessions.map((s) => `/sessions/${s.slug}`),
          ]),
        )
      }
    } catch {
      // A failed boot still renders a site: the defaults are the shipped copy,
      // so a briefly unreachable database gives empty lists rather than a blank page.
    } finally {
      setReady(true)
    }
  }, [endpoint])

  useEffect(() => {
    void load()
  }, [load])

  // The dashboard's Theme screen previews an unsaved theme by posting it in.
  const [previewTheme, setPreviewTheme] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'ap-theme:preview') setPreviewTheme(event.data.theme ?? null)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const theme = previewTheme ?? (payload.settings.theme as Record<string, unknown> | undefined) ?? EMPTY.settings.theme
  useApplyTheme(theme)

  const value = useMemo<SiteContextValue>(() => {
    const settings = previewTheme ? { ...payload.settings, theme: previewTheme } : payload.settings
    return { ...payload, settings, ready, refresh: load }
  }, [payload, previewTheme, ready, load])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

/**
 * Writes the theme into the page: its stylesheet in a <style> tag, and a font
 * link for any typeface the page does not already load. Not on the dashboard's
 * own screens, which keep their own look — only on the site and its preview.
 */
function useApplyTheme(theme: Record<string, unknown>) {
  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/dashboard') && !path.startsWith('/dashboard/preview-frame')) return
    let style = document.getElementById('theme-css') as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = 'theme-css'
      document.head.appendChild(style)
    }
    style.textContent = themeCss(theme)

    const href = themeFontsHref(theme)
    let link = document.getElementById('theme-fonts') as HTMLLinkElement | null
    if (href) {
      if (!link) {
        link = document.createElement('link')
        link.id = 'theme-fonts'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      if (link.href !== href) link.href = href
    } else link?.remove()
  }, [theme])
}

/** One group of theme settings — `useThemeSettings('header', 'behaviour')`. */
export function useThemeSettings(group: string, sub: string): Record<string, unknown> {
  const { settings } = useContext(SiteContext)
  return themeGroup(settings.theme, group, sub)
}

export function useSite() {
  return useContext(SiteContext)
}

/* ------------------------------------------------------------------ *
 * Typed readers for the settings groups
 * ------------------------------------------------------------------ */

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const group = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const list = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : [])

export function useSiteInfo() {
  const { settings, sessions } = useSite()
  const s = settings.site
  const identity = group(s.identity)
  const contact = group(s.contact)
  const header = group(s.header)
  const footer = group(s.footer)
  const seo = group(s.seo)

  const nav = list<{ label: string; href: string; sessions_menu: boolean }>(s.nav).filter((n) => n.label && n.href)

  return {
    name: text(identity.name),
    tagline: text(identity.tagline),
    base: text(identity.base),
    serves: text(identity.serves),
    since: text(identity.since),
    reply: text(identity.reply),
    email: text(contact.email),
    instagram: text(contact.instagram),
    instagramHandle: text(contact.instagram_handle),
    headerCta: { label: text(header.cta_label) || 'Inquire', href: text(header.cta_href) || '/contact' },
    footerNote: text(footer.note),
    footerCta: text(footer.cta_label) || 'Inquire',
    titleSuffix: text(seo.suffix),
    description: text(seo.description),
    nav: nav.map((item) => ({
      label: item.label,
      to: item.href,
      children: item.sessions_menu
        ? sessions.map((session) => ({ label: session.title, to: `/sessions/${session.slug}` }))
        : undefined,
    })),
  }
}

export function useRetouching() {
  const { settings } = useSite()
  const p = settings.policy
  const read = (key: 'retouched' | 'natural') => {
    const g = group(p[key])
    return { label: text(g.label), body: text(g.body), why: text(g.why) }
  }
  return { retouched: read('retouched'), natural: read('natural') }
}

export function useWeather(word: string) {
  const { settings } = useSite()
  const columns = list<{ title: string; body: string }>(settings.policy.weather).map((c) => ({
    title: c.title,
    body: c.body.replaceAll('{session}', word),
  }))
  return { columns, reschedule: text(settings.policy.reschedule) }
}

export function usePricing() {
  const { settings } = useSite()
  const p = settings.pricing
  const priv = group(p.private)
  const bw = group(p.black_and_white)
  const booking = group(p.booking)
  return {
    alwaysIncluded: list<string>(p.always_included),
    addOns: list<{ label: string; price: string; detail: string }>(p.add_ons),
    byRequestNote: text(priv.note),
    blackAndWhite: { eyebrow: text(bw.eyebrow), body: text(bw.body) },
    booking: {
      eyebrow: text(booking.eyebrow),
      heading: text(booking.heading),
      steps: list<{ title: string; body: string }>(booking.steps),
    },
  }
}

export interface Vendor {
  name: string
  area: string
  address: string
  does: string
  note: string
  url: string
}

export function useLibrary() {
  const { settings } = useSite()
  const l = settings.library
  type CardRow = {
    name: string
    area: string
    address: string
    blurb: string
    detail: string
    best_for: string
    note: string
    photos: { image: string; credit_name: string; credit_url: string; credit_subject: string }[]
  }
  return {
    hair_and_makeup: list<Vendor>(l.hair_and_makeup),
    lunch_stops: list<Vendor>(l.lunch_stops),
    locations: list<{ group: string; blurb: string; places: string[] }>(l.locations),
    locationCards: list<CardRow>(l.location_cards)
      .filter((c) => c.name)
      .map((c, i) => ({
        slug: `${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
        name: c.name,
        area: c.area,
        address: c.address || undefined,
        blurb: c.blurb,
        detail: c.detail,
        bestFor: c.best_for,
        note: c.note || undefined,
        photos: (c.photos ?? [])
          .filter((p) => p.image)
          .map((p) => ({
            url: p.image,
            credit: p.credit_name
              ? { name: p.credit_name, url: p.credit_url || undefined, subject: p.credit_subject || undefined }
              : undefined,
          })),
      })),
  }
}

export function useInquirySettings() {
  const { settings, sessions } = useSite()
  const i = settings.inquiry
  return {
    sessions: [...sessions.map((s) => s.title), ...list<string>(i.extra_sessions)],
    sessionFor: (label: string) => sessions.find((s) => s.title === label),
    undecided: text(i.undecided),
    timeframes: list<string>(i.timeframes),
    heardFrom: list<string>(i.heard_from),
    hint: text(i.hint),
    sentHeading: text(i.sent_heading),
    sentBody: text(i.sent_body),
  }
}

/** Display names for the portfolio categories, keyed by slug. */
export function useCategoryLabels(): Record<string, string> {
  const { categories } = useSite()
  return useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.name])), [categories])
}
