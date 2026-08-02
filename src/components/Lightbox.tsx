import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BY_ID, type Photo as PhotoData } from '@/data/photos.generated'

type Props = {
  /** Ordered ids the viewer can page through — usually the current filter. */
  ids: string[]
  /** Index into `ids`, or null when closed. */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
  /** Optional caption resolver, e.g. a category name. */
  caption?: (photo: PhotoData) => string
}

function srcSet(photo: PhotoData) {
  return photo.widths.map((w) => `${photo.src}-${w}.webp ${w}w`).join(', ')
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
      <path
        d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Full-screen image viewer.
 *
 * Keyboard: Escape closes, arrows page. Focus is trapped while open and
 * returned to whatever opened it on close. Neighbouring frames are warmed in
 * the background so paging does not flash a placeholder.
 */
export function Lightbox({ ids, index, onClose, onNavigate, caption }: Props) {
  const open = index !== null
  const dialog = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  const go = useCallback(
    (delta: number) => {
      if (index === null || ids.length === 0) return
      onNavigate((index + delta + ids.length) % ids.length)
    },
    [index, ids.length, onNavigate],
  )

  // Remember what had focus so it can be handed back on close.
  useEffect(() => {
    if (open) opener.current = document.activeElement as HTMLElement
  }, [open])

  useEffect(() => {
    if (!open) return

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab') {
        // Small, fixed set of controls — cycle them by hand.
        const focusables = dialog.current?.querySelectorAll<HTMLElement>('button')
        if (!focusables?.length) return
        const list = Array.from(focusables)
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      opener.current?.focus()
    }
  }, [open, go, onClose])

  // Warm the neighbours so paging is instant.
  useEffect(() => {
    if (index === null) return
    for (const delta of [1, -1]) {
      const neighbour = BY_ID[ids[(index + delta + ids.length) % ids.length]]
      if (!neighbour) continue
      const img = new Image()
      img.srcset = srcSet(neighbour)
      img.sizes = '100vw'
      img.src = `${neighbour.src}-${neighbour.widths[neighbour.widths.length - 1]}.webp`
    }
  }, [index, ids])

  const photo = index === null ? undefined : BY_ID[ids[index]]

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
          tabIndex={-1}
          className="fixed inset-0 z-100 flex flex-col bg-charcoal/97 outline-none backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between px-6 py-5 text-beige md:px-10">
            <span className="label text-beige/60">
              {String(index + 1).padStart(2, '0')} / {String(ids.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="label flex items-center gap-3 rounded-full border border-beige/30 px-5 py-2.5 text-beige transition-colors hover:border-champagne hover:text-champagne"
            >
              Close
              <span aria-hidden className="text-[1rem] leading-none">
                ×
              </span>
            </button>
          </div>

          {/* Clicking the surround closes; clicking the photo does not. */}
          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-4 md:px-20"
            onClick={onClose}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={photo.id}
                src={`${photo.src}-${photo.widths[photo.widths.length - 1]}.webp`}
                srcSet={srcSet(photo)}
                sizes="100vw"
                alt={caption?.(photo) ?? ''}
                onClick={(e) => e.stopPropagation()}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 90) go(info.offset.x < 0 ? 1 : -1)
                }}
                className="max-h-full max-w-full cursor-grab object-contain select-none active:cursor-grabbing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>

            {ids.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photograph"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(-1)
                  }}
                  className="absolute left-2 grid size-12 place-items-center rounded-full border border-beige/25 text-beige transition-colors hover:border-champagne hover:text-champagne md:left-6"
                >
                  <Chevron dir="prev" />
                </button>
                <button
                  type="button"
                  aria-label="Next photograph"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(1)
                  }}
                  className="absolute right-2 grid size-12 place-items-center rounded-full border border-beige/25 text-beige transition-colors hover:border-champagne hover:text-champagne md:right-6"
                >
                  <Chevron dir="next" />
                </button>
              </>
            )}
          </div>

          {caption && (
            <p className="label px-6 pb-6 text-center text-beige/55 md:px-10">{caption(photo)}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
