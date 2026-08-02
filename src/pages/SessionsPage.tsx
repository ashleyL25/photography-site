import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ALWAYS_INCLUDED, PACKAGES, SESSIONS } from '@/data/site'
import { SHOOTS_BY_DATE } from '@/data/shoots'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { DrawRule, MaskText, Parallax, Reveal, Unveil } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

const PRICE = Object.fromEntries(PACKAGES.map((p) => [p.id, p]))

export default function SessionsPage() {
  useDocumentMeta(
    'Sessions — Ashley Photography',
    'Senior pictures, graduation, engagements, couples, families and pets — what each session includes and how it runs.',
  )

  return (
    <>
      <PageHero
        eyebrow="What I photograph"
        heading="Six kinds of session."
        body="One of them is a set package because everybody wants the same things from it. The other five are planned around you. Here is what each one actually involves."
        photoId="backgrounds-italy-2025-318"
      />

      {/* Jump list — six sessions is a long page. */}
      <nav
        aria-label="Sessions"
        className="sticky top-16 z-40 border-y border-line bg-canvas/90 backdrop-blur-xl"
      >
        <div className="shell flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SESSIONS.map((session) => (
            <a
              key={session.id}
              href={`#${session.id}`}
              className="label shrink-0 rounded-full border border-transparent px-5 py-2.5 whitespace-nowrap text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              {session.title}
            </a>
          ))}
        </div>
      </nav>

      {SESSIONS.map((session, i) => {
        const pkg = PRICE[session.packageId]
        const shoots = SHOOTS_BY_DATE.filter((s) => s.category === session.filter)
        const flip = i % 2 === 1

        return (
          <section
            key={session.id}
            id={session.id}
            className={clsx(
              'scroll-mt-32 border-t border-line py-20 md:py-28',
              flip && 'bg-surface',
            )}
          >
            <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
              {/* Plates. Order flips each section so the page alternates. */}
              <div
                className={clsx(
                  'relative lg:col-span-5',
                  flip ? 'lg:order-2 lg:col-start-8' : 'lg:order-1',
                )}
              >
                <Parallax speed={0.05}>
                  <Unveil className="arch" direction={flip ? 'right' : 'left'}>
                    <Photo
                      id={session.photoId}
                      alt={session.title}
                      sizes="(min-width: 1024px) 36vw, 90vw"
                      className="aspect-[3/4]"
                    />
                  </Unveil>
                </Parallax>

                <div className="mt-6 grid grid-cols-2 gap-6">
                  {session.gallery.map((id, g) => (
                    <Unveil key={id} delay={0.15 + g * 0.1}>
                      <Photo
                        id={id}
                        alt=""
                        sizes="(min-width: 1024px) 18vw, 44vw"
                        className="aspect-[4/5]"
                      />
                    </Unveil>
                  ))}
                </div>
              </div>

              <div className={clsx('lg:col-span-6', flip ? 'lg:order-1' : 'lg:order-2')}>
                <Reveal className="label flex items-center gap-4 text-accent">
                  <span className="h-px w-10 bg-accent" />
                  {session.index} · {pkg ? pkg.price : 'By quote'}
                </Reveal>

                <MaskText
                  text={session.title}
                  className="display mt-6 text-[clamp(2.4rem,6vw,4.6rem)] text-ink"
                />

                <div className="mt-8 max-w-xl space-y-6 text-[1.05rem] leading-[1.85] text-muted">
                  {session.detail.map((paragraph, d) => (
                    <Reveal key={d} as="p" delay={0.08 + d * 0.08}>
                      {paragraph}
                    </Reveal>
                  ))}
                </div>

                <DrawRule className="mt-12" />

                <ul className="mt-8 space-y-4">
                  {session.points.map((point, pi) => (
                    <Reveal
                      as="li"
                      key={point}
                      delay={pi * 0.06}
                      className="flex gap-4 text-[0.98rem] leading-relaxed text-muted"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="mt-[0.6rem] size-2.5 shrink-0 text-accent"
                        aria-hidden
                      >
                        <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1.4" opacity=".8" />
                      </svg>
                      {point}
                    </Reveal>
                  ))}
                </ul>

                <Reveal delay={0.2} className="mt-12 flex flex-wrap gap-4">
                  <Link
                    to="/contact"
                    className="label rounded-full border border-ink px-8 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
                  >
                    Enquire about this
                  </Link>
                  {shoots.length > 0 && (
                    <Link
                      to={`/portfolio?c=${session.filter}`}
                      className="label rounded-full border border-line px-8 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                    >
                      See {shoots.length} {shoots.length === 1 ? 'session' : 'sessions'}
                    </Link>
                  )}
                </Reveal>
              </div>
            </div>
          </section>
        )
      })}

      {/* The universal inclusions, stated once at the end. */}
      <section className="border-t border-line py-24 md:py-32">
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
            <Reveal delay={0.16} className="mt-10">
              <Link
                to="/contact#investment"
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                See the pricing
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
                <span className="label shrink-0 pt-1 text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {line}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
