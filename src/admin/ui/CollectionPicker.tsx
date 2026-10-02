import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { normalizeSource, type CollectionSource } from '@shared/widgets'
import { Label, MultiChoice, NumberField, Segmented, Select, Switch, TextInput } from './controls'
import type { Post } from '@shared/types'

/**
 * Choosing what a collection widget shows.
 *
 * Two modes, and the split matters. **Dynamic** keeps a section current on its
 * own — new work in a category appears without anybody editing the homepage,
 * which is the difference between a site that stays alive and one that quietly
 * goes stale. **Manual** is for the places where the order is the argument: the
 * three pieces Ashley wants an editor to see first, in that order.
 *
 * Both are in one control rather than two widgets, because switching between
 * them is a change of mind about one section and not a change of section.
 */
export function CollectionPicker({
  value,
  onChange,
}: {
  value: unknown
  onChange: (next: CollectionSource) => void
}) {
  const source = normalizeSource(value)
  const { terms } = useSite()

  const scoped = terms.post
  const categories = scoped.filter((t) => t.kind === 'category')
  const tags = scoped.filter((t) => t.kind === 'tag')

  function set<K extends keyof CollectionSource>(key: K, next: CollectionSource[K]) {
    onChange({ ...source, [key]: next })
  }

  return (
    <div className="space-y-6 rounded-[3px] border border-line bg-canvas p-5">
      <Segmented
        value={source.mode}
        onChange={(mode) => set('mode', mode as CollectionSource['mode'])}
        options={[
          { value: 'dynamic', label: 'Pull in automatically' },
          { value: 'manual', label: 'Pick by hand' },
        ]}
      />

      {source.mode === 'dynamic' ? (
        <div className="space-y-6">

          {categories.length > 0 && (
            <div>
              <Label help="Leave all unticked for every category.">Categories</Label>
              <MultiChoice
                value={source.categories}
                onChange={(next) => set('categories', next)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <MultiChoice
                value={source.tags}
                onChange={(next) => set('tags', next)}
                options={tags.map((t) => ({ value: t.id, label: t.name }))}
              />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Order</Label>
              <Select
                value={source.order}
                onChange={(order) => set('order', order as CollectionSource['order'])}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'title', label: 'Title A–Z' },
                  { value: 'random', label: 'Random' },
                ]}
              />
            </div>

            <div>
              <Label>How many</Label>
              <NumberField
                value={source.limit}
                onChange={(limit) => set('limit', limit)}
                min={1}
                max={24}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label help="Only items published on or after this date.">From</Label>
              <TextInput
                type="date"
                value={source.dateFrom}
                onChange={(dateFrom) => set('dateFrom', dateFrom)}
              />
            </div>
            <div>
              <Label>Until</Label>
              <TextInput
                type="date"
                value={source.dateTo}
                onChange={(dateTo) => set('dateTo', dateTo)}
              />
            </div>
          </div>

          <Switch
            checked={source.featuredOnly}
            onChange={(featuredOnly) => set('featuredOnly', featuredOnly)}
            label="Only featured items"
          />
        </div>
      ) : (
        <ManualPicker
          selected={source.items}
          onChange={(items) => set('items', items)}
        />
      )}
    </div>
  )
}

/**
 * The hand-picked list.
 *
 * Order is the whole point, so the selected items are shown as an ordered list
 * with move controls rather than as ticked checkboxes — a checkbox list cannot
 * express "this one first" and would make the order an accident of when each was
 * clicked.
 */
function ManualPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (items: string[]) => void
}) {
  const [available, setAvailable] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const path = '/admin/posts?limit=100'
    api
      .get<{ items: Post[] }>(path)
      .then((data) => setAvailable(data.items))
      .catch(() => setAvailable([]))
      .finally(() => setLoading(false))
  }, [])

  const byId = new Map(available.map((item) => [item.id, item]))
  const chosen = selected.map((id) => byId.get(id)).filter((i): i is Post => Boolean(i))

  const matches = available.filter(
    (item) => !selected.includes(item.id) && item.title.toLowerCase().includes(search.toLowerCase()),
  )

  function move(index: number, delta: number) {
    const next = [...selected]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  if (loading) return <p className="text-xs text-faint">Loading…</p>

  return (
    <div className="space-y-5">
      <div>
        <Label>Chosen, in order</Label>
        {chosen.length === 0 ? (
          <p className="rounded-[3px] border border-dashed border-line px-4 py-6 text-center text-xs text-faint">
            Nothing picked yet
          </p>
        ) : (
          <ol className="space-y-1.5">
            {chosen.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-[3px] border border-line bg-surface px-3 py-2"
              >
                <span className="label w-6 shrink-0 text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>

                {item.status === 'draft' && (
                  // A draft picked here will not appear on the live page, and
                  // saying so beats leaving a gap nobody can explain.
                  <span className="label shrink-0 text-accent">Draft</span>
                )}

                <div className="flex shrink-0 items-center">
                  <IconButton onClick={() => move(i, -1)} disabled={i === 0} label="Move up">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="m6 15 6-6 6 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                  <IconButton
                    onClick={() => move(i, 1)}
                    disabled={i === chosen.length - 1}
                    label="Move down"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="m6 9 6 6 6-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                  <IconButton
                    onClick={() => onChange(selected.filter((id) => id !== item.id))}
                    label="Remove"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </IconButton>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <Label>Add</Label>
        <TextInput value={search} onChange={setSearch} placeholder="Search by title…" />

        <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
          {matches.slice(0, 40).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange([...selected, item.id])}
              className="flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.status === 'draft' && <span className="label shrink-0 text-faint">Draft</span>}
            </button>
          ))}

          {matches.length === 0 && (
            <p className="px-3 py-2 text-xs text-faint">Nothing else matches.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        'grid size-8 place-items-center text-faint transition-colors hover:text-gilt',
        disabled && 'cursor-not-allowed opacity-30 hover:text-faint',
      )}
    >
      {children}
    </button>
  )
}
