import { Link } from 'react-router-dom'
import { ABOUT_PAGE, SITE } from '@/data/site'
import { BY_ID } from '@/data/photos.generated'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { DrawRule, MaskText, Parallax, Reveal, Unveil } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

/** First id that actually exists in the generated manifest. */
const resolve = (ids: string[]) => ids.find((id) => BY_ID[id])

export default function AboutPage() {
  const portrait = resolve(ABOUT_PAGE.portraits)
  const secondary = resolve(ABOUT_PAGE.secondary)

  useDocumentMeta(
    'About — Ashley Photography',
    'Natural-light portrait photography based in Urbandale, serving the Des Moines metro and central Iowa.',
  )

  return (
    <>
      <PageHero
        eyebrow={ABOUT_PAGE.eyebrow}
        heading={ABOUT_PAGE.heading}
        body={ABOUT_PAGE.intro}
        photoId="backgrounds-2024-07-05-park-practice-127"
      />

      {/* Portrait beside the three short essays. */}
      <section className="shell grid gap-16 py-24 md:py-32 lg:grid-cols-12 lg:gap-20">
        {/* Sticky so the portrait stays beside the essays instead of leaving a
            tall empty column once it scrolls past. */}
        <div className="relative lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <Parallax speed={0.05}>
            <Unveil className="arch" direction="left">
              {portrait && (
                <Photo
                  id={portrait}
                  alt="Ashley"
                  sizes="(min-width: 1024px) 36vw, 88vw"
                  className="aspect-[4/5]"
                />
              )}
            </Unveil>
          </Parallax>
          <Reveal delay={0.4} className="label mt-5 text-faint">
            {SITE.base}
          </Reveal>

          {secondary && (
            <div className="mt-8">
              <Unveil delay={0.2}>
                <Photo
                  id={secondary}
                  alt="Ashley"
                  sizes="(min-width: 1024px) 36vw, 88vw"
                  className="aspect-[4/5]"
                />
              </Unveil>
            </div>
          )}
        </div>

        <div className="space-y-14 lg:col-span-7">
          {ABOUT_PAGE.columns.map((column, i) => (
            <div key={column.title}>
              <Reveal delay={i * 0.08} className="label text-accent">
                {String(i + 1).padStart(2, '0')} · {column.title}
              </Reveal>
              <Reveal
                as="p"
                delay={0.06 + i * 0.08}
                className="mt-5 max-w-2xl text-[1.05rem] leading-[1.85] text-muted"
              >
                {column.body}
              </Reveal>
              {i < ABOUT_PAGE.columns.length - 1 && <DrawRule className="mt-14" />}
            </div>
          ))}
        </div>
      </section>

      {/* Milestones. */}
      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell">
          <MaskText
            text="How it went"
            className="display max-w-xl text-[clamp(2.2rem,5vw,4rem)] text-ink"
          />

          <ol className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT_PAGE.timeline.map((entry, i) => (
              <Reveal as="li" key={entry.year} delay={(i % 3) * 0.1}>
                <div className="flex items-baseline gap-4">
                  <span className="display text-[clamp(1.9rem,3vw,2.6rem)] text-accent">
                    {entry.year}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <h3 className="mt-4 text-[1.15rem] text-ink">{entry.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{entry.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Design aside + closing call to action. */}
      <section className="shell grid gap-16 py-24 md:py-32 lg:grid-cols-12 lg:gap-20">
        <Reveal className="lg:col-span-5">
          <p className="label text-accent">{ABOUT_PAGE.aside.title}</p>
          <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
            {ABOUT_PAGE.aside.body}
          </p>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <MaskText
            text="Want to make some?"
            className="display text-[clamp(2.2rem,5vw,3.8rem)] text-ink"
          />
          <Reveal delay={0.12} className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="label rounded-full border border-ink px-8 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              Start an inquiry
            </Link>
            <Link
              to="/portfolio"
              className="label rounded-full border border-line px-8 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              See the portfolio
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
