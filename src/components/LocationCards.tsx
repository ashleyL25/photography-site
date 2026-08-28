import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import type { Location } from '@/data/locations'
import { useRemoteLocations, type LocationPhoto } from '@/data/locations-remote'
import { Photo } from './Photo'
import { Reveal } from './motion'

/**
 * Location suggestions as cards, each opening a modal with a slider.
 *
 * A location's photographs come from the gallery dashboard at runtime (see
 * locations-remote.ts), so a card has two forms and both are correct:
 *
 *  - **With a published folder** — a cover photograph, and a card that opens.
 *  - **Without one** — the same card, text only, and inert. No placeholder, no
 *    broken frame, no "coming soon". Most of these will look like this for a
 *    while and several always will.
 *
 * The address is on the card either way, because that is the thing a client
 * actually needs from this page.
 */
export function LocationCards({ items }: { items: Location[] }) {
  const remote = useRemoteLocations()
  const [open, setOpen] = useState<string | null>(null)

  const active = open ? items.find((l) => l.slug === open) : undefined
  const activePhotos = active ? (remote.bySlug[active.slug] ?? []) : []

  return (
    <>
      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((location, i) => {
          const photos = remote.bySlug[location.slug] ?? []
          const cover = photos[0]

          return (
            <Reveal as="li" key={location.slug} delay={(i % 3) * 0.06}>
              <LocationCard
                location={location}
                cover={cover}
                count={photos.length}
                onOpen={cover ? () => setOpen(location.slug) : undefined}
              />
            </Reveal>
          )
        })}
      </ul>

      <AnimatePresence>
        {active && activePhotos.length > 0 && (
          <LocationModal
            location={active}
            photos={activePhotos}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function LocationCard({
  location,
  cover,
  count,
  onOpen,
}: {
  location: Location
  cover?: LocationPhoto
  count: number
  onOpen?: () => void
}) {
  const body = (
    <>
      {cover && (
        <div className="overflow-hidden">
          <Photo
            data={cover}
            alt={location.name}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="aspect-[4/5]"
            imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
        </div>
      )}

      <div className={clsx(cover && 'mt-5')}>
        <h4
          className={clsx(
            'display text-[1.5rem] text-ink',
            onOpen && 'transition-colors duration-400 group-hover:text-accent',
          )}
        >
          {location.name}
        </h4>
        <p className="label mt-3 text-accent">{location.area}</p>
        {location.address && (
          <p className="mt-3 text-[0.85rem] leading-relaxed text-faint">{location.address}</p>
        )}
        <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{location.blurb}</p>

        {onOpen && (
          <p className="label mt-4 inline-flex items-center gap-2 text-accent">
            See {count} {count === 1 ? 'photo' : 'photos'}
            <span aria-hidden>→</span>
          </p>
        )}
      </div>
    </>
  )

  if (!onOpen) return <div className="flex flex-col">{body}</div>

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group flex w-full flex-col text-left"
    >
      {body}
    </button>
  )
}

function LocationModal({
  location,
  photos,
  onClose,
}: {
  location: Location
  photos: LocationPhoto[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const dialog = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length),
    [photos.length],
  )

  // Hand focus back to whatever opened this on the way out, and keep the page
  // behind from scrolling underneath it.
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = overflow
      removeEventListener('keydown', onKey)
      opener.current?.focus()
    }
  }, [go, onClose])

  const photo = photos[index]

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(var(--scrim))]/80 backdrop-blur-sm"
      />

      <motion.div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={location.name}
        tabIndex={-1}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.99 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative grid max-h-[92svh] w-full max-w-5xl overflow-hidden rounded-sm bg-canvas outline-none lg:grid-cols-[1.35fr_1fr]"
      >
        {/* Slider. */}
        <div className="relative bg-surface">
          <Photo
            key={photo.id}
            data={photo}
            alt={`${location.name} — ${index + 1} of ${photos.length}`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            className="h-full max-h-[45svh] w-full lg:max-h-none"
          />

          {photo.credit && <CreditLine credit={photo.credit} />}

          {photos.length > 1 && (
            <>
              <SliderButton side="left" onClick={() => go(-1)} />
              <SliderButton side="right" onClick={() => go(1)} />

              <div
                className={clsx(
                  'absolute inset-x-0 flex justify-center gap-2',
                  photo.credit ? 'bottom-12' : 'bottom-4',
                )}
              >
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    aria-current={i === index || undefined}
                    onClick={() => setIndex(i)}
                    className={clsx(
                      'h-1.5 rounded-full transition-all duration-400',
                      i === index ? 'w-6 bg-beige' : 'w-1.5 bg-beige/50 hover:bg-beige/80',
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* The location itself. */}
        <div className="overflow-y-auto p-8 md:p-10">
          <p className="label text-accent">{location.area}</p>
          <h3 className="display mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] text-ink">
            {location.name}
          </h3>

          <p className="mt-6 text-[1rem] leading-[1.85] text-muted">{location.detail}</p>

          <dl className="mt-8 space-y-4 border-t border-line pt-6">
            <div>
              <dt className="label text-faint">Best for</dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-ink">{location.bestFor}</dd>
            </div>
            {location.address && (
              <div>
                <dt className="label text-faint">Address</dt>
                <dd className="mt-2 text-[0.95rem] leading-relaxed text-ink">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${location.name}, ${location.address}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-b border-line pb-0.5 transition-colors hover:border-accent hover:text-accent"
                  >
                    {location.address}
                    <span aria-hidden className="ml-2 text-[0.8em] text-faint">↗</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {location.note && (
            <p className="mt-8 border-l border-accent/40 pl-5 text-[0.9rem] leading-relaxed text-muted italic">
              {location.note}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-canvas/80 text-ink backdrop-blur transition-colors hover:bg-accent hover:text-canvas"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  )
}

/**
 * Attribution for a photograph somebody else took. Present only when the file
 * came out of a photographer's subfolder — see scripts/build-locations.mjs.
 * Crediting is the whole point, so it is on the image itself rather than
 * tucked into the write-up beside it.
 */
function CreditLine({ credit }: { credit: NonNullable<LocationPhoto['credit']> }) {
  const label = `Photo by ${credit.name}`
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(var(--scrim))]/85 to-transparent px-5 pt-10 pb-4">
      <p className="label text-beige/90">
        {credit.url ? (
          <a
            href={credit.url}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-champagne"
          >
            {label}
            <span aria-hidden className="ml-2 text-[0.8em] text-beige/60">↗</span>
          </a>
        ) : (
          label
        )}
      </p>
      {credit.subject && (
        <p className="mt-1.5 text-[0.78rem] leading-snug text-beige/65 italic">{credit.subject}</p>
      )}
    </div>
  )
}

function SliderButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={clsx(
        'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-canvas/75 text-ink backdrop-blur transition-colors hover:bg-accent hover:text-canvas',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" aria-hidden>
        <path
          d={side === 'left' ? 'M10 2L4 8l6 6' : 'M6 2l6 6-6 6'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
