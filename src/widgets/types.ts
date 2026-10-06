import type React from 'react'
import { createContext, useContext } from 'react'
import clsx from 'clsx'
import type { Album, Guide, Post, PublicSession } from '@shared/types'

export interface WidgetProps {
  content: Record<string, unknown>
  styles: Record<string, unknown>
  /** Posts a blog widget resolved to, attached by the server. */
  data?: Post[]
}

/* ------------------------------------------------------------------ *
 * What a widget sits on
 *
 * A session page's widgets read the session; a guide's read the guide. Passed
 * by context so the same renderer works in the dashboard preview, where the
 * editor provides the thing being edited.
 * ------------------------------------------------------------------ */

export type HostValue =
  | { kind: 'page' }
  | { kind: 'post' }
  | { kind: 'session'; session: PublicSession }
  | { kind: 'guide'; guide: Guide; session: PublicSession | null }
  | { kind: 'album'; album: Album }

export const HostContext = createContext<HostValue>({ kind: 'page' })

/** True inside the dashboard's preview, where an empty widget explains itself instead of vanishing. */
export const PreviewContext = createContext(false)

export function useHost() {
  return useContext(HostContext)
}

export function useHostSession(): PublicSession | null {
  const host = useHost()
  if (host.kind === 'session') return host.session
  if (host.kind === 'guide') return host.session
  return null
}

/* ------------------------------------------------------------------ *
 * Reading content
 * ------------------------------------------------------------------ */

export const text = (content: Record<string, unknown>, key: string) => {
  const v = content[key]
  return typeof v === 'string' ? v : ''
}

export const list = <T,>(content: Record<string, unknown>, key: string): T[] => {
  const v = content[key]
  return Array.isArray(v) ? (v as T[]) : []
}

export const bool = (content: Record<string, unknown>, key: string, fallback = false) => {
  const v = content[key]
  return typeof v === 'boolean' ? v : fallback
}

/** Replaces `{session}`, `{slug}`, `{index}` and `{title}` with the host's values. */
export function fill(value: string, tokens: Record<string, string>) {
  return value.replace(/\{(\w+)\}/g, (whole, key: string) => (key in tokens ? tokens[key] : whole))
}

/* ------------------------------------------------------------------ *
 * The Style tab
 *
 * Every widget renders its own <section> with the spacing, background and rule
 * it had on the hand-built site. These are the overrides from the Style tab,
 * applied on top — and "As designed" is the default for all of them.
 * ------------------------------------------------------------------ */

export interface FrameDefaults {
  id?: string
  /** Padding classes as designed, e.g. `py-28 md:py-40`. */
  pad?: string
  surface?: boolean
  rule?: boolean
}

const g = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

/**
 * A space choice as an inline padding.
 *
 * Inline rather than a class so it can override one side of a section's
 * designed padding without knowing what that padding was, and fluid so it
 * scales between a phone and a wide screen the way the designed values do.
 */
export const SPACE: Record<string, string> = {
  none: '0px',
  xs: 'clamp(1.25rem, 2vw, 2rem)',
  sm: 'clamp(2.5rem, 4vw, 4rem)',
  md: 'clamp(4rem, 6vw, 6rem)',
  lg: 'clamp(5.5rem, 8vw, 8rem)',
  xl: 'clamp(7rem, 11vw, 11rem)',
}

/** The background schemes that are dark, and so turn the text light. */
export const DARK_SCHEMES = new Set(['charcoal', 'forest', 'copper', 'sage'])

export function frame(styles: Record<string, unknown>, d: FrameDefaults = {}) {
  const s = styles ?? {}
  const bg = g(s.background)
  const spacing = g(s.spacing)
  const rules = g(s.rules)
  const layout = g(s.layout)
  const scheme = typeof bg.scheme === 'string' ? bg.scheme : 'auto'
  const painted = scheme !== 'auto' || Boolean(bg.image)
  // Anything layered behind the content needs the widget's own band out of the
  // way, so the wrapper paints that band and the layers sit on top of it.
  const decorated =
    Boolean(bg.texture) ||
    (g(s.decor).preset !== undefined && g(s.decor).preset !== 'none') ||
    (g(s.particles).style !== undefined && g(s.particles).style !== 'none') ||
    Boolean(g(s.watermark).motif)

  // The designed raised band stays unless the Style tab picks something else;
  // anything else is painted by the section wrapper (see StyledSection).
  const surface = scheme === 'auto' && !bg.image ? Boolean(d.surface) : false
  const rule = rules.top === 'auto' || rules.top === undefined ? Boolean(d.rule) : false
  const anchor = typeof s.anchor === 'string' && s.anchor ? s.anchor : d.id

  const style: React.CSSProperties = {}
  if (typeof spacing.top === 'string' && SPACE[spacing.top]) style.paddingTop = SPACE[spacing.top]
  if (typeof spacing.bottom === 'string' && SPACE[spacing.bottom]) style.paddingBottom = SPACE[spacing.bottom]

  const width = typeof layout.width === 'string' ? layout.width : 'auto'
  const align = typeof layout.align === 'string' ? layout.align : 'auto'

  return {
    id: anchor || undefined,
    pad: d.pad ?? 'py-24 md:py-32',
    style,
    painted,
    width,
    align,
    /** The container for widgets that honour the width setting. */
    shell: width === 'full' ? 'w-full px-0' : 'shell',
    /** The measure inside that container, with its alignment. */
    measure: (fallback = '') =>
      clsx(
        width === 'narrow' ? 'max-w-2xl' : width === 'medium' ? 'max-w-4xl' : width === 'auto' ? fallback : '',
        align === 'center' && 'mx-auto text-center',
      ),
    centered: align === 'center',
    className: clsx(
      surface && (decorated ? 'designed-surface' : 'bg-surface'),
      rule && 'border-t border-line',
      painted && 'bg-transparent',
      s.hide_desktop === true && 'lg:hidden',
      s.hide_mobile === true && 'max-lg:hidden',
    ),
  }
}

/** The label-with-a-rule that heads nearly every section on the site. */
export const EYEBROW = 'label flex items-center gap-4 text-accent'

/**
 * Grid classes for a "Columns on a wide screen" choice. Spelled out in full so
 * Tailwind sees every class; a phone always gets one column, a tablet two.
 */
export function columns(value: unknown, fallback = '3') {
  const n = typeof value === 'string' && value ? value : fallback
  return n === '1'
    ? 'grid-cols-1'
    : n === '2'
      ? 'sm:grid-cols-2'
      : n === '4'
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : n === '6'
          ? 'grid-cols-3 md:grid-cols-6'
          : 'sm:grid-cols-2 lg:grid-cols-3'
}

/** An aspect-ratio choice ('4/5', '3/2' …) as a style, so any ratio works. */
export function ratio(value: unknown, fallback = '4/5'): React.CSSProperties {
  const v = typeof value === 'string' && /^\d+\/\d+$/.test(value) ? value : fallback
  return { aspectRatio: v.replace('/', ' / ') }
}
