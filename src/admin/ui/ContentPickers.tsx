import { useSite } from '@/lib/site'
import { thumbOf } from '../photos'
import { Select } from './controls'

/**
 * Choosing sessions or albums by hand, in order.
 *
 * The order picked is the order shown, so the chosen ones sit in a list that
 * can be shuffled, and the rest wait in a menu underneath. An empty list is a
 * real answer for sessions — "all of them" — so nothing is pre-filled.
 */
export function OrderedPicker({
  kind,
  value,
  onChange,
}: {
  kind: 'sessions' | 'albums'
  value: string[]
  onChange: (next: string[]) => void
}) {
  const { sessions, albums } = useSite()
  const items =
    kind === 'sessions'
      ? sessions.map((s) => ({ id: s.id, title: s.title, photo: s.photo, note: s.runs }))
      : albums.map((a) => ({ id: a.id, title: a.title, photo: a.cover ?? '', note: a.dateLabel }))
  const byId = new Map(items.map((i) => [i.id, i]))
  const chosen = value.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => Boolean(i))
  const rest = items.filter((i) => !value.includes(i.id))

  const move = (index: number, by: number) => {
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {chosen.length > 0 && (
        <ol className="divide-y divide-line rounded-[3px] border border-line bg-canvas">
          {chosen.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              {item.photo ? (
                <img src={thumbOf(item.photo)} alt="" className="h-10 w-8 shrink-0 rounded-[2px] object-cover" />
              ) : (
                <span className="h-10 w-8 shrink-0 rounded-[2px] bg-surface" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{item.title}</span>
                {item.note && <span className="block truncate text-xs text-faint">{item.note}</span>}
              </span>
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)} d="m6 15 6-6 6 6" />
              <IconButton label="Move down" disabled={i === chosen.length - 1} onClick={() => move(i, 1)} d="m6 9 6 6 6-6" />
              <IconButton label="Remove" onClick={() => onChange(value.filter((v) => v !== item.id))} d="M6 6l12 12M18 6 6 18" />
            </li>
          ))}
        </ol>
      )}
      {rest.length > 0 && (
        <Select
          value=""
          onChange={(id) => id && onChange([...value, id])}
          options={[
            { value: '', label: chosen.length ? `Add another ${kind === 'sessions' ? 'session' : 'album'}…` : `Choose ${kind}…` },
            ...rest.map((i) => ({ value: i.id, label: i.title })),
          ]}
        />
      )}
      {items.length === 0 && <p className="text-xs text-faint">Nothing published yet.</p>}
    </div>
  )
}

function IconButton({ label, d, onClick, disabled }: { label: string; d: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full text-faint transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
        <path d={d} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/** One portfolio category, or none. */
export function CategorySelect({ id, value, onChange }: { id?: string; value: string; onChange: (next: string) => void }) {
  const { categories } = useSite()
  return (
    <Select
      id={id}
      value={value}
      onChange={onChange}
      options={[{ value: '', label: 'Any category' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
    />
  )
}

/** One session type. Empty means the session the page belongs to. */
export function SessionSelect({ id, value, onChange }: { id?: string; value: string; onChange: (next: string) => void }) {
  const { sessions } = useSite()
  return (
    <Select
      id={id}
      value={value}
      onChange={onChange}
      options={[{ value: '', label: 'Choose a session…' }, ...sessions.map((s) => ({ value: s.id, label: s.title }))]}
    />
  )
}

/** One guide, by slug. */
export function GuideSelect({ id, value, onChange }: { id?: string; value: string; onChange: (next: string) => void }) {
  const { guides } = useSite()
  return (
    <Select
      id={id}
      value={value}
      onChange={onChange}
      options={[{ value: '', label: 'Choose a guide…' }, ...guides.map((g) => ({ value: g.slug, label: g.title }))]}
    />
  )
}
