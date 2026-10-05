import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { Reveal } from '@/components/motion'
import { useCategoryLabels, useSite } from '@/lib/site'
import { bool, columns, frame, ratio, text, type WidgetProps } from './types'
import type { AlbumSummary } from '@shared/types'

/**
 * Every published album, newest first, with a filter bar.
 *
 * `?c=seniors` deep-links a category, so a session page's "see them all" lands
 * here already filtered, and the parameter stays in sync as you click through.
 * Only categories that actually have an album behind them are offered.
 */
export function PortfolioListing({ content, styles }: WidgetProps) {
  const site = useSite()
  const { categories } = site
  const only = text(content, 'category')
  const albums = useMemo(() => (only ? site.albums.filter((a) => a.category === only) : site.albums), [site.albums, only])
  const showFilters = bool(content, 'show_filters', true) && !only
  const showCount = bool(content, 'show_count', true)
  const f = frame(styles, { pad: 'py-16 md:py-24' })
  const allLabel = text(content, 'all_label') || 'Everything'

  const filters = useMemo(() => {
    const present = new Set(albums.map((a) => a.category).filter(Boolean))
    return [
      { id: 'all', label: allLabel },
      ...categories.filter((c) => present.has(c.slug)).map((c) => ({ id: c.slug, label: c.name })),
    ]
  }, [albums, categories, allLabel])

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((fl) => [fl.id, fl.id === 'all' ? albums.length : albums.filter((a) => a.category === fl.id).length]),
      ),
    [filters, albums],
  )

  const [params, setParams] = useSearchParams()
  const requested = params.get('c') ?? 'all'
  const valid = filters.some((fl) => fl.id === requested)
  const [filter, setFilter] = useState<string>(valid ? requested : 'all')

  useEffect(() => {
    if (valid) setFilter(requested)
  }, [requested, valid])

  const choose = (id: string) => {
    setFilter(id)
    setParams(id === 'all' ? {} : { c: id }, { replace: true })
  }

  const visible = useMemo(
    () => (filter === 'all' ? albums : albums.filter((a) => a.category === filter)),
    [filter, albums],
  )

  return (
    <div id={f.id} className={f.className}>
      {/* Filters stay reachable while you scroll. `top-16` matches the scrolled
          header's height, with a hair of overlap so nothing shows through. */}
      {showFilters && (
      <div className="sticky top-16 z-40 border-y border-line bg-canvas/90 backdrop-blur-xl">
        <div className="shell flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((fl) => {
            const on = filter === fl.id
            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => choose(fl.id)}
                aria-pressed={on}
                className={clsx(
                  'label relative shrink-0 rounded-full border px-5 py-2.5 whitespace-nowrap transition-colors duration-400',
                  on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {fl.label}
                <span className="ml-2 text-[0.9em] opacity-50">{counts[fl.id]}</span>
              </button>
            )
          })}
        </div>
      </div>
      )}

      <section className={clsx('shell', f.pad)} style={f.style}>
        <AnimatePresence mode="wait">
          <motion.ul
            key={filter}
            className={clsx('grid gap-x-8 gap-y-16', columns(content.columns, '3'))}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {visible.map((album, i) => (
              <motion.li
                key={album.id}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: Math.min(i * 0.07, 0.6), ease: [0.16, 1, 0.3, 1] }}
              >
                <AlbumCard
                  album={album}
                  shape={text(content, 'ratio') || '3/4'}
                  countLabel={showCount ? text(content, 'frames_label') : null}
                />
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>

        {visible.length === 0 && (
          <Reveal className="py-24 text-center text-muted italic">{text(content, 'empty')}</Reveal>
        )}
      </section>
    </div>
  )
}

/** One album as a card: cover, category, title, count and date. */
export function AlbumCard({
  album,
  shape,
  countLabel,
  sizes = '(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw',
}: {
  album: AlbumSummary
  shape: string
  countLabel: string | null
  sizes?: string
}) {
  const labels = useCategoryLabels()
  return (
    <Link to={`/portfolio/${album.slug}`} className="group block">
      <div className="relative overflow-hidden">
        <Photo
          src={album.cover}
          alt={album.title}
          sizes={sizes}
          style={ratio(shape, '3/4')}
          imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
        />
        {album.category && (
          <span className="label absolute bottom-5 left-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
            {labels[album.category] ?? album.category}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <h2 className="display text-[1.7rem] text-ink transition-colors duration-400 group-hover:text-accent">
          {album.title}
        </h2>
        {countLabel !== null && (
          <span className="label shrink-0 text-faint">
            {album.count} {countLabel}
          </span>
        )}
      </div>
      <p className="mt-2 text-[0.9rem] text-muted italic">
        {album.dateLabel}
        {album.location ? ` · ${album.location}` : ''}
      </p>
    </Link>
  )
}
