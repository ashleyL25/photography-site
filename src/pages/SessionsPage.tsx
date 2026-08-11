import { Link } from 'react-router-dom'
import { SESSIONS, SESSIONS_PAGE } from '@/data/site'
import { ALWAYS_INCLUDED, fromPrice, headlineTier } from '@/data/packages'
import { usePricingUnlocked } from '@/lib/pricing'
import { useMergedShoots } from '@/data/portfolio-remote'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { Tick } from '@/components/TierCards'
import { MaskText, Reveal } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

/**
 * The sessions index. Each of the six now has its own page at /sessions/<id>
 * with its own pricing ladder and prep guide, so this page's whole job is to
 * get you to the right one quickly.
 */
export default function SessionsPage() {
  const unlocked = usePricingUnlocked()
  const allShoots = useMergedShoots()

  useDocumentMeta(
    'Sessions — Ashley Photography',
    'Senior pictures, graduation, engagements, couples, families and pets. Pricing, what each session includes, and a prep guide for every one.',
  )

  return (
    <>
      <PageHero
        eyebrow={SESSIONS_PAGE.eyebrow}
        heading={SESSIONS_PAGE.heading}
        body={SESSIONS_PAGE.body}
        photoId={SESSIONS_PAGE.photoId}
      />

      <section className="shell py-24 md:py-32">
        <ul className="grid gap-x-8 gap-y-20 lg:grid-cols-2">
          {SESSIONS.map((session, i) => {
            const tier = headlineTier(session.id)
            // Published albums counted too, so the "N sessions" link does not
            // undercount the moment something goes up from the dashboard.
            const shoots = allShoots.filter((s) => s.category === session.filter)

            return (
              <Reveal as="li" key={session.id} delay={(i % 2) * 0.1}>
                <Link to={`/sessions/${session.id}`} className="group block">
                  <div className="arch overflow-hidden">
                    <Photo
                      id={session.photoId}
                      alt={session.title}
                      sizes="(min-width: 1024px) 44vw, 90vw"
                      className="aspect-[4/5]"
                      imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="label text-faint">{session.index}</span>
                      <h2 className="display text-[clamp(2rem,3.6vw,2.9rem)] text-ink transition-colors duration-500 group-hover:text-accent">
                        {session.title}
                      </h2>
                    </div>
                    <span className="label text-accent">
                      {fromPrice(session.id, unlocked)}
                    </span>
                  </div>

                  <p className="label mt-4 leading-[1.6] text-faint">{session.runs}</p>

                  <p className="mt-5 max-w-lg text-[1rem] leading-[1.85] text-muted">
                    {session.blurb}
                  </p>

                  {tier && (
                    <p className="mt-5 text-[0.9rem] text-faint italic">
                      Most booked: {tier.name} — {tier.spec.images}, {tier.spec.time.toLowerCase()}.
                    </p>
                  )}
                </Link>

                <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  <Link
                    to={`/sessions/${session.id}`}
                    className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors duration-400 hover:border-accent hover:text-accent"
                  >
                    The full session
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    to={`/guides/${session.id}`}
                    className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                  >
                    Prep guide
                  </Link>
                  {shoots.length > 0 && (
                    <Link
                      to={`/portfolio?c=${session.filter}`}
                      className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                    >
                      {shoots.length} {shoots.length === 1 ? 'session' : 'sessions'}
                    </Link>
                  )}
                </div>
              </Reveal>
            )
          })}
        </ul>
      </section>

      {/* The universal inclusions, stated once. */}
      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Whichever you pick
            </Reveal>
            <MaskText
              text="These come with all of them"
              className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
            <Reveal delay={0.16} className="mt-10 flex flex-col items-start gap-5">
              <Link
                to="/contact#investment"
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Every tier, every price
                <span aria-hidden>→</span>
              </Link>
              <Link
                to="/guides"
                className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                The client guides
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
            {ALWAYS_INCLUDED.map((line, i) => (
              <Reveal
                as="li"
                key={line}
                delay={i * 0.06}
                className="flex gap-5 border-b border-line pb-5 text-[1.02rem] leading-relaxed text-muted"
              >
                <Tick className="mt-[0.6rem]" />
                {line}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
