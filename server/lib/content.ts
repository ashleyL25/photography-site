import { randomUUID } from 'node:crypto'
import { execute, query } from '../db.js'
import { sanitizeHtml, htmlToText } from './sanitize.js'
import {
  STYLE_FIELDS,
  getWidget,
  hydrateWidget,
  normalizeSource,
  type FieldDef,
} from '../../shared/widgets.js'
import type { Section, SectionHost, SectionRow } from '../../shared/types.js'

/* ------------------------------------------------------------------ *
 * Reading and writing sections
 * ------------------------------------------------------------------ */

function parseJson(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  } catch {
    // One unreadable section must not take down the page it sits on. An empty
    // object hydrates to the widget's defaults, so the section renders as a
    // blank version of itself — visible, obviously wrong, and fixable in place.
    return {}
  }
}

function toSection(row: SectionRow): Section {
  const { content, styles } = hydrateWidget(
    row.widget_type,
    parseJson(row.content),
    parseJson(row.styles),
  )
  return {
    id: row.id,
    type: row.widget_type,
    position: row.position,
    hidden: row.hidden === 1,
    content,
    styles,
  }
}

export async function getSections(
  hostType: SectionHost,
  hostId: string,
  opts: { includeHidden?: boolean } = {},
): Promise<Section[]> {
  const rows = await query<SectionRow>(
    `SELECT id, host_type, host_id, widget_type, position, hidden, content, styles
       FROM sections
      WHERE host_type = ? AND host_id = ?${opts.includeHidden ? '' : ' AND hidden = 0'}
      ORDER BY position ASC, id ASC`,
    [hostType, hostId],
  )
  return rows.map(toSection)
}

/** Sections for several hosts at once, grouped by host id. Avoids an N+1 on listings. */
export async function getSectionsFor(
  hostType: SectionHost,
  hostIds: string[],
  opts: { includeHidden?: boolean } = {},
): Promise<Map<string, Section[]>> {
  const out = new Map<string, Section[]>()
  if (hostIds.length === 0) return out

  const placeholders = hostIds.map(() => '?').join(', ')
  const rows = await query<SectionRow>(
    `SELECT id, host_type, host_id, widget_type, position, hidden, content, styles
       FROM sections
      WHERE host_type = ? AND host_id IN (${placeholders})${opts.includeHidden ? '' : ' AND hidden = 0'}
      ORDER BY position ASC, id ASC`,
    [hostType, ...hostIds],
  )

  for (const row of rows) {
    const list = out.get(row.host_id) ?? []
    list.push(toSection(row))
    out.set(row.host_id, list)
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Sanitizing on the way in
 * ------------------------------------------------------------------ */

/**
 * Cleans a submitted content object against its widget's own field definitions.
 *
 * Driven by the schema rather than by a per-widget function, which is what keeps
 * a new widget from arriving unsanitised: any field declared `richtext` is
 * cleaned, wherever in the tree it sits, including inside repeater rows.
 *
 * Unknown keys are dropped rather than passed through. A client cannot smuggle
 * an extra property into a section by posting one.
 */
export function cleanAgainst(fields: readonly FieldDef[], input: unknown): Record<string, unknown> {
  const src = (input ?? {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}

  for (const field of fields) {
    const value = src[field.name]

    switch (field.type) {
      case 'group':
        out[field.name] = cleanAgainst(field.children ?? [], value)
        break

      case 'repeater':
        out[field.name] = Array.isArray(value)
          ? value.slice(0, field.maxItems ?? 80).map((row) => cleanAgainst(field.children ?? [], row))
          : []
        break

      case 'richtext':
        out[field.name] = sanitizeHtml(value)
        break

      case 'boolean':
        out[field.name] = value === true || value === 'true' || value === 1
        break

      case 'number': {
        const n = typeof value === 'number' ? value : Number(value)
        out[field.name] = Number.isFinite(n) ? n : (field.default ?? 0)
        break
      }

      case 'collection':
        out[field.name] = normalizeSource(value)
        break

      case 'images':
        // URLs only, in order. An album can run to a few hundred frames.
        out[field.name] = Array.isArray(value)
          ? value.filter((v): v is string => typeof v === 'string' && v.length > 0).map((v) => v.slice(0, 768)).slice(0, 600)
          : []
        break

      case 'sessions':
      case 'albums':
        // Ids, in the order picked.
        out[field.name] = Array.isArray(value)
          ? value.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length < 64).slice(0, 60)
          : []
        break

      case 'lines':
        // Typed as one item per line; stored as the list. A string is accepted
        // too, so a client that posts the textarea's raw value still works.
        out[field.name] = (Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [])
          .filter((v): v is string => typeof v === 'string')
          .map((v) => v.trim().slice(0, 600))
          .filter(Boolean)
          .slice(0, 80)
        break

      case 'multichoice':
        out[field.name] = Array.isArray(value)
          ? value.filter((v) => typeof v === 'string' && (!field.options || field.options.some((o) => o.value === v)))
          : []
        break

      case 'choice':
        // Constrained to the declared options, so a hand-crafted request cannot
        // put an arbitrary string where the renderer expects one of five.
        out[field.name] =
          field.options && typeof value === 'string' && field.options.some((o) => o.value === value)
            ? value
            : (field.default ?? '')
        break

      default:
        out[field.name] = typeof value === 'string' ? value.slice(0, 20_000) : (field.default ?? '')
    }
  }

  return out
}

export function cleanSectionContent(widgetType: string, content: unknown): Record<string, unknown> {
  const def = getWidget(widgetType)
  if (!def) return {}
  return cleanAgainst(def.fields, content)
}

export function cleanSectionStyles(styles: unknown): Record<string, unknown> {
  return cleanAgainst(STYLE_FIELDS, styles)
}

/* ------------------------------------------------------------------ *
 * Saving a whole section list
 * ------------------------------------------------------------------ */

export interface IncomingSection {
  id?: string
  type: string
  hidden?: boolean
  content?: unknown
  styles?: unknown
}

/**
 * Replaces a host's sections with the list the editor submitted.
 *
 * Deliberately a full replace rather than a diff. The editor already holds the
 * entire list in memory — it has to, to reorder it — so sending the whole thing
 * makes "saved" mean exactly "what is on screen". A patch protocol would need
 * per-section version tracking to avoid two tabs quietly clobbering each other,
 * and it would still lose a reorder.
 *
 * Rows are matched by id where the client supplied one, so an existing section
 * keeps its primary key across a save. That matters for nothing today and would
 * matter a great deal the first time anything references a section by id.
 */
export async function replaceSections(
  hostType: SectionHost,
  hostId: string,
  incoming: IncomingSection[],
): Promise<void> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM sections WHERE host_type = ? AND host_id = ?`,
    [hostType, hostId],
  )
  const existingIds = new Set(existing.map((r) => r.id))
  const keptIds = new Set<string>()

  let position = 0
  for (const section of incoming) {
    if (!getWidget(section.type)) continue // an unknown widget type is dropped, not stored

    const content = JSON.stringify(cleanSectionContent(section.type, section.content))
    const styles = JSON.stringify(cleanSectionStyles(section.styles))
    const hidden = section.hidden ? 1 : 0

    if (section.id && existingIds.has(section.id)) {
      keptIds.add(section.id)
      await execute(
        `UPDATE sections
            SET widget_type = ?, position = ?, hidden = ?, content = ?, styles = ?,
                updated_at = UNIX_TIMESTAMP()
          WHERE id = ?`,
        [section.type, position, hidden, content, styles, section.id],
      )
    } else {
      const id = randomUUID()
      keptIds.add(id)
      await execute(
        `INSERT INTO sections (id, host_type, host_id, widget_type, position, hidden, content, styles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, hostType, hostId, section.type, position, hidden, content, styles],
      )
    }
    position++
  }

  const removed = [...existingIds].filter((id) => !keptIds.has(id))
  if (removed.length > 0) {
    await execute(
      `DELETE FROM sections WHERE id IN (${removed.map(() => '?').join(', ')})`,
      removed,
    )
  }
}

