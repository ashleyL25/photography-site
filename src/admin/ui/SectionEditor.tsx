import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import {
  STYLE_FIELDS,
  getWidget,
  widgetCategories,
  widgetDefaults,
  type WidgetHost,
} from '@shared/widgets'
import type { HostValue } from '@/widgets/types'
import { PreviewPane } from '../preview/PreviewPane'
import { usePhotoLookup } from '../photos'
import { FieldList } from './Fields'
import { WidgetIcon } from './WidgetIcon'
import { EmptyState } from './controls'
import { Overlay } from './Overlay'
import type { Section } from '@shared/types'

/**
 * The page builder.
 *
 * Laid out like HubSpot's: a working panel on the left, the real page on the
 * right. The preview is not a mock — it renders the same widget components the
 * public site does, from the same data — so "what it looks like" is never a
 * question the editor can get wrong.
 *
 * The panel has two states rather than two panes. Showing the section list and
 * the selected section's fields at once would leave both of them cramped, and
 * moving between them is a click either way.
 *
 * Sections are held in the parent's state and saved as one list (see
 * `replaceSections` on the server). Nothing here writes to the API; it hands the
 * whole array back on every change, which is what makes the parent's dirty check
 * a single object comparison.
 */
export function SectionEditor({
  host,
  hostValue,
  sections,
  onChange,
}: {
  host: WidgetHost
  /** The session or guide being edited, so its widgets preview with its data. */
  hostValue?: HostValue
  sections: Section[]
  onChange: (sections: Section[]) => void
}) {
  usePhotoLookup(sections)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState<'content' | 'style'>('content')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')

  const selected = sections.find((s) => s.id === selectedId) ?? null

  function update(id: string, patch: Partial<Section>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((s, i) => ({ ...s, position: i })))
  }

  function add(type: string, atIndex?: number) {
    const defaults = widgetDefaults(type)
    const section: Section = {
      /**
       * A temporary id, replaced by the server's UUID on save.
       *
       * Prefixed so `replaceSections` can tell a new section from an existing
       * one — it matches on ids it already holds, and a client-minted id must
       * never collide with a real one.
       */
      id: `new-${crypto.randomUUID()}`,
      type,
      position: atIndex ?? sections.length,
      hidden: false,
      content: defaults.content,
      styles: defaults.styles,
    }

    const next = [...sections]
    next.splice(atIndex ?? sections.length, 0, section)
    onChange(next.map((s, i) => ({ ...s, position: i })))

    setSelectedId(section.id)
    setTab('content')
    setAdding(false)
  }

  function duplicate(section: Section) {
    const index = sections.findIndex((s) => s.id === section.id)
    const copy: Section = {
      ...section,
      id: `new-${crypto.randomUUID()}`,
      // Structured clone, not a spread: content holds nested groups and repeater
      // arrays, and a shallow copy would leave the duplicate sharing them.
      content: structuredClone(section.content),
      styles: structuredClone(section.styles),
    }
    const next = [...sections]
    next.splice(index + 1, 0, copy)
    onChange(next.map((s, i) => ({ ...s, position: i })))
    setSelectedId(copy.id)
  }

  function remove(id: string) {
    onChange(sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i })))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    /**
     * Two columns that scroll independently.
     *
     * `items-start` is what makes it work: a flex row stretches its children to
     * the tallest one by default, and a stretched child can never be sticky —
     * its box already spans the whole scroll range, so there is nothing for
     * sticky to pin. Given an explicit height instead, the panel pins to the top
     * of the viewport and the preview runs past it.
     *
     * Before this, choosing a section near the foot of a long page meant
     * scrolling all the way back up to find the editor that had just opened.
     */
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-start">
      {/* ------------------------------------------------------ Panel */}
      <div className="editor-panel flex w-full shrink-0 flex-col border-line bg-surface lg:w-[26rem] lg:border-r xl:w-[30rem]">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <SectionPanel
                section={selected}
                host={host}
                tab={tab}
                onTab={setTab}
                onBack={() => setSelectedId(null)}
                onChange={(patch) => update(selected.id, patch)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <SectionList
                sections={sections}
                onSelect={(id) => {
                  setSelectedId(id)
                  setTab('content')
                }}
                onMove={move}
                onToggleHidden={(section) => update(section.id, { hidden: !section.hidden })}
                onDuplicate={duplicate}
                onRemove={remove}
                onAdd={() => setAdding(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------ Preview */}
      {/**
        * The page, in a frame of its own at a true width — see PreviewPane. The
        * column is pinned below the editor's bar and as tall as what is left,
        * so the page scrolls inside the frame the way it would in a browser.
        */}
      <div className="editor-sticky flex min-w-0 flex-1 flex-col bg-canvas lg:sticky lg:h-[calc(100dvh-var(--editor-header,0px))]">
        <div className="flex shrink-0 items-center gap-4 border-b border-line bg-canvas px-5 py-2.5">
          <span className="label text-faint">Preview</span>

          <div className="ml-auto flex items-center gap-1">
            <ViewportButton
              active={viewport === 'desktop'}
              onClick={() => setViewport('desktop')}
              label="Desktop"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <rect x="2" y="4" width="20" height="13" rx="1.5" strokeWidth="1.3" />
                <path d="M9 20h6" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </ViewportButton>
            <ViewportButton
              active={viewport === 'mobile'}
              onClick={() => setViewport('mobile')}
              label="Phone"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="1.3" />
                <path d="M11 18.5h2" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </ViewportButton>
          </div>
        </div>

        <div className="relative h-[78vh] min-h-0 lg:h-auto lg:flex-1">
          {sections.length === 0 ? (
            <div className="px-6 py-24">
              <EmptyState
                title="Nothing here yet"
                body="Add a section to start building this page."
                action={
                  <button type="button" onClick={() => setAdding(true)} className="btn btn-primary mt-2">
                    Add a section
                  </button>
                }
              />
            </div>
          ) : (
            <PreviewPane
              sections={sections}
              host={hostValue ?? { kind: 'page' }}
              selectedId={selectedId}
              viewport={viewport}
              onSelect={(id) => {
                setSelectedId(id)
                setTab('content')
              }}
            />
          )}
        </div>
      </div>

      <WidgetPicker
        open={adding}
        host={host}
        onClose={() => setAdding(false)}
        onPick={(type) => add(type)}
      />
    </div>
  )
}

function ViewportButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={clsx(
        'grid size-9 place-items-center rounded-[3px] transition-colors',
        active ? 'bg-ink/5 text-gilt' : 'text-faint hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * The list
 * ------------------------------------------------------------------ */

function SectionList({
  sections,
  onSelect,
  onMove,
  onToggleHidden,
  onDuplicate,
  onRemove,
  onAdd,
}: {
  sections: Section[]
  onSelect: (id: string) => void
  onMove: (index: number, delta: number) => void
  onToggleHidden: (section: Section) => void
  onDuplicate: (section: Section) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <h2 className="display text-lg">Sections</h2>
        <span className="label text-faint">{sections.length}</span>
        <button type="button" onClick={onAdd} className="btn btn-primary ml-auto py-2.5 text-[0.62rem]">
          Add section
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <EmptyState title="No sections yet" body="Add one to start building." />
        ) : (
          <ul className="space-y-2">
            {sections.map((section, index) => {
              const def = getWidget(section.type)
              return (
                <li
                  key={section.id}
                  className={clsx(
                    'group rounded-[3px] border border-line bg-canvas transition-colors hover:border-gilt/50',
                    section.hidden && 'opacity-55',
                  )}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onSelect(section.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="shrink-0 text-faint group-hover:text-gilt">
                        <WidgetIcon type={def?.icon ?? 'text'} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{def?.label ?? section.type}</span>
                        <span className="block truncate text-xs text-faint">
                          {sectionSummary(section) || def?.description}
                        </span>
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <SmallButton
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        label="Move up"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <path d="m6 15 6-6 6 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SmallButton>
                      <SmallButton
                        onClick={() => onMove(index, 1)}
                        disabled={index === sections.length - 1}
                        label="Move down"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <path d="m6 9 6 6 6-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SmallButton>
                      <SmallButton
                        onClick={() => onToggleHidden(section)}
                        label={section.hidden ? 'Show on the site' : 'Hide from the site'}
                        active={section.hidden}
                      >
                        {section.hidden ? <EyeOff /> : <Eye />}
                      </SmallButton>
                      <SmallButton onClick={() => onDuplicate(section)} label="Duplicate">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <rect x="8" y="8" width="12" height="12" rx="1.5" strokeWidth="1.4" />
                          <path d="M16 5H5.5A1.5 1.5 0 0 0 4 6.5V17" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </SmallButton>
                      <SmallButton onClick={() => onRemove(section.id)} label="Remove" danger>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </SmallButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

/** The first bit of real text in a section, for its row in the list. */
function sectionSummary(section: Section): string {
  for (const key of ['heading', 'title', 'quote', 'eyebrow', 'items', 'body']) {
    const value = section.content[key]
    if (typeof value === 'string' && value.trim()) {
      const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text) return text.length > 52 ? `${text.slice(0, 52)}…` : text
    }
  }
  return ''
}

function SmallButton({
  onClick,
  disabled,
  label,
  children,
  danger,
  active,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
  danger?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={clsx(
        'grid size-7 place-items-center transition-colors',
        active ? 'text-gilt' : 'text-faint',
        danger ? 'hover:text-accent' : 'hover:text-gilt',
        disabled && 'cursor-not-allowed opacity-25 hover:text-faint',
      )}
    >
      {children}
    </button>
  )
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" strokeWidth="1.3" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
      <path d="M2 12s4-6 10-6c1.6 0 3 .4 4.3 1M22 12s-4 6-10 6c-1.6 0-3-.4-4.3-1" strokeWidth="1.3" strokeLinecap="round" />
      <path d="m3 3 18 18" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * The section's own fields
 * ------------------------------------------------------------------ */

function SectionPanel({
  section,
  host,
  tab,
  onTab,
  onBack,
  onChange,
}: {
  section: Section
  host: WidgetHost
  tab: 'content' | 'style'
  onTab: (tab: 'content' | 'style') => void
  onBack: () => void
  onChange: (patch: Partial<Section>) => void
}) {
  const def = getWidget(section.type)

  /**
   * Which content type this widget's collection picker reads from.
   *
   * Derived from the widget rather than from the host: a blog post can carry a
   * portfolio grid, so "what is being edited" and "what is being listed" are
   * genuinely different questions.
   */
  const collectionKind = 'post' as const

  if (!def) {
    return (
      <div className="p-6">
        <p className="text-sm text-accent">
          This section uses a widget that no longer exists ({section.type}). Remove it to tidy up.
        </p>
      </div>
    )
  }

  return (
    <>
      <header className="border-b border-line px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="label group mb-3 inline-flex items-center gap-2 text-faint transition-colors hover:text-gilt"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor">
            <path d="M15 5 8 12l7 7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All sections
        </button>

        <div className="flex items-center gap-3">
          <span className="text-gilt">
            <WidgetIcon type={def.icon} />
          </span>
          <h2 className="display min-w-0 flex-1 truncate text-lg">{def.label}</h2>

          <button
            type="button"
            onClick={() => onChange({ hidden: !section.hidden })}
            className={clsx(
              'label transition-colors',
              section.hidden ? 'text-gilt' : 'text-faint hover:text-gilt',
            )}
          >
            {section.hidden ? 'Hidden' : 'Visible'}
          </button>
        </div>

        <div className="mt-4 flex rounded-[3px] border border-line bg-canvas p-1">
          {(['content', 'style'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onTab(key)}
              aria-pressed={tab === key}
              className={clsx(
                'relative flex-1 rounded-[2px] px-3 py-1.5 text-xs capitalize transition-colors',
                tab === key ? 'text-canvas' : 'text-muted hover:text-ink',
              )}
            >
              {tab === key && (
                <motion.span
                  layoutId="section-tab"
                  className="absolute inset-0 rounded-[2px] bg-gilt"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className="relative">{key}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === 'content' ? (
          <FieldList
            fields={def.fields}
            values={section.content}
            onChange={(content) => onChange({ content })}
            collectionKind={collectionKind}
          />
        ) : (
          <FieldList
            fields={STYLE_FIELDS}
            values={section.styles}
            onChange={(styles) => onChange({ styles })}
            collectionKind={collectionKind}
          />
        )}

        <p className="mt-8 border-t border-line pt-4 text-xs text-faint">
          {host === 'page' ? 'Page' : host === 'post' ? 'Post' : 'Portfolio'} section ·{' '}
          {def.description}
        </p>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * The picker
 * ------------------------------------------------------------------ */

function WidgetPicker({
  open,
  host,
  onClose,
  onPick,
}: {
  open: boolean
  host: WidgetHost
  onClose: () => void
  onPick: (type: string) => void
}) {
  const [search, setSearch] = useState('')
  const groups = useMemo(() => widgetCategories(host), [host])

  if (!open) return null

  const query = search.trim().toLowerCase()
  const filtered = groups
    .map((group) => ({
      ...group,
      widgets: group.widgets.filter(
        (w) =>
          !query ||
          w.label.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query),
      ),
    }))
    .filter((group) => group.widgets.length > 0)

  return (
    <AnimatePresence>
      <Overlay className="z-[10070] flex items-center justify-center p-4 md:p-10">
        <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-canvas/88 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative flex h-full max-h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--card-radius)] border border-line bg-surface"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="flex items-center gap-4 border-b border-line px-6 py-4">
            <h2 className="display text-lg">Add a section</h2>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="ml-auto w-48 rounded-[3px] border border-line bg-canvas px-3 py-1.5 text-xs outline-none focus:border-gilt"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center text-faint transition-colors hover:text-gilt"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-faint">Nothing matches “{search}”.</p>
            )}

            {filtered.map((group) => (
              <div key={group.name} className="mb-9">
                <p className="label mb-4 text-faint">{group.name}</p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.widgets.map((widget) => (
                    <button
                      key={widget.type}
                      type="button"
                      onClick={() => onPick(widget.type)}
                      className="group flex flex-col gap-3 rounded-[3px] border border-line bg-canvas p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gilt"
                    >
                      <span className="text-faint transition-colors group-hover:text-gilt">
                        <WidgetIcon type={widget.icon} className="h-6 w-6" />
                      </span>
                      <span className="text-sm">{widget.label}</span>
                      <span className="text-xs leading-relaxed text-faint">{widget.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Overlay>
    </AnimatePresence>
  )
}
