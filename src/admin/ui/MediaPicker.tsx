import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { api, qs } from '@/lib/api'
import { uploadPhoto } from '../upload'
import { registerItem, thumbOf } from '../photos'
import { formatBytes, formatRelative } from '@/lib/format'
import { useDebounced, useEscape, useScrollLock } from '@/admin/hooks'
import { useToast } from './Toast'
import { EmptyState, Label, TextArea, TextInput, inputClass } from './controls'
import { HoldConfirm } from './HoldConfirm'
import { Overlay } from './Overlay'
import type { MediaItem } from '@shared/types'

type UploadStage = 'queued' | 'uploading' | 'done' | 'error'

interface UploadEntry {
  id: string
  name: string
  progress: number
  stage: UploadStage
  error?: string
}

/**
 * The media library, as a field and as a browser.
 *
 * One component for both because they are the same task seen from two places:
 * choosing a picture for a section, and tidying up the library. Keeping them
 * together means the upload path, the drag-and-drop target and the alt-text
 * field only exist once.
 */

/* ------------------------------------------------------------------ *
 * The field
 * ------------------------------------------------------------------ */

export function MediaField({
  value,
  onChange,
  kind = 'image',
  label,
}: {
  value: string
  onChange: (url: string) => void
  kind?: 'image' | 'file'
  label?: string
}) {
  const [browsing, setBrowsing] = useState(false)

  return (
    <>
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => setBrowsing(true)}
          className={clsx(
            'group relative shrink-0 overflow-hidden rounded-[3px] border transition-colors',
            value ? 'border-line' : 'border-dashed border-line hover:border-gilt',
            kind === 'image' ? 'h-24 w-24' : 'h-24 w-24',
          )}
          aria-label={value ? 'Replace this file' : 'Choose a file'}
        >
          {value && kind === 'image' ? (
            <img src={thumbOf(value)} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <span className="grid h-full w-full place-items-center bg-canvas">
              <FileIcon />
            </span>
          ) : (
            <span className="grid h-full w-full place-items-center bg-canvas text-faint">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
          )}

          <span className="absolute inset-0 grid place-items-center bg-canvas/80 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="label text-gilt">{value ? 'Change' : 'Choose'}</span>
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {/* The URL stays editable. An image hosted somewhere else — a
              publication's own CDN — is a legitimate thing to point at, and
              hiding the field behind the picker would make that impossible. */}
          <TextInput
            value={value}
            onChange={onChange}
            placeholder={label ?? 'Choose from the library, or paste a URL'}
            className="font-mono text-xs"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="label text-faint transition-colors hover:text-accent"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <MediaBrowser
        open={browsing}
        kind={kind}
        onClose={() => setBrowsing(false)}
        onPick={(item) => {
          registerItem(item)
          onChange(item.url)
          setBrowsing(false)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Several photographs, in order
 * ------------------------------------------------------------------ */

/**
 * An ordered set of photographs — an album's frames, a gallery's contents.
 *
 * Thumbnails in a grid, each with arrows to move it and a cross to drop it, and
 * an Add button that opens the library in multi-select so twenty frames are one
 * trip rather than twenty. The first one is marked, because in an album the
 * order is the story.
 */
export function MediaListField({
  value,
  onChange,
  firstLabel,
}: {
  value: string[]
  onChange: (urls: string[]) => void
  firstLabel?: string
}) {
  const [browsing, setBrowsing] = useState(false)

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-canvas">
            <img src={thumbOf(url)} alt="" loading="lazy" className="h-full w-full object-cover" />
            {i === 0 && firstLabel && (
              <span className="absolute top-1.5 left-1.5 rounded bg-gilt px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
                {firstLabel}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move earlier"
                  className="grid size-6 place-items-center rounded bg-white/90 text-[0.7rem] text-charcoal disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move later"
                  className="grid size-6 place-items-center rounded bg-white/90 text-[0.7rem] text-charcoal disabled:opacity-30"
                >
                  →
                </button>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="Remove"
                className="grid size-6 place-items-center rounded bg-white/90 text-[0.8rem] text-charcoal hover:text-accent"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setBrowsing(true)}
          className="grid aspect-square place-items-center rounded-md border border-dashed border-line text-faint transition-colors hover:border-gilt hover:text-gilt"
        >
          <span className="flex flex-col items-center gap-1 text-xs font-medium">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Add photos
          </span>
        </button>
      </div>
      {value.length > 0 && (
        <p className="mt-2 text-xs text-faint">
          {value.length} photograph{value.length === 1 ? '' : 's'} · hover one to reorder or remove it
        </p>
      )}

      <MediaBrowser
        open={browsing}
        kind="image"
        multiple
        onClose={() => setBrowsing(false)}
        onPickMany={(items) => {
          items.forEach(registerItem)
          const have = new Set(value)
          onChange([...value, ...items.map((i) => i.url).filter((u) => !have.has(u))])
          setBrowsing(false)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * The browser
 * ------------------------------------------------------------------ */

export function MediaBrowser({
  open,
  onClose,
  onPick,
  onPickMany,
  multiple = false,
  kind = 'image',
}: {
  open: boolean
  onClose: () => void
  onPick?: (item: MediaItem) => void
  onPickMany?: (items: MediaItem[]) => void
  multiple?: boolean
  kind?: 'image' | 'file' | 'all'
}) {
  useScrollLock(open)
  useEscape(onClose, open)

  if (!open) return null

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
          className="relative flex h-full max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--card-radius)] border border-line bg-surface"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <MediaLibrary kind={kind} onPick={onPick} onPickMany={multiple ? onPickMany : undefined} onClose={onClose} />
        </motion.div>
      </Overlay>
    </AnimatePresence>
  )
}

/**
 * The library itself — also mounted on its own dashboard page.
 *
 * `onPick` is what distinguishes the two uses: with it, clicking a tile chooses
 * that file and closes; without it, clicking selects it for editing its alt text
 * or deleting it.
 */
export function MediaLibrary({
  kind = 'all',
  onPick,
  onPickMany,
  onClose,
}: {
  kind?: 'image' | 'file' | 'all'
  onPick?: (item: MediaItem) => void
  /** Multi-select: tiles toggle, and a button hands back everything chosen. */
  onPickMany?: (items: MediaItem[]) => void
  onClose?: () => void
}) {
  const notify = useToast()
  const fileInput = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const [folder, setFolder] = useState('')
  const [folders, setFolders] = useState<{ name: string; count: number }[]>([])
  const [picked, setPicked] = useState<MediaItem[]>([])
  const picking = Boolean(onPick || onPickMany)

  const debounced = useDebounced(search, 250)

  useEffect(() => {
    api
      .get<{ folders: { name: string; count: number }[] }>('/admin/media/folders')
      .then((data) => setFolders(data.folders))
      .catch(() => setFolders([]))
  }, [uploads.length])

  function choose(item: MediaItem) {
    if (onPickMany) {
      setPicked((current) =>
        current.some((p) => p.id === item.id) ? current.filter((p) => p.id !== item.id) : [...current, item],
      )
    } else if (onPick) onPick(item)
    else setSelected(item)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: MediaItem[]; total: number }>(
        `/admin/media${qs({ search: debounced, kind: kind === 'all' ? '' : kind, folder, limit: 120 })}`,
      )
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load the library', 'error')
    } finally {
      setLoading(false)
    }
  }, [debounced, kind, folder, notify])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const data = await api.get<{ items: MediaItem[]; total: number }>(
        `/admin/media${qs({
          search: debounced,
          kind: kind === 'all' ? '' : kind,
          folder,
          limit: 120,
          offset: items.length,
        })}`,
      )
      setItems((current) => [...current, ...data.items])
      setTotal(data.total)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load more files', 'error')
    } finally {
      setLoadingMore(false)
    }
  }, [debounced, items.length, kind, folder, notify])

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return

      setUploads(
        list.map((f, index) => ({
          id: `${Date.now()}-${index}-${f.name}`,
          name: f.name,
          progress: 0,
          stage: 'queued',
        })),
      )

      const succeeded = new Set<number>()
      let cursor = 0
      // Two at a time: each one decodes a full-size original in a worker, and a
      // 24-megapixel frame is a lot of memory to hold three of at once.
      const workers = Array.from({ length: Math.min(2, list.length) }, async () => {
        while (cursor < list.length) {
          const index = cursor++
          const file = list[index]
          setUploads((current) =>
            current.map((u, i) => (i === index ? { ...u, stage: 'uploading' } : u)),
          )
          try {
            await uploadPhoto(file, {
              folder,
              onProgress: (fraction) =>
                setUploads((current) => current.map((u, i) => (i === index ? { ...u, progress: fraction } : u))),
            })
            succeeded.add(index)
            setUploads((current) =>
              current.map((u, i) =>
                i === index ? { ...u, progress: 1, stage: 'done' } : u,
              ),
            )
          } catch (err) {
            setUploads((current) =>
              current.map((u, i) =>
                i === index
                  ? {
                      ...u,
                      stage: 'error',
                      error: err instanceof Error ? err.message : 'Upload failed',
                    }
                  : u,
              ),
            )
          }
        }
      })
      await Promise.all(workers)

      await load()
      const failed = list.length - succeeded.size
      if (failed === 0) {
        notify(list.length === 1 ? 'Uploaded' : `${list.length} photographs uploaded`)
      } else {
        notify(`${succeeded.size} uploaded · ${failed} failed`, 'error')
      }
    },
    [load, notify, folder],
  )

  async function saveAlt(item: MediaItem, alt: string) {
    try {
      await api.patch(`/admin/media/${item.id}`, { alt })
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, alt } : i)))
      setSelected((current) => (current?.id === item.id ? { ...current, alt } : current))
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
    }
  }

  async function remove(item: MediaItem) {
    try {
      const usage = await api.get<Record<string, unknown[]>>(`/admin/media/${item.id}/usage`)
      const count = Object.values(usage).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0)

      // Usage is reported rather than enforced: a file can be referenced from a
      // section blob in half a dozen shapes, so the honest answer is a number
      // and a question, not a refusal that cannot be trusted either.
      if (count > 0) {
        const ok = confirm(
          `“${item.filename}” is used in ${count} place${count === 1 ? '' : 's'}. Deleting it will leave them broken. Delete anyway?`,
        )
        if (!ok) return
      }

      await api.del(`/admin/media/${item.id}`)
      setItems((current) => current.filter((i) => i.id !== item.id))
      setSelected(null)
      notify('Deleted')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void upload(e.dataTransfer.files)
      }}
    >
      <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
        <h2 className="display text-lg">Media</h2>

        {folders.length > 0 && (
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className={clsx(inputClass, 'w-auto py-1.5 text-xs')}
            aria-label="Folder"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.count})
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-3">
          {onPickMany && (
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={() => onPickMany(picked)}
              className="btn btn-primary py-2.5 text-[0.7rem] disabled:opacity-40"
            >
              {picked.length === 0 ? 'Choose photographs' : `Add ${picked.length}`}
            </button>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className={clsx(inputClass, 'w-48 py-1.5 text-xs')}
          />

          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
            onChange={(e) => {
              if (e.target.files) void upload(e.target.files)
              e.target.value = ''
            }}
          />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={clsx('btn py-2.5 text-[0.7rem]', onPickMany ? 'btn-secondary' : 'btn-primary')}
          >
            Upload{folder ? ` to ${folder}` : ''}
          </button>

          {onClose && (
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
          )}
        </div>
      </header>

      {uploads.length > 0 && (
        <div className="space-y-2 border-b border-line px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="label text-faint">
              {uploads.filter((item) => item.stage === 'done').length} of {uploads.length} complete
              {uploads.some((item) => item.stage === 'error') && (
                <span className="ml-3 text-accent">
                  {uploads.filter((item) => item.stage === 'error').length} failed
                </span>
              )}
            </p>
            {uploads.every((item) => item.stage === 'done' || item.stage === 'error') && (
              <button
                type="button"
                onClick={() => setUploads([])}
                className="label text-faint transition-colors hover:text-ink"
              >
                Dismiss
              </button>
            )}
          </div>
          {uploads
            .filter((item) => item.stage !== 'done')
            .slice(0, 12)
            .map((upload_) => (
            <div key={upload_.id} className="flex items-center gap-3">
              <span className="w-48 truncate text-xs text-muted">{upload_.name}</span>
              <span className="w-16 text-xs capitalize text-faint">{upload_.stage}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className={clsx(
                    'block h-full transition-[width] duration-200',
                    upload_.stage === 'error' ? 'bg-accent' : 'bg-gilt',
                  )}
                  style={{ width: `${upload_.progress * 100}%` }}
                />
              </span>
              {upload_.error ? (
                <span className="max-w-56 truncate text-xs text-accent" title={upload_.error}>
                  {upload_.error}
                </span>
              ) : (
                <span className="w-10 text-right text-xs text-faint">
                  {Math.round(upload_.progress * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* The grid is capped rather than filling the window. On a 1900px display
          a six-across grid of full-width tiles is enormous — each thumbnail ends
          up bigger than the thing it represents will ever be on the page. */}
      <div className="relative mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto p-6">
        {dragging && (
          <div className="pointer-events-none absolute inset-4 z-10 grid place-items-center rounded-[var(--card-radius)] border-2 border-dashed border-gilt bg-canvas/85">
            <p className="label text-gilt">Drop to upload</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="aspect-square animate-pulse rounded-[3px] bg-ink/[0.05]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            body="Drag photographs in, or use the Upload button. Each one is turned into web-sized versions in your browser before it uploads."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item)}
                onDoubleClick={() => onPick?.(item)}
                className={clsx(
                  'group relative aspect-square overflow-hidden rounded-md border-2 transition-colors',
                  selected?.id === item.id || picked.some((p) => p.id === item.id)
                    ? 'border-gilt'
                    : 'border-transparent hover:border-gilt/60',
                )}
              >
                {picked.some((p) => p.id === item.id) && (
                  <span className="absolute top-1.5 left-1.5 z-10 grid size-6 place-items-center rounded-full bg-gilt text-[0.7rem] font-semibold text-white">
                    {picked.findIndex((p) => p.id === item.id) + 1}
                  </span>
                )}
                {item.mime.startsWith('image/') ? (
                  <img
                    src={thumbOf(item.url, item)}
                    alt={item.alt ?? ''}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-canvas px-2">
                    <FileIcon />
                    <span className="line-clamp-2 text-center text-[0.6rem] break-all text-faint">
                      {item.filename}
                    </span>
                  </span>
                )}

                {!item.alt && item.mime.startsWith('image/') && (
                  // A missing alt is worth flagging where it can be fixed,
                  // rather than discovering it in an accessibility audit later.
                  <span
                    title="No alt text"
                    className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-accent/85 text-[0.55rem] text-ink"
                  >
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-2.5">
          <p className="text-xs text-faint">
            Showing {items.length} of {total} file{total === 1 ? '' : 's'}
          </p>
          {items.length < total && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="label text-gilt transition-colors hover:text-ink disabled:opacity-40"
            >
              {loadingMore ? 'Loading…' : `Load ${Math.min(120, total - items.length)} more`}
            </button>
          )}
        </div>
      )}

      {selected && !picking && (
        <MediaDetail
          item={selected}
          onClose={() => setSelected(null)}
          onSaveAlt={(alt) => saveAlt(selected, alt)}
          onDelete={() => void remove(selected)}
        />
      )}
    </div>
  )
}

/**
 * One file, opened.
 *
 * The footer strip this replaced put the filename, the dimensions, an alt-text
 * field and two destructive-adjacent buttons into a single row — everything was
 * cramped, the image itself was never actually visible at any useful size, and
 * on a narrow window the controls wrapped into an unreadable pile.
 *
 * As a panel there is room to *see the picture*, which is the thing somebody
 * opening a media library is usually trying to do.
 */
function MediaDetail({
  item,
  onClose,
  onSaveAlt,
  onDelete,
}: {
  item: MediaItem
  onClose: () => void
  onSaveAlt: (alt: string) => void
  onDelete: () => void
}) {
  const notify = useToast()
  const [alt, setAlt] = useState(item.alt ?? '')
  const [copied, setCopied] = useState<string | null>(null)

  useEscape(onClose)

  // The panel is reused as the selection moves between files, so the draft alt
  // has to follow rather than keep the previous file's text.
  useEffect(() => setAlt(item.alt ?? ''), [item.id, item.alt])

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      notify('Could not reach the clipboard — select the text and copy it', 'error')
    }
  }

  const isImage = item.mime.startsWith('image/')

  return (
    <AnimatePresence>
      <Overlay className="z-[10075] flex items-center justify-center p-4 md:p-10">
        <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-canvas/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={item.filename}
          /**
           * Two panes side by side at `lg`, one scrolling column below it.
           *
           * Stacked, the picture and the sidebar were both asking to grow — the
           * image took 70vh, the sidebar took its content, and the pair
           * overflowed the dialog and drew on top of each other. So on narrow
           * screens the dialog itself scrolls and the image is capped at a
           * share of the viewport; only at `lg`, where there is room for two
           * columns, does the sidebar get its own scroll.
           */
          className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-y-auto rounded-[var(--card-radius)] border border-line bg-surface lg:flex-row lg:overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* The picture, on the page's own canvas color so it is judged
              against the background it will actually sit on. */}
          <div className="flex shrink-0 items-center justify-center bg-canvas p-6 lg:min-h-0 lg:flex-1">
            {isImage ? (
              <img
                src={item.url}
                alt={item.alt ?? ''}
                className="max-h-[38vh] max-w-full object-contain lg:max-h-[70vh]"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <FileIcon />
                <p className="text-sm break-all text-muted">{item.filename}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Open the file
                </a>
              </div>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col border-line lg:w-80 lg:overflow-y-auto lg:border-l">
            <header className="flex items-start gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.filename}</p>
                <p className="mt-1 text-xs text-faint">
                  {item.width ? `${item.width}×${item.height}` : item.mime}
                  {item.bytes > 0 && ` · ${formatBytes(item.bytes)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center text-faint transition-colors hover:text-gilt"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="flex-1 space-y-6 px-5 py-5">
              <div>
                <Label
                  htmlFor="media-alt"
                  help="What the image shows, for anyone who cannot see it. Left empty, screen readers announce nothing at all."
                >
                  Alt text
                </Label>
                <TextArea id="media-alt" rows={3} value={alt} onChange={setAlt} />
                <button
                  type="button"
                  onClick={() => {
                    onSaveAlt(alt)
                    notify('Alt text saved')
                  }}
                  disabled={alt === (item.alt ?? '')}
                  className="btn btn-secondary mt-3 w-full py-2.5 text-[0.62rem] disabled:opacity-40"
                >
                  Save alt text
                </button>
              </div>

              <div>
                <Label htmlFor="media-url">Address</Label>
                <input
                  id="media-url"
                  readOnly
                  value={item.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className={clsx(inputClass, 'font-mono text-[0.65rem]')}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void copy(item.url, 'url')}
                    className="btn btn-secondary py-2.5 text-[0.62rem]"
                  >
                    {copied === 'url' ? 'Copied' : 'Copy URL'}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary py-2.5 text-[0.62rem]"
                  >
                    Open
                  </a>
                </div>
              </div>

              <dl className="space-y-3 border-t border-line pt-5 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-faint">Type</dt>
                  <dd className="truncate">{item.mime}</dd>
                </div>
                {item.folder && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-faint">Folder</dt>
                    <dd className="truncate capitalize">{item.folder}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-faint">Added</dt>
                  <dd>{formatRelative(item.createdAt)}</dd>
                </div>
              </dl>
            </div>

            <footer className="border-t border-line px-5 py-4">
              <HoldConfirm
                label="Delete this file"
                holdingLabel="Hold to delete"
                variant="danger"
                onConfirm={() => {
                  onDelete()
                  onClose()
                }}
                className="w-full py-3 text-[0.62rem]"
              />
              <p className="mt-2.5 text-[0.65rem] leading-relaxed text-faint">
                Anywhere this file is used will be left with a broken image. You will be told how
                many places that is before it happens.
              </p>
            </footer>
          </div>
        </motion.div>
      </Overlay>
    </AnimatePresence>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-faint" fill="none" stroke="currentColor">
      <path d="M6 3h8l4 4v14H6z" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
