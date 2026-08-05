import { Link } from 'react-router-dom'
import { GUIDES, GUIDES_INDEX } from '@/data/guides'
import { SESSIONS_BY_ID } from '@/data/site'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { MaskText, Reveal } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

/**
 * Index of the six client prep guides. These go out by email on booking, but
 * they live here as well — partly so a client can find theirs the night before
 * without digging through their inbox, and partly because they are a fair
 * advertisement for how a session is run.
 */
export default function GuidesPage() {
  useDocumentMeta(
    'Client guides — Ashley Photography',
    'Prep guides for every session type: what to wear, when to book hair and makeup, where we shoot, what to bring, and how the day runs.',
  )

  return (
    <>
      <PageHero
        eyebrow={GUIDES_INDEX.eyebrow}
        heading={GUIDES_INDEX.heading}
        body={GUIDES_INDEX.body}
        photoId={GUIDES_INDEX.photoId}
      />

      <section className="shell py-24 md:py-32">
        <ul className="border-t border-line">
          {GUIDES.map((guide, i) => {
            const session = SESSIONS_BY_ID[guide.id]

            return (
              <Reveal as="li" key={guide.id} delay={(i % 3) * 0.06} className="border-b border-line">
                <Link
                  to={`/guides/${guide.id}`}
                  className="group grid gap-8 py-10 md:grid-cols-12 md:items-center"
                >
                  <div className="hidden overflow-hidden md:col-span-2 md:block">
                    <Photo
                      id={guide.photoId}
                      alt=""
                      sizes="16vw"
                      className="aspect-[4/5]"
                      imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex items-baseline gap-4">
                      <span className="label text-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h2 className="display text-[clamp(1.9rem,4vw,2.9rem)] text-ink transition-colors duration-500 group-hover:text-accent">
                        {guide.title}
                      </h2>
                    </div>
                    <p className="mt-4 max-w-xl text-[0.98rem] leading-[1.85] text-muted">
                      {guide.subtitle}
                    </p>
                    <p className="label mt-5 text-faint">
                      {guide.chapters.length} chapters
                      {session ? ` · ${session.runs}` : ''}
                    </p>
                  </div>

                  <div className="md:col-span-3 md:col-start-10">
                    <span className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 group-hover:border-accent group-hover:text-accent">
                      Read it
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </section>

      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Why these exist
            </Reveal>
            <MaskText
              text="Nobody should be guessing the night before"
              className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
          </div>

          <div className="max-w-xl space-y-6 text-[1.04rem] leading-[1.9] text-muted lg:col-span-6 lg:col-start-7">
            <Reveal as="p">
              Almost every worry people bring to a session is a planning worry rather than a
              photography one: whether the outfit works, whether the haircut was a mistake, whether
              the forecast means it is off. I try to answer all of those in advance, so you can
              relax on the day of your session.
            </Reveal>
            <Reveal as="p" delay={0.08}>
              Your guide arrives the day you book. The checklists tick off and stay ticked on your
              own device, so you can pack over two evenings without losing your place, and every one
              of them prints cleanly if you would rather have it on paper on the kitchen table.
            </Reveal>
            <Reveal as="p" delay={0.16}>
              Not booked yet? Read them anyway — they are a clear preview of what a shoot with
              me actually feels like.
            </Reveal>
            <Reveal delay={0.24}>
              <Link
                to="/contact"
                className="label mt-4 inline-block rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
              >
                Start an inquiry
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
