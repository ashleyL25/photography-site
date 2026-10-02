import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { swatchVar } from '@/lib/format'
import { AdminHeader } from './AdminLayout'
import { useToast } from './ui/Toast'
import { HoldIconButton } from './ui/HoldConfirm'
import { EmptyState, Label, Panel, Select, SwatchField, TextArea, TextInput } from './ui/controls'
import { Overlay } from './ui/Overlay'
import type { Term, TermScope } from '@shared/types'

/**
 * Categories and tags, for the blog or for the portfolio.
 *
 * One screen serving both, distinguished by `scope`. The split between the two
 * kinds is the conventional one and worth stating: a **category** is where a
 * piece belongs — one of them, chosen from a short list — and a **tag** is what
 * it is about, of which there can be several.
 *
 * Each term carries a color from the brand palette rather than a free hex, so
 * the badges across the site stay in the palette and re-theming recolors them
 * all at once.
 */
export default function TaxonomyPage({ scope }: { scope: TermScope }) {
  const notify = useToast()
  const { refresh } = useSite()

  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Term | null>(null)
  const [merging, setMerging] = useState<Term | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ terms: Term[] }>(`/admin/terms/${scope}`)
      setTerms(data.terms)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load', 'error')
    } finally {
      setLoading(false)
    }
  }, [scope, notify])

  useEffect(() => {
    void load()
  }, [load])

  async function create(kind: 'category' | 'tag', name: string, swatch: string) {
    try {
      await api.post(`/admin/terms/${scope}`, { kind, name, swatch })
      await load()
      void refresh()
      notify(`“${name}” added`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add', 'error')
    }
  }

  async function update(term: Term, patch: Partial<Term>) {
    try {
      await api.patch(`/admin/terms/${scope}/${term.id}`, patch)
      await load()
      void refresh()
      setEditing(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
    }
  }

  async function remove(term: Term) {
    try {
      await api.del(`/admin/terms/${scope}/${term.id}`)
      await load()
      void refresh()
      notify(`“${term.name}” removed`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not remove', 'error')
    }
  }

  async function merge(from: Term, intoId: string) {
    try {
      await api.post(`/admin/terms/${scope}/${from.id}/merge`, { intoId })
      await load()
      void refresh()
      setMerging(null)
      notify('Merged')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not merge', 'error')
    }
  }

  const categories = terms.filter((t) => t.kind === 'category')
  const tags = terms.filter((t) => t.kind === 'tag')
  const label = scope === 'post' ? 'blog' : 'portfolio'

  return (
    <>
      <AdminHeader
        title={scope === 'post' ? 'Categories & tags' : 'Portfolio categories'}
        description={
          scope === 'post'
            ? `How ${label} posts are filed. A category is where something belongs; tags are what it is about.`
            : 'The filters across the top of the portfolio. Each album sits in one, and a session shows the albums in its category as “sessions like yours”. The order here is the order of the filters.'
        }
        back={{
          to: scope === 'post' ? '/dashboard/blog' : '/dashboard/albums',
          label: scope === 'post' ? 'All posts' : 'All albums',
        }}
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-2">
        <TermColumn
          kind="category"
          title="Categories"
          description={
            scope === 'post'
              ? 'One per post. Keep the list short — this is the top-level filter on the journal page.'
              : 'Seniors, Engagements, Families… Only categories with a published album appear on the site.'
          }
          terms={categories}
          loading={loading}
          onCreate={(name, swatch) => create('category', name, swatch)}
          onEdit={setEditing}
          onMerge={setMerging}
          onRemove={remove}
        />

        {scope === 'post' && (
        <TermColumn
          kind="tag"
          title="Tags"
          description="As many as are useful. Good for cross-cutting themes that do not deserve a category."
          terms={tags}
          loading={loading}
          onCreate={(name, swatch) => create('tag', name, swatch)}
          onEdit={setEditing}
          onMerge={setMerging}
          onRemove={remove}
        />
        )}
      </div>

      {editing && (
        <EditDialog
          term={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => update(editing, patch)}
        />
      )}

      {merging && (
        <MergeDialog
          term={merging}
          options={terms.filter((t) => t.kind === merging.kind && t.id !== merging.id)}
          onClose={() => setMerging(null)}
          onMerge={(intoId) => merge(merging, intoId)}
        />
      )}
    </>
  )
}

function TermColumn({
  kind,
  title,
  description,
  terms,
  loading,
  onCreate,
  onEdit,
  onMerge,
  onRemove,
}: {
  kind: 'category' | 'tag'
  title: string
  description: string
  terms: Term[]
  loading: boolean
  onCreate: (name: string, swatch: string) => void
  onEdit: (term: Term) => void
  onMerge: (term: Term) => void
  onRemove: (term: Term) => void
}) {
  const [name, setName] = useState('')
  const [swatch, setSwatch] = useState(kind === 'category' ? 'green' : 'gilt')

  return (
    <Panel title={title} description={description}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          onCreate(name.trim(), swatch)
          setName('')
        }}
        className="mb-6 space-y-4 rounded-[3px] border border-line bg-canvas p-4"
      >
        <div>
          <Label htmlFor={`new-${kind}`}>Add a {kind}</Label>
          <TextInput
            id={`new-${kind}`}
            value={name}
            onChange={setName}
            placeholder={kind === 'category' ? 'Craft, Reviews, Teaching…' : 'fiction, editing, UNI…'}
          />
        </div>

        <div>
          <Label>Color</Label>
          <SwatchField value={swatch} onChange={setSwatch} />
        </div>

        <button type="submit" disabled={!name.trim()} className="btn btn-secondary py-2.5 text-[0.62rem] disabled:opacity-40">
          Add
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-[3px] bg-ink/[0.04]" />
          ))}
        </div>
      ) : terms.length === 0 ? (
        <EmptyState title={`No ${kind === 'category' ? 'categories' : 'tags'} yet`} />
      ) : (
        <ul className="divide-y divide-line">
          {terms.map((term) => (
            <li key={term.id} className="group flex items-center gap-3 py-3">
              <span
                className="size-3 shrink-0 rotate-45"
                style={{ background: swatchVar(term.swatch) }}
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{term.name}</span>
                <span className="block truncate font-mono text-xs text-faint">{term.slug}</span>
              </span>

              {typeof term.count === 'number' && (
                <span className="label shrink-0 text-faint">{term.count}</span>
              )}

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(term)}
                  className="label px-2 py-2 text-faint transition-colors hover:text-gilt"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onMerge(term)}
                  className="label px-2 py-2 text-faint transition-colors hover:text-gilt"
                >
                  Merge
                </button>
                <HoldIconButton label={`Delete ${term.name}`} onConfirm={() => onRemove(term)}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                    <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </HoldIconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function EditDialog({
  term,
  onClose,
  onSave,
}: {
  term: Term
  onClose: () => void
  onSave: (patch: Partial<Term>) => void
}) {
  const [name, setName] = useState(term.name)
  const [slug, setSlug] = useState(term.slug)
  const [description, setDescription] = useState(term.description ?? '')
  const [swatch, setSwatch] = useState(term.swatch)

  return (
    <Dialog title={`Edit “${term.name}”`} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="term-name">Name</Label>
          <TextInput id="term-name" value={name} onChange={setName} />
        </div>

        <div>
          <Label htmlFor="term-slug" help="Appears in the URL when this is used as a filter.">
            Slug
          </Label>
          <TextInput id="term-slug" value={slug} onChange={setSlug} />
        </div>

        <div>
          <Label htmlFor="term-desc" help="Optional. Shown on the filtered listing page.">
            Description
          </Label>
          <TextArea id="term-desc" value={description} onChange={setDescription} rows={2} />
        </div>

        <div>
          <Label>Color</Label>
          <SwatchField value={swatch} onChange={setSwatch} />
        </div>
      </div>

      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="label px-3 py-2 text-faint hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave({ name, slug, description, swatch })}
          className="btn btn-primary py-3 text-[0.62rem]"
        >
          Save
        </button>
      </div>
    </Dialog>
  )
}

function MergeDialog({
  term,
  options,
  onClose,
  onMerge,
}: {
  term: Term
  options: Term[]
  onClose: () => void
  onMerge: (intoId: string) => void
}) {
  const [target, setTarget] = useState(options[0]?.id ?? '')

  return (
    <Dialog title={`Merge “${term.name}”`} onClose={onClose}>
      {options.length === 0 ? (
        <p className="text-sm text-faint">There is nothing else of the same kind to merge into.</p>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted">
            Everything filed under <strong className="text-ink">{term.name}</strong> moves to the
            term you choose, and <strong className="text-ink">{term.name}</strong> is removed. No
            posts or albums are deleted.
          </p>

          <Label>Merge into</Label>
          <Select
            value={target}
            onChange={setTarget}
            options={options.map((o) => ({ value: o.id, label: o.name }))}
          />

          <div className="mt-7 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="label px-3 py-2 text-faint hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onMerge(target)}
              className="btn btn-primary py-3 text-[0.62rem]"
            >
              Merge
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Overlay className="z-[10070] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-canvas/88 backdrop-blur-md"
      />
      <div className={clsx('relative w-full max-w-md rounded-[var(--card-radius)] border border-line bg-surface p-7')}>
        <h2 className="display mb-6 text-xl">{title}</h2>
        {children}
      </div>
    </Overlay>
  )
}
