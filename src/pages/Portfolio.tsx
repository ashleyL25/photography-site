import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { PORTFOLIO, PORTFOLIO_FILTERS } from '@/data/site'
import { SHOOTS_BY_DATE, photosFor } from '@/data/shoots'
import { useRemotePortfolio } from '@/data/portfolio-remote'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

const BASE_LABELS = Object.fromEntries(PORTFOLIO_FILTERS.map((f) => [f.id, f.label]))

export default function Portfolio() {
  useDocumentMeta(
    'Portfolio — Ashley Photography',
    'Portrait sessions across the Des Moines metro and central Iowa: seniors, graduation, engagements, couples, families and pets.',
  )

  /**
   * Local shoots and anything published from the gallery dashboard, newest first.
   *
   * A remote album whose slug collides with a hand-curated one is dropped: the
   * local entry has editorial copy behind it and is the better page.
   */
  const remote = useRemotePortfolio()

  const shoots = useMemo(() => {
    const localSlugs = new Set(SHOOTS_BY_DATE.map((s) => s.slug))
    const extra = remote.shoots.filter((s) => !localSlugs.has(s.slug))
    return [...SHOOTS_BY_DATE, ...extra].sort((a, b) => b.sort.localeCompare(a.sort))
  }, [remote.shoots])

  // Labels for categories the local filter list does not name — a group added in
  // the dashboard, like Boudoir, arrives with its own label.
  const labels = useMemo(
    () => ({ ...Object.fromEntries(remote.categories.map((c) => [c.value, c.label])), ...BASE_LABELS }),
    [remote.categories],
  )

  /** Only offer a filter that actually has a session behind it. */
  const filters = useMemo(() => {
    const present = new Set(shoots.map((s) => s.category))
    const known = PORTFOLIO_FILTERS.filter((f) => f.id === 'all' || present.has(f.id))
    // Categories from the dashboard that the hardcoded list never anticipated,
    // appended so they are reachable rather than silently unfilterable.
    const extra = [...present]
      .filter((c) => !PORTFOLIO_FILTERS.some((f) => f.id === c))
      .map((c) => ({ id: c, label: labels[c] ?? c }))
    return [...known, ...extra]
  }, [shoots, labels])

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [
          f.id,
          f.id === 'all' ? shoots.length : shoots.filter((s) => s.category === f.id).length,
        ]),
      ),
    [filters, shoots],
  )

  // `?c=seniors` deep-links a category, so homepage session rows can land here
  // already filtered. The param stays in sync as you click through.
  const [params, setParams] = useSearchParams()
  const requested = params.get('c') ?? 'all'
  const valid = filters.some((f) => f.id === requested)
  const [filter, setFilter] = useState<string>(valid ? requested : 'all')

  useEffect(() => {
    if (valid) setFilter(requested)
  }, [requested, valid])

  const choose = (id: string) => {
    setFilter(id)
    setParams(id === 'all' ? {} : { c: id }, { replace: true })
  }

  const visible = useMemo(
    () => (filter === 'all' ? shoots : shoots.filter((s) => s.category === filter)),
    [filter, shoots],
  )

  return (
    <>
      <PageHero
        eyebrow={PORTFOLIO.eyebrow}
        heading={PORTFOLIO.heading}
        body={PORTFOLIO.body}
        photoId={PORTFOLIO.photoId}
      />

      {/* Filters stay reachable while you scroll. `top-16` matches the scrolled
          header's height, with a hair of overlap so nothing shows through. */}
      <div className="sticky top-16 z-40 border-y border-line bg-canvas/90 backdrop-blur-xl">
        <div className="shell flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => {
            const on = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => choose(f.id)}
                aria-pressed={on}
                className={clsx(
                  'label relative shrink-0 rounded-full border px-5 py-2.5 whitespace-nowrap transition-colors duration-400',
                  on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {f.label}
                <span className="ml-2 text-[0.9em] opacity-50">{counts[f.id]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <section className="shell py-16 md:py-24">
        <AnimatePresence mode="wait">
          <motion.ul
            key={filter}
            className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {visible.map((shoot, i) => {
              // Local shoots resolve through the generated manifest; remote ones
              // through the fetched one, keyed on the same slug.
              const count = (photosFor(shoot).length || remote.bySlug[shoot.slug]?.length) ?? 0
              return (
                <motion.li
                  key={shoot.slug}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.85,
                    delay: Math.min(i * 0.07, 0.6),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link to={`/portfolio/${shoot.slug}`} className="group block">
                    <div className="relative overflow-hidden">
                      <Photo
                        id={shoot.cover}
                        alt={shoot.title}
                        sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className="aspect-[3/4]"
                        imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
                      />
                      <span className="label absolute bottom-5 left-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
                        {labels[shoot.category] ?? shoot.category}
                      </span>
                    </div>

                    <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-4">
                      <h2 className="display text-[1.7rem] text-ink transition-colors duration-400 group-hover:text-accent">
                        {shoot.title}
                      </h2>
                      <span className="label shrink-0 text-faint">{count} frames</span>
                    </div>
                    <p className="mt-2 text-[0.9rem] text-muted italic">
                      {shoot.date}
                      {shoot.location ? ` · ${shoot.location}` : ''}
                    </p>
                  </Link>
                </motion.li>
              )
            })}
          </motion.ul>
        </AnimatePresence>

        {visible.length === 0 && (
          <Reveal className="py-24 text-center text-muted italic">
            Nothing in this category yet.
          </Reveal>
        )}
      </section>
    </>
  )
}
