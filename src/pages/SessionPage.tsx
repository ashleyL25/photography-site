import { Link, Navigate, useParams } from 'react-router-dom'
import { SESSIONS, SESSIONS_BY_ID } from '@/data/site'
import {
  ALWAYS_INCLUDED,
  EDITING_STYLE,
  PACKAGES_BY_SESSION,
  PRICING_BY_REQUEST,
  RETOUCHING,
  fromPrice,
  isPrivatePricing,
} from '@/data/packages'
import { GUIDES_BY_ID } from '@/data/guides'
import { SHOOTS_BY_DATE } from '@/data/shoots'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { TierCards, Tick } from '@/components/TierCards'
import { DrawRule, MaskText, Parallax, Reveal, Unveil } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'
import { usePricingUnlocked } from '@/lib/pricing'

/**
 * One session type in full: the long copy, its three tiers, its prep guide and
 * the real sessions of that kind from the portfolio.
 */
export default function SessionPage() {
  const { id = '' } = useParams()
  const session = SESSIONS_BY_ID[id]
  const unlocked = usePricingUnlocked()

  useDocumentMeta(
    session ? `${session.title} — Ashley Photography` : 'Sessions — Ashley Photography',
    // Never the unlocked figure: a meta description is for search engines, which
    // are exactly who the private list is being kept from.
    session ? `${session.blurb} ${session.runs}. ${fromPrice(session.id)}.` : undefined,
  )

  // An unknown slug is a mistyped URL rather than a missing page, so send it
  // back to the index instead of showing a 404.
  if (!session) return <Navigate to="/sessions" replace />

  const hidePrices = isPrivatePricing(session.id, unlocked)
  const retouching = RETOUCHING[EDITING_STYLE[session.id] ?? 'natural']
  const set = PACKAGES_BY_SESSION[session.id]
  const guide = GUIDES_BY_ID[session.id]
  const shoots = SHOOTS_BY_DATE.filter((s) => s.category === session.filter).slice(0, 3)

  const position = SESSIONS.findIndex((s) => s.id === session.id)
  const previous = SESSIONS[(position - 1 + SESSIONS.length) % SESSIONS.length]
  const next = SESSIONS[(position + 1) % SESSIONS.length]

  return (
    <>
      <PageHero
        eyebrow={`Session ${session.index}`}
        heading={session.title}
        body={session.blurb}
        photoId={session.heroPhotoId}
      >
        <Reveal delay={0.25} className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
          <span className="label text-champagne">{fromPrice(session.id, unlocked)}</span>
          <span aria-hidden className="hidden h-px w-10 bg-beige/30 sm:block" />
          <span className="label leading-[1.6] text-beige/70">{session.runs}</span>
        </Reveal>
      </PageHero>

      {/* Long copy and the two supporting frames. */}
      <section className="shell grid gap-14 py-24 md:py-32 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            What it actually is
          </Reveal>

          <div className="mt-10 max-w-xl space-y-6 text-[1.06rem] leading-[1.9] text-muted">
            {session.detail.map((paragraph, i) => (
              <Reveal key={i} as="p" delay={0.06 + i * 0.06}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          <DrawRule className="mt-12" />

          <ul className="mt-8 space-y-4">
            {session.points.map((point, i) => (
              <Reveal
                as="li"
                key={point}
                delay={i * 0.06}
                className="flex gap-4 text-[0.99rem] leading-relaxed text-muted"
              >
                <Tick className="mt-[0.6rem]" />
                {point}
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Parallax speed={0.05}>
            <Unveil className="arch">
              <Photo
                id={session.photoId}
                alt={session.title}
                sizes="(min-width: 1024px) 36vw, 90vw"
                className="aspect-[3/4]"
              />
            </Unveil>
          </Parallax>

          <div className="mt-6 grid grid-cols-2 gap-6">
            {session.gallery.map((photoId, i) => (
              <Unveil key={photoId} delay={0.15 + i * 0.1}>
                <Photo
                  id={photoId}
                  alt=""
                  sizes="(min-width: 1024px) 18vw, 44vw"
                  className="aspect-[4/5]"
                />
              </Unveil>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing ladder for this session type. */}
      {set && (
        <section id="pricing" className="scroll-mt-24 border-t border-line py-24 md:py-32">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <Reveal className="label flex items-center gap-4 text-accent">
                  <span className="h-px w-10 bg-accent" />
                  Investment
                </Reveal>
                <MaskText
                  text="Three ways to do it"
                  className="display mt-6 text-[clamp(2.2rem,5vw,4rem)] text-ink"
                />
              </div>
              <Reveal
                delay={0.15}
                className="max-w-md pb-3 text-[0.97rem] leading-[1.8] text-muted"
              >
                {set.intro}
              </Reveal>
            </div>

            <DrawRule className="mt-14" />

            <div className="mt-12">
              <TierCards
                set={set}
                cta={{ label: 'Inquire', to: `/contact?session=${session.id}` }}
                hidePrices={hidePrices}
              />
            </div>

            {hidePrices && (
              <Reveal
                delay={0.2}
                className="mt-10 max-w-2xl border-l border-accent/40 pl-6 text-[0.97rem] leading-[1.8] text-muted"
              >
                {PRICING_BY_REQUEST.note}
              </Reveal>
            )}

            {/* How much finishing work this kind of session gets. It is the
                reason the image counts differ so much between session types. */}
            <Reveal delay={0.15} className="mt-12 max-w-2xl">
              <p className="label text-accent">{retouching.label}</p>
              <p className="mt-4 text-[0.95rem] leading-[1.8] text-muted">{retouching.body}</p>
            </Reveal>

            {set.note && (
              <Reveal delay={0.2} className="mt-10 max-w-2xl text-[0.9rem] leading-relaxed text-faint italic">
                {set.note}
              </Reveal>
            )}

            <div className="mt-16 border-t border-line pt-10">
              <Reveal className="label text-faint">In every tier</Reveal>
              <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {ALWAYS_INCLUDED.map((line, i) => (
                  <Reveal
                    as="li"
                    key={line}
                    delay={i * 0.05}
                    className="flex gap-4 text-[0.94rem] leading-relaxed text-muted"
                  >
                    <Tick className="mt-[0.5rem]" />
                    {line}
                  </Reveal>
                ))}
              </ul>
            </div>

            <Reveal delay={0.2} className="mt-10">
              <Link
                to="/contact#investment"
                className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Add-ons and booking terms
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* The prep guide. This is the thing clients get sent, so it gets a block
          of its own rather than a link in a list. */}
      {guide && (
        <section className="border-t border-line bg-surface py-24 md:py-32">
          <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <Reveal className="label flex items-center gap-4 text-accent">
                <span className="h-px w-10 bg-accent" />
                Before the session
              </Reveal>
              <MaskText
                text="Your prep guide"
                className="display mt-6 text-[clamp(2.2rem,5vw,3.8rem)] text-ink"
              />
              <Reveal delay={0.15} className="mt-8 max-w-lg text-[1.04rem] leading-[1.9] text-muted">
                {guide.subtitle}
              </Reveal>
              <Reveal delay={0.22} className="mt-10">
                <Link
                  to={`/guides/${guide.id}`}
                  className="label inline-block rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
                >
                  Read the guide
                </Link>
              </Reveal>
            </div>

            <dl className="lg:col-span-5 lg:col-start-8">
              {guide.meta.map((row, i) => (
                <Reveal
                  key={row.label}
                  delay={i * 0.05}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-4"
                >
                  <dt className="label shrink-0 text-faint">{row.label}</dt>
                  <dd className="text-right text-[0.98rem] text-ink">{row.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Real sessions of this kind. */}
      {shoots.length > 0 && (
        <section className="border-t border-line py-24 md:py-32">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <MaskText
                text="Sessions like yours"
                className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink"
              />
              <Reveal delay={0.12}>
                <Link
                  to={`/portfolio?c=${session.filter}`}
                  className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  See them all
                  <span aria-hidden>→</span>
                </Link>
              </Reveal>
            </div>

            <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {shoots.map((shoot, i) => (
                <Reveal as="li" key={shoot.slug} delay={(i % 3) * 0.08}>
                  <Link to={`/portfolio/${shoot.slug}`} className="group block">
                    <div className="overflow-hidden">
                      <Photo
                        id={shoot.cover}
                        alt={shoot.title}
                        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 90vw"
                        className="aspect-[4/5]"
                        imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                      />
                    </div>
                    <h3 className="display mt-5 text-[1.5rem] text-ink transition-colors duration-400 group-hover:text-accent">
                      {shoot.title}
                    </h3>
                    <p className="label mt-2 text-faint">{shoot.date}</p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Previous / next through the six. */}
      <nav
        aria-label="Other sessions"
        className="border-t border-line bg-surface"
      >
        <div className="shell grid sm:grid-cols-2">
          {[
            { session: previous, direction: 'Previous', align: 'text-left sm:pr-10' },
            {
              session: next,
              direction: 'Next',
              align: 'border-t border-line sm:border-t-0 sm:border-l sm:pl-10 sm:text-right',
            },
          ].map((item) => (
            <Link
              key={item.direction}
              to={`/sessions/${item.session.id}`}
              className={`group py-12 ${item.align}`}
            >
              <span className="label text-faint">{item.direction}</span>
              <span className="display mt-3 block text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink transition-colors duration-400 group-hover:text-accent">
                {item.session.title}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Close. */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="shell max-w-2xl">
          <Reveal className="label text-accent">Bookings open</Reveal>
          <MaskText
            text={`Let’s plan your ${session.title.toLowerCase()}.`}
            className="display mt-6 text-[clamp(2.2rem,5.4vw,4rem)] text-ink"
          />
          <Reveal delay={0.15} className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
            Tell me roughly when, and where you picture it. If you are not sure which tier fits,
            describe what you want and I will tell you — including when the cheaper one is the right
            answer.
          </Reveal>
          <Reveal delay={0.22} className="mt-10 flex flex-wrap gap-4">
            <Link
              to={`/contact?session=${session.id}`}
              className="label rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              Inquire about this
            </Link>
            <Link
              to="/sessions"
              className="label rounded-full border border-line px-9 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              All six sessions
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
