import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { GUIDES, GUIDES_BY_ID } from '@/data/guides'
import { SESSIONS_BY_ID } from '@/data/site'
import { PageHero } from '@/components/PageHero'
import { ChapterNav } from '@/components/ChapterNav'
import { GuideBlock } from '@/components/GuideBlocks'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { useActiveSection, useDocumentMeta } from '@/lib/hooks'

/** Copies the current URL, which is how Ashley actually sends these out. */
function ShareRow({ guideTitle }: { guideTitle: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      /* Clipboard blocked — the address bar still works. */
    }
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={copy}
        className="label rounded-full border border-beige/50 px-6 py-3 text-beige transition-colors duration-400 hover:border-champagne hover:bg-champagne hover:text-charcoal"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="label rounded-full border border-beige/30 px-6 py-3 text-beige/75 transition-colors duration-400 hover:border-champagne hover:text-champagne"
      >
        Print {guideTitle.toLowerCase()}
      </button>
    </div>
  )
}

export default function GuidePage() {
  const { id = '' } = useParams()
  const guide = GUIDES_BY_ID[id]

  useDocumentMeta(
    guide ? `${guide.title} prep guide — Ashley Photography` : 'Guides — Ashley Photography',
    guide?.subtitle,
  )

  // `useActiveSection` keys its effect on identity, so this has to be memoised
  // or the observer tears down and rebuilds on every render. An empty array is
  // fine when the guide is missing — the redirect happens on the same render.
  const chapterIds = useMemo(() => guide?.chapters.map((c) => c.id) ?? [], [guide])
  const active = useActiveSection(chapterIds)

  if (!guide) return <Navigate to="/guides" replace />

  const session = SESSIONS_BY_ID[guide.id]
  const others = GUIDES.filter((g) => g.id !== guide.id)

  return (
    <>
      <PageHero
        eyebrow={guide.eyebrow}
        heading={guide.title}
        body={guide.subtitle}
        photoId={guide.photoId}
      >
        <div className="mt-12">
          <ShareRow guideTitle={guide.title} />
        </div>
      </PageHero>

      {/* The letter. */}
      <section className="shell grid gap-14 py-24 md:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            First, the short version
          </Reveal>

          <div className="mt-10 max-w-2xl space-y-6 text-[1.08rem] leading-[1.95] text-muted">
            {guide.intro.map((paragraph, i) => (
              <Reveal key={i} as="p" delay={0.06 + i * 0.07}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="display mt-10 text-[2.4rem] text-accent">
            {guide.signOff}
          </Reveal>
        </div>

        {/* At a glance. */}
        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal className="label text-faint">At a glance</Reveal>
          <dl className="mt-8">
            {guide.meta.map((row, i) => (
              <Reveal
                key={row.label}
                delay={i * 0.05}
                className="flex items-baseline justify-between gap-6 border-b border-line py-4"
              >
                <dt className="label shrink-0 text-faint">{row.label}</dt>
                <dd className="text-right text-[0.97rem] leading-snug text-ink">{row.value}</dd>
              </Reveal>
            ))}
          </dl>

          {session && (
            <Reveal delay={0.3} className="mt-10 flex flex-col items-start gap-4">
              <Link
                to={`/sessions/${session.id}`}
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Pricing for this session
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* Chapter index: a sticky strip on desktop, a floating island on a
          phone. See ChapterNav for why they are not the same control. */}
      <ChapterNav chapters={guide.chapters} active={active} />

      {/* Chapters. The mobile scroll margin clears the floating island, which
          sits below the status-bar inset. */}
      {guide.chapters.map((chapter, i) => (
        <section
          key={chapter.id}
          id={chapter.id}
          className={`scroll-mt-[calc(12rem+env(safe-area-inset-top))] border-t border-line py-20 lg:scroll-mt-32 md:py-28 ${
            i % 2 === 1 ? 'bg-surface' : ''
          }`}
        >
          <div className="shell">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <Reveal className="label text-accent">
                  Chapter {String(i + 1).padStart(2, '0')}
                </Reveal>
                <MaskText
                  as="h2"
                  text={chapter.title}
                  className="display mt-5 text-[clamp(2rem,4.2vw,3.2rem)] text-ink"
                />
                {chapter.lead && (
                  <Reveal delay={0.14} className="mt-6 max-w-sm text-[1rem] leading-[1.85] text-muted italic">
                    {chapter.lead}
                  </Reveal>
                )}
              </div>

              <div className="space-y-12 lg:col-span-8">
                {chapter.blocks.map((block, b) => (
                  <GuideBlock
                    key={b}
                    block={block}
                    storageKey={`guide:${guide.id}:${chapter.id}:${b}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Close, and the other guides. */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="shell">
          <div className="max-w-2xl">
            <Reveal className="label text-accent">That is everything</Reveal>
            <MaskText
              text="Anything else, just ask."
              className="display mt-6 text-[clamp(2.2rem,5.2vw,3.8rem)] text-ink"
            />
            <Reveal delay={0.15} className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
              No question about this is too small — what to do with your hands, whether a color
              will work, whether we should move the whole thing because of the forecast. Message me
              and I will answer properly.
            </Reveal>
            <Reveal delay={0.22} className="mt-10 flex flex-wrap gap-4 print:hidden">
              <Link
                to="/contact"
                className="label rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
              >
                Ask me something
              </Link>
              {session && (
                <Link
                  to={`/sessions/${session.id}`}
                  className="label rounded-full border border-line px-9 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                >
                  The {session.title.toLowerCase()} session
                </Link>
              )}
            </Reveal>
          </div>

          <DrawRule className="mt-20" />

          <div className="mt-10 print:hidden">
            <p className="label text-faint">The other guides</p>
            <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    to={`/guides/${other.id}`}
                    className="display text-[1.6rem] text-muted transition-colors duration-400 hover:text-accent"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
