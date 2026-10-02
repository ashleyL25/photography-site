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

export function frame(styles: Record<string, unknown>, d: FrameDefaults = {}) {
  const s = styles ?? {}
  const background = s.background === 'surface' ? true : s.background === 'canvas' ? false : Boolean(d.surface)
  const rule = s.rule === 'line' ? true : s.rule === 'none' ? false : Boolean(d.rule)
  const pad = s.spacing === 'compact' ? 'py-16 md:py-20' : s.spacing === 'none' ? '' : (d.pad ?? 'py-24 md:py-32')
  const anchor = typeof s.anchor === 'string' && s.anchor ? s.anchor : d.id

  return {
    id: anchor || undefined,
    pad,
    className: clsx(
      background && 'bg-surface',
      rule && 'border-t border-line',
      s.hide_desktop === true && 'lg:hidden',
      s.hide_mobile === true && 'max-lg:hidden',
    ),
  }
}

/** The label-with-a-rule that heads nearly every section on the site. */
export const EYEBROW = 'label flex items-center gap-4 text-accent'