export async function deleteSections(hostType: SectionHost, hostId: string): Promise<void> {
  await execute(`DELETE FROM sections WHERE host_type = ? AND host_id = ?`, [hostType, hostId])
}

/** Duplicates one host's sections onto another. Used by "Duplicate" in the dashboard. */
export async function copySections(
  hostType: SectionHost,
  fromId: string,
  toId: string,
): Promise<void> {
  const rows = await query<SectionRow>(
    `SELECT widget_type, position, hidden, content, styles
       FROM sections WHERE host_type = ? AND host_id = ? ORDER BY position ASC`,
    [hostType, fromId],
  )
  for (const row of rows) {
    await execute(
      `INSERT INTO sections (id, host_type, host_id, widget_type, position, hidden, content, styles)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), hostType, toId, row.widget_type, row.position, row.hidden, row.content, row.styles],
    )
  }
}

/* ------------------------------------------------------------------ *
 * Derived values
 * ------------------------------------------------------------------ */

/** Every word of prose in a section list, for reading time and excerpts. */
export function sectionsToText(sections: { content: Record<string, unknown> }[]): string {
  const parts: string[] = []

  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      parts.push(htmlToText(value))
    } else if (Array.isArray(value)) {
      value.forEach(walk)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk)
    }
  }

  sections.forEach((s) => walk(s.content))
  return parts.filter(Boolean).join(' ')
}

/**
 * Reading time in whole minutes, never zero.
 *
 * 225 words a minute is the usual figure for adult prose read for pleasure,
 * which is what this is. A post that takes forty seconds says "1 min read"
 * rather than "0", because zero reads as an error rather than as "short".
 */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 225))
}

/** First `limit` characters of prose, cut on a word boundary. */
export function makeExcerpt(text: string, limit = 200): string {
  const clean = text.trim()
  if (clean.length <= limit) return clean
  const cut = clean.slice(0, limit)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}
