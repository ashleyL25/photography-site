import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Label, inputClass } from './controls'

/**
 * The URL field.
 *
 * It follows the title until somebody says otherwise, and the behavior Ashley
 * asked for is precise:
 *
 *   * While it is *not* overridden, it mirrors the title, slugified, live.
 *   * Pressing **Edit** unlocks it and stops it following.
 *   * **Clearing the field entirely puts it back to following the title** rather
 *     than leaving the page at no address at all.
 *
 * That last rule is the one that makes the control forgiving: the way out of a
 * slug you no longer want is to select all and delete, which is what everybody
 * tries first anyway.
 *
 * The slug is not rewritten from the title once a page has been published —
 * that is enforced on the server, which keeps `slug` as sent rather than
 * recomputing it, and writes a redirect when it does change.
 */
export function SlugField({
  title,
  value,
  onChange,
  prefix = '/',
  locked = false,
  lockedReason,
}: {
  title: string
  /** The stored slug. Empty means "follow the title". */
  value: string
  onChange: (slug: string) => void
  /** What comes before it in the URL, e.g. `/blog/`. */
  prefix?: string
  /** Fixed pages cannot be renamed at all. */
  locked?: boolean
  lockedReason?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  // Keep the draft in step when the value changes from outside — a save that
  // returns a de-duplicated slug, say.
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const derived = slugify(title)
  const shown = editing ? draft : value || derived

  function commit(next: string) {
    const cleaned = slugify(next)
    // An empty field means "go back to following the title", which the server
    // reads as: recompute from the title. Sending '' rather than the derived
    // slug is what tells it that.
    onChange(cleaned)
    setDraft(cleaned)
    if (!cleaned) setEditing(false)
  }

  return (
    <div>
      <Label htmlFor="slug-field">Page address</Label>

      <div
        className={clsx(
          'flex items-center rounded-[3px] border bg-canvas transition-colors',
          editing ? 'border-gilt' : 'border-line',
          locked && 'opacity-60',
        )}
      >
        <span className="shrink-0 pl-3.5 font-mono text-xs text-faint">{prefix}</span>
        <input
          id="slug-field"
          value={shown}
          readOnly={!editing || locked}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft)
              setEditing(false)
            }
            if (e.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
          className={clsx(
            inputClass,
            'border-0 bg-transparent pl-1 font-mono text-xs',
            !editing && 'cursor-default text-muted',
          )}
        />
      </div>

      {locked ? (
        <p className="mt-2 text-xs text-faint">
          {lockedReason ?? 'This address is fixed because the site routes to it directly.'}
        </p>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (editing) {
                commit(draft)
                setEditing(false)
              } else {
                setDraft(value || derived)
                setEditing(true)
              }
            }}
            className="label text-faint transition-colors hover:text-gilt"
          >
            {editing ? 'Done' : 'Edit'}
          </button>

          {(editing || value) && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setDraft('')
                setEditing(false)
              }}
              className="label text-faint transition-colors hover:text-gilt"
            >
              Follow the title
            </button>
          )}

          {!value && !editing && (
            <span className="text-xs text-faint">Follows the title</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The same rule as the server's `slugify`.
 *
 * Duplicated rather than shared because the server's version lives in a module
 * that imports the database pool, and the client must not. The two are simple
 * enough that drift would be visible immediately — and the server's is
 * authoritative regardless, since it is the one that writes the row.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['’`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}
