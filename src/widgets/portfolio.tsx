import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { Reveal } from '@/components/motion'
import { useCategoryLabels, useSite } from '@/lib/site'
import { bool, columns, frame, ratio, text, type WidgetProps } from './types'
import { FilterBar, LoadMore } from './FilterBar'
import { hoverClasses } from './photos'
import type { AlbumSummary } from '@shared/types'

/**
 * Every published album, with a filter bar.
 *
 * `?c=seniors` deep-links a category, so a session page's "see them all" lands
 * here already filtered, and the parameter stays in sync as you click through.
 * Only categories that actually have an album behind them are offered.
 */
export function PortfolioListing({ content, styles }: WidgetProps) {
  const site = useSite()
  const { categories } = site
  const only = text(content, 'category')
  const style = text(content, 'style') || 'grid'
  const sort = text(content, 'default_sort') || 'newest'
  const perPage = typeof content.per_page === 'number' && content.per_page > 0 ? content.per_page : 48
  const [shown, setShown] = useState(perPage)
  const [search, setSearch] = useState('')

  const albums = useMemo(() => {
    const pool = only ? site.albums.filter((a) => a.category === only) : [...site.albums]
    if (sort === 'oldest') pool.sort((a, b) => a.shootDate.localeCompare(b.shootDate))
    else if (sort === 'title') pool.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'featured') pool.sort((a, b) => Number(b.featured) - Number(a.featured))
    return pool
  }, [site.albums, only, sort])

  const showFilters = bool(content, 'show_filters', true) && !only
  const showCount = bool(content, 'show_count', true)
  const f = frame(styles, { pad: 'py-16 md:py-24' })
  const allLabel = text(content, 'all_label') || 'Everything'

  const filters = useMemo(() => {
    const present = new Set(albums.map((a) => a.category).filter(Boolean))
    const list = [
      { id: 'all', label: allLabel },
      ...categories.filter((c) => present.has(c.slug)).map((c) => ({ id: c.slug, label: c.name })),
    ]
    return list.map((fl) => ({
      ...fl,
      count: showCount ? (fl.id === 'all' ? albums.length : albums.filter((a) => a.category === fl.id).length) : undefined,
    }))
  }, [albums, categories, allLabel, showCount])

  const [params, setParams] = useSearchParams()
  const requested = params.get('c') ?? 'all'
  const valid = filters.some((fl) => fl.id === requested)
  const [filter, setFilter] = useState<string>(valid ? requested : 'all')

  useEffect(() => {
    if (valid) setFilter(requested)
  }, [requested, valid])

  const choose = (id: string) => {
    setFilter(id)
    setShown(perPage)
    setParams(id === 'all' ? {} : { c: id }, { replace: true })
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return albums.filter(
      (a) =>
        (filter === 'all' || a.category === filter) &&
        (!q || `${a.title} ${a.location ?? ''} ${a.dateLabel}`.toLowerCase().includes(q)),
    )
  }, [filter, albums, search])

  const page = visible.slice(0, shown)
  const card = {
    shape: style === 'masonry' ? 'auto' : text(content, 'ratio') || '3/4',
    countLabel: showCount ? text(content, 'frames_label') : null,
    showCategory: bool(content, 'show_category', true),
    showDetails: bool(content, 'show_details', true),
    hover: text(content, 'hover') || 'zoom',
  }

  return (
    <div id={f.id} className={f.className}>
      <FilterBar
        options={filters}
        value={filter}
        onChange={choose}
        style={text(content, 'filter_style') || 'pills'}
        showFilters={showFilters}
        search={bool(content, 'show_search') ? search : undefined}
        onSearch={bool(content, 'show_search') ? setSearch : undefined}
        searchPlaceholder="Search the portfolio"
      />

      <section className={clsx('shell', f.pad)} style={f.style}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${filter}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {style === 'index' ? (
              <AlbumIndex albums={page} labels={card} />
            ) : style === 'masonry' ? (
              <div className={clsx('gap-x-8', content.columns === '2' ? 'sm:columns-2' : content.columns === '4' ? 'sm:columns-2 lg:columns-4' : 'sm:columns-2 lg:columns-3')}>
                {page.map((album, i) => (
                  <motion.div
                    key={album.id}
                    className="mb-16 break-inside-avoid"
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85, delay: Math.min(i * 0.07, 0.6), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AlbumCard album={album} {...card} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <ul className={clsx('grid gap-x-8 gap-y-16', columns(content.columns, '3'))}>
                {page.map((album, i) => (
                  <motion.li
                    key={album.id}
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85, delay: Math.min(i * 0.07, 0.6), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AlbumCard album={album} {...card} />
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        {visible.length > shown && <LoadMore label={text(content, 'more_label') || 'Load more'} onClick={() => setShown((n) => n + perPage)} />}

        {visible.length === 0 && (
          <Reveal className="py-24 text-center text-muted italic">{text(content, 'empty')}</Reveal>
        )}
      </section>
    </div>
  )
}

/** Albums as a typographic list — title, category, date — with the cover appearing on hover. */
export function AlbumIndex({
  albums,
  labels,
}: {
  albums: AlbumSummary[]
  labels: { showCategory: boolean; showDetails: boolean; countLabel: string | null }
}) {
  const names = useCategoryLabels()
  return (
    <ol className="border-t border-line">
      {albums.map((album, i) => (
        <li key={album.id} className="border-b border-line">
          <Link to={`/portfolio/${album.slug}`} className="group grid grid-cols-12 items-center gap-4 py-6 md:py-8">
            <span className="label col-span-2 text-faint md:col-span-1">{String(i + 1).padStart(2, '0')}</span>
            <span className="display col-span-10 text-[calc(clamp(1.6rem,3.4vw,2.6rem)*var(--hs,1))] text-ink transition-colors duration-400 group-hover:text-accent md:col-span-6">
              {album.title}
            </span>
            <span className="label col-span-6 col-start-3 text-muted md:col-span-2 md:col-start-auto">
              {labels.showCategory && album.category ? (names[album.category] ?? album.category) : ''}
            </span>
            <span className="col-span-4 text-right text-[0.9rem] text-muted italic md:col-span-2">
              {labels.showDetails ? album.dateLabel : ''}
            </span>
            <span className="relative hidden md:col-span-1 md:block">
              <span className="absolute top-1/2 right-0 block w-24 -translate-y-1/2 scale-90 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                <Photo src={album.cover} alt="" sizes="96px" className="aspect-[4/5]" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** One album as a card: cover, category, title, count and date. */
export function AlbumCard({
  album,
  shape,
  countLabel,
  showCategory = true,
  showDetails = true,
  hover = 'zoom',
  sizes = '(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw',
}: {
  album: AlbumSummary
  /** An aspect ratio like '3/4', or 'auto' for the cover's own shape. */
  shape: string
  countLabel: string | null
  showCategory?: boolean
  showDetails?: boolean
  hover?: string
  sizes?: string
}) {
  const labels = useCategoryLabels()
  const fx = hoverClasses(hover)
  return (
    <Link to={`/portfolio/${album.slug}`} className={clsx('group block', fx.group)}>
      <div className="relative overflow-hidden">
        <Photo
          src={album.cover}
          alt={album.title}
          sizes={sizes}
          className={shape === 'auto' ? 'w-full' : undefined}
          style={shape === 'auto' ? undefined : ratio(shape, '3/4')}
          imgClassName={fx.img}
        />
        {hover !== 'none' && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
          />
        )}
        {showCategory && album.category && (
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
      {showDetails && (
        <p className="mt-2 text-[0.9rem] text-muted italic">
          {album.dateLabel}
          {album.location ? ` · ${album.location}` : ''}
        </p>
      )}
    </Link>
  )
}
