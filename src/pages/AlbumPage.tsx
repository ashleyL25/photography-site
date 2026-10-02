import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHero } from '@/components/PageHero'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { usePageData } from '@/lib/content'
import { useDocumentMeta } from '@/lib/hooks'
import { setOverPhoto } from '@/lib/chrome'
import { useCategoryLabels, useSite, useSiteInfo } from '@/lib/site'
import { renderSections } from '@/widgets'
import { MasonryGallery } from '@/widgets/photos'
import { HostContext } from '@/widgets/types'
import { PageFallback } from './DynamicPage'
import type { Album } from '@shared/types'

/**
 * One album: the story, the particulars, the full gallery and a lightbox — and
 * then anything added to it in the dashboard, before the way on to the next.
 */
export default function AlbumPage() {
  const { slug = '' } = useParams()
  const { albums } = useSite()
  const labels = useCategoryLabels()
  const site = useSiteInfo()
  const { data, missing } = usePageData<{ album: Album }>(`/albums/${slug}`)
  const album = data?.album

  useDocumentMeta(
    album ? album.metaTitle || `${album.title}${site.titleSuffix}` : site.name,
    album ? album.metaDescription || album.story || undefined : undefined,
  )

  useEffect(() => setOverPhoto(true), [])

  if (missing) return <Navigate to="/portfolio" replace />
  if (!album) return <PageFallback />

  const category = album.category?.slug ?? ''
  const label = labels[category] ?? album.category?.name ?? ''
  const date = album.dateLabel ?? ''

  // Only the fields that were actually filled in get a row.
  const facts = [
    { term: 'Session', detail: label },
    { term: 'When', detail: date },
    { term: 'Where', detail: album.location },
    { term: 'Conditions', detail: album.conditions },
    { term: 'Requests', detail: album.requests },
    {
      term: 'Delivered',
      detail: `${album.photos.length} ${album.photos.length === 1 ? 'frame' : 'frames'} in this gallery`,
    },
  ].filter((f) => Boolean(f.detail))

  const order = albums.findIndex((a) => a.slug === album.slug)
  const next = albums.length > 1 ? albums[(order + 1) % albums.length] : null

  return (
    <HostContext.Provider value={{ kind: 'album', album }}>
      <PageHero
        eyebrow={[label, date].filter(Boolean).join(' · ')}
        heading={album.title}
        image={album.cover || album.photos[0] || ''}
      >
        {category && (
          <Reveal delay={0.2} className="mt-10">
            <Link
              to={`/portfolio?c=${category}`}
              className="label inline-flex items-center gap-3 border-b border-beige/40 pb-2 text-beige/80 transition-colors hover:border-champagne hover:text-champagne"
            >
              <span aria-hidden>←</span>
              All {label.toLowerCase()} sessions
            </Link>
          </Reveal>
        )}
      </PageHero>

      {/* The story, with the session's particulars alongside. An album with no
          story drops the heading with it — "About this session" over blank
          space reads as a page that failed to load — and the facts widen. */}
      <section className="shell grid gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-20">
        {album.story && (
          <div className="lg:col-span-7">
            <Reveal className="label text-accent">About this session</Reveal>
            <Reveal as="p" delay={0.08} className="mt-6 max-w-2xl text-[1.1rem] leading-[1.85] text-muted">
              {album.story}
            </Reveal>
          </div>
        )}

        <dl className={album.story ? 'lg:col-span-4 lg:col-start-9' : 'lg:col-span-6'}>
          <DrawRule />
          {facts.map((fact, i) => (
            <Reveal key={fact.term} delay={i * 0.06} className="flex justify-between gap-6 border-b border-line py-4">
              <dt className="label shrink-0 text-faint">{fact.term}</dt>
              <dd className="text-right text-[0.95rem] text-ink">{fact.detail}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="shell pb-24 md:pb-32">
        <MasonryGallery photos={album.photos} title={album.title} caption={[album.title, date].filter(Boolean).join(' · ')} />
      </section>

      {renderSections(album.sections)}

      {next && (
        <section className="border-t border-line bg-surface py-20 md:py-28">
          <div className="shell flex flex-wrap items-end justify-between gap-10">
            <div>
              <Reveal className="label text-faint">Next session</Reveal>
              <MaskText text={next.title} className="display mt-4 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
              <Reveal delay={0.1} className="mt-3 text-[0.95rem] text-muted italic">
                {[next.category ? (labels[next.category] ?? next.category) : '', next.dateLabel].filter(Boolean).join(' · ')}
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
      )}
    </HostContext.Provider>
  )
}
