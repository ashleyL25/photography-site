import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { PORTFOLIO_FILTERS } from '@/data/site'
import { SHOOTS_BY_DATE, SHOOT_BY_SLUG, photosFor } from '@/data/shoots'
import type { Photo as PhotoData } from '@/data/photos.generated'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { Lightbox } from '@/components/Lightbox'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { useColumnCount, useDocumentMeta } from '@/lib/hooks'

const LABELS = Object.fromEntries(PORTFOLIO_FILTERS.map((f) => [f.id, f.label]))

/** Balanced-column masonry — see the note in Portfolio for why not CSS columns. */
function columnize(photos: PhotoData[], columns: number): PhotoData[][] {
  const buckets = Array.from({ length: columns }, () => ({
    items: [] as PhotoData[],
    height: 0,
  }))
  for (const photo of photos) {
    const shortest = buckets.reduce((a, b) => (a.height <= b.height ? a : b))
    shortest.items.push(photo)
    shortest.height += 1 / photo.aspect
  }
  return buckets.map((b) => b.items)
}

export default function ShootPage() {
  const { slug } = useParams()
  const shoot = slug ? SHOOT_BY_SLUG[slug] : undefined

  const columns = useColumnCount()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const photos = useMemo(() => (shoot ? photosFor(shoot) : []), [shoot])
  const grid = useMemo(() => columnize(photos, columns), [photos, columns])
  const ids = useMemo(() => photos.map((p) => p.id), [photos])

  useDocumentMeta(
    shoot ? `${shoot.title} — Ashley Photography` : 'Session — Ashley Photography',
    shoot?.story,
  )

  if (!shoot) return <Navigate to="/portfolio" replace />

  // Only the fields that were actually filled in get a row.
  const facts = [
    { term: 'Session', detail: LABELS[shoot.category] ?? shoot.category },
    { term: 'When', detail: shoot.date },
    { term: 'Where', detail: shoot.location },
    { term: 'Conditions', detail: shoot.conditions },
    { term: 'Requests', detail: shoot.requests },
    { term: 'Delivered', detail: `${photos.length} frames in this gallery` },
  ].filter((f) => Boolean(f.detail))

  const order = SHOOTS_BY_DATE.findIndex((s) => s.slug === shoot.slug)
  const next = SHOOTS_BY_DATE[(order + 1) % SHOOTS_BY_DATE.length]

  return (
    <>
      <PageHero
        eyebrow={`${LABELS[shoot.category] ?? shoot.category} · ${shoot.date}`}
        heading={shoot.title}
        photoId={shoot.cover}
      >
        <Reveal delay={0.2} className="mt-10">
          <Link
            to={`/portfolio?c=${shoot.category}`}
            className="label inline-flex items-center gap-3 border-b border-beige/40 pb-2 text-beige/80 transition-colors hover:border-champagne hover:text-champagne"
          >
            <span aria-hidden>←</span>
            All {(LABELS[shoot.category] ?? shoot.category).toLowerCase()} sessions
          </Link>
        </Reveal>
      </PageHero>

      {/* The story, with the session's particulars alongside. */}
      <section className="shell grid gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <Reveal className="label text-accent">About this session</Reveal>
          <Reveal
            as="p"
            delay={0.08}
            className="mt-6 max-w-2xl text-[1.1rem] leading-[1.85] text-muted"
          >
            {shoot.story}
          </Reveal>
        </div>

        <dl className="lg:col-span-4 lg:col-start-9">
          <DrawRule />
          {facts.map((fact, i) => (
            <Reveal
              key={fact.term}
              delay={i * 0.06}
              className="flex justify-between gap-6 border-b border-line py-4"
            >
              <dt className="label shrink-0 text-faint">{fact.term}</dt>
              <dd className="text-right text-[0.95rem] text-ink">{fact.detail}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* The gallery. */}
      <section className="shell pb-24 md:pb-32">
        <div className="flex items-start gap-5 md:gap-7">
          {grid.map((column, ci) => (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-5 md:gap-7">
              {column.map((photo, ri) => (
                <motion.button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpenIndex(ids.indexOf(photo.id))}
                  className="group relative block w-full cursor-zoom-in overflow-hidden"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                  transition={{
                    duration: 0.8,
                    delay: Math.min(ri * 0.05 + ci * 0.04, 0.5),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Photo
                    id={photo.id}
                    alt={`${shoot.title} — photograph ${ids.indexOf(photo.id) + 1}`}
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                    className="w-full"
                    imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
                  />
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* On to the next one. */}
      <section className="border-t border-line bg-surface py-20 md:py-28">
        <div className="shell flex flex-wrap items-end justify-between gap-10">
          <div>
            <Reveal className="label text-faint">Next session</Reveal>
            <MaskText
              text={next.title}
              className="display mt-4 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
            <Reveal delay={0.1} className="mt-3 text-[0.95rem] text-muted italic">
              {LABELS[next.category] ?? next.category} · {next.date}
            </Reveal>
          </div>
          <Reveal delay={0.16} className="flex flex-wrap gap-4">
            <Link
              to={`/portfolio/${next.slug}`}
              className="label rounded-full border border-ink px-8 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              View it
            </Link>
            <Link
              to="/portfolio"
              className="label rounded-full border border-line px-8 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              All sessions
            </Link>
          </Reveal>
        </div>
      </section>

      <Lightbox
        ids={ids}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        caption={() => `${shoot.title} · ${shoot.date}`}
      />
    </>
  )
}
