import { swatchColor } from '@shared/palette'
/**
 * Every timestamp in the database is unix seconds, so every formatter here takes
 * seconds and not milliseconds. Keeping that in one place is what stops a
 * date from rendering as 1970 somewhere on the site.
 */

const LOCALE = 'en-US'

export function formatDate(seconds: number | null | undefined): string {
  if (!seconds) return ''
  return new Date(seconds * 1000).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(seconds: number | null | undefined): string {
  if (!seconds) return ''
  return new Date(seconds * 1000).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * "3 days ago", down to a floor of "just now".
 *
 * Used only in the dashboard, where "edited 4 hours ago" answers the question
 * being asked and a full date does not. Public pages always show the real date:
 * an essay that says "2 years ago" reads as neglected in a way "March 2024" does
 * not.
 */
export function formatRelative(seconds: number | null | undefined): string {
  if (!seconds) return ''
  const diff = Math.floor(Date.now() / 1000) - seconds

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (diff < 86400 * 30) {
    const d = Math.floor(diff / 86400)
    return `${d} day${d === 1 ? '' : 's'} ago`
  }
  return formatShortDate(seconds)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Cuts a string on a word boundary, for excerpt lengths set in the theme. */
export function truncate(text: string | null | undefined, limit: number): string {
  if (!text) return ''
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

/**
 * A term's color, resolved to the CSS variable the theme defines.
 *
 * Terms store a palette *name* rather than a hex value, so re-theming the site
 * recolors every category badge with it rather than leaving a row of colors
 * from the old brand.
 */
export function swatchVar(swatch: string | null | undefined): string {
  return swatchColor(swatch ?? '')
}

