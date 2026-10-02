import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { HoldConfirm } from './HoldConfirm'
import { formatRelative } from '@/lib/format'
import type { ContentStatus } from '@shared/types'

/**
 * The frame around every editor — pages, posts, portfolio pieces.
 *
 * One bar across the top carrying everything that is true of the thing being
 * edited: what it is called, whether it is live, whether there are unsaved
 * changes, and the two or three actions that change any of that.
 *
 * Saving and publishing are separate, deliberately. Save is cheap, reversible
 * and happens constantly; publish changes what the world sees. Collapsing them
 * into one button is how people end up publishing a half-written draft because
 * they wanted to stop for lunch.
 */
export function EditorShell({
  back,
  title,
  onTitleChange,
  titlePlaceholder = 'Untitled',
  status,
  dirty,
  saving,
  publishing,
  updatedAt,
  publicPath,
  tabs,
  activeTab,
  onTab,
  onSave,
  onPublish,
  onUnpublish,
  extraActions,
  children,
}: {
  back: { to: string; label: string }
  title: string
  onTitleChange: (title: string) => void
  titlePlaceholder?: string
  status: ContentStatus
  dirty: boolean
  saving: boolean
  publishing: boolean
  updatedAt?: number
  publicPath?: string
  tabs: { key: string; label: string }[]
  activeTab: string
  onTab: (key: string) => void
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  extraActions?: ReactNode
  children: ReactNode
}) {
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  /**
   * Publishes this bar's height as `--editor-header`.
   *
   * Anything else in an editor that pins to the top of the viewport has to clear
   * this bar, or it pins underneath it and is covered — which is what happened to
   * the section panel's own header and its Content/Style tabs. Measured rather
   * than written down as a number, because the height is not fixed: a title that
   * wraps to a second line grows it, and the tab row is only present on some
   * editors.
   */
  useLayoutEffect(() => {
    const root = rootRef.current
    const header = headerRef.current
    if (!root || !header) return

    const publish = () => {
      const { height } = header.getBoundingClientRect()
      root.style.setProperty('--editor-header', `${Math.round(height)}px`)
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  // The title grows with its content rather than scrolling inside a fixed box —
  // a long title is common and a two-line title should be readable.
  useEffect(() => {
    const node = titleRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [title])

  /**
   * Cmd/Ctrl-S saves.
   *
   * Muscle memory from every other editor, and without it the browser's own Save
   * Page dialog appears — which is both useless and alarming mid-draft.
   */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty && !saving) onSave()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [dirty, saving, onSave])

  /**
   * The browser's own "leave site?" prompt, when there is unsaved work.
   *
   * Crude and unstyleable, and the only thing that can interrupt a tab close.
   * Registered only while dirty, so it never fires on a page that is saved.
   */
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    addEventListener('beforeunload', onBeforeUnload)
    return () => removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col">
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-lg"
      >
        <div className="flex flex-wrap items-start gap-4 px-5 py-4 md:px-8">
          <div className="min-w-0 flex-1">
            <Link
              to={back.to}
              className="label group inline-flex items-center gap-2 text-faint transition-colors hover:text-gilt"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor">
                <path d="M15 5 8 12l7 7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {back.label}
            </Link>

            <textarea
              ref={titleRef}
              value={title}
              rows={1}
              onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ''))}
              placeholder={titlePlaceholder}
              aria-label="Title"
              className="display mt-2 w-full resize-none bg-transparent text-2xl leading-tight outline-none placeholder:text-faint/50 md:text-3xl"
            />

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusBadge status={status} />

              {dirty ? (
                <span className="text-xs text-accent">Unsaved changes</span>
              ) : updatedAt ? (
                <span className="text-xs text-faint">Saved {formatRelative(updatedAt)}</span>
              ) : null}

              {status === 'published' && publicPath && (
                <a
                  href={publicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label text-faint transition-colors hover:text-gilt"
                >
                  View live
                </a>
              )}

              {extraActions}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty || saving}
              className={clsx(
                'btn btn-secondary py-3 text-[0.62rem]',
                (!dirty || saving) && 'cursor-not-allowed opacity-40',
              )}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

            {status === 'published' ? (
              <>
                <HoldConfirm
                  label="Update"
                  holdingLabel="Hold to update"
                  onConfirm={onPublish}
                  busy={publishing}
                  className="py-3 text-[0.62rem]"
                />
                <HoldConfirm
                  label="Unpublish"
                  holdingLabel="Hold to unpublish"
                  variant="danger"
                  onConfirm={onUnpublish}
                  busy={publishing}
                  className="py-3 text-[0.62rem]"
                />
              </>
            ) : (
              <HoldConfirm
                label="Publish"
                holdingLabel="Hold to publish"
                onConfirm={onPublish}
                busy={publishing}
                className="py-3 text-[0.62rem]"
              />
            )}
          </div>
        </div>

        {tabs.length > 1 && (
          <nav className="flex gap-1 px-5 md:px-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={clsx(
                  'relative px-4 py-3 text-sm transition-colors',
                  activeTab === tab.key ? 'text-gilt' : 'text-muted hover:text-ink',
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="editor-tab"
                    className="absolute inset-x-2 bottom-0 h-px bg-gilt"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={clsx(
        'label inline-flex items-center gap-2',
        status === 'published' ? 'text-gilt' : 'text-faint',
      )}
    >
      <span
        className={clsx(
          'inline-block size-1.5 rounded-full',
          status === 'published' ? 'bg-gilt' : 'bg-faint',
        )}
      />
      {status === 'published' ? 'Live' : 'Draft'}
    </span>
  )
}

/** The settings tab's column layout: a main column and a narrower sidebar. */
export function SettingsGrid({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">{main}</div>
      <div className="space-y-6">{side}</div>
    </div>
  )
}
