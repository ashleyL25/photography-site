import { Link } from 'react-router-dom'
import { EXPERIENCE_PAGE, SESSIONS } from '@/data/site'
import { RESCHEDULE_NOTE, RETOUCHING, weatherColumns } from '@/data/policy'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { Tick } from '@/components/TierCards'
import { DrawRule, MaskText, Parallax, Reveal, Unveil } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

const { arc, principles, finishing, receive, weather, close } = EXPERIENCE_PAGE

/** The two editing levels, side by side. `applies` names who gets which. */
const FINISHING_LEVELS = (['retouched', 'natural'] as const).map((style) => ({
  style,
  ...RETOUCHING[style],
  applies: finishing.applies[style],
}))

/**
 * The universal half of a session, for anybody who has not booked yet.
 *
 * The prep guides at /guides/:id are the per-session version of this and go out
 * by email on booking; this page is everything those six have in common, so a
 * client can read how the whole thing works before committing to a date. The
 * weather block and the reschedule rule are imported from the guides rather than
 * restated, because two copies of a policy is one copy too many.
 */
export default function ExperiencePage() {
  useDocumentMeta(
    'The experience — Ashley Photography',
    'How a session runs from the first message to the finished album: planning, the day itself, what you receive, and what happens if the weather turns.',
  )

  return (
    <>
      <PageHero
        eyebrow={EXPERIENCE_PAGE.eyebrow}
        heading={EXPERIENCE_PAGE.heading}
        body={EXPERIENCE_PAGE.intro}
        photoId={EXPERIENCE_PAGE.photoId}
      />

      {/* The arc, beside a plate that drifts with it. */}
      <section className="shell grid gap-14 py-24 md:py-32 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            {arc.eyebrow}
          </Reveal>
          <MaskText
            text={arc.heading}
            className="display mt-6 text-[clamp(2.2rem,5vw,4rem)] text-ink"
          />
          <Reveal delay={0.15} as="p" className="mt-8 max-w-xl text-[1.02rem] leading-[1.85] text-muted">
            {arc.lead}
          </Reveal>

          <ol className="relative mt-16 space-y-12 border-l border-line pl-8">
            {arc.items.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 0.06} className="relative">
                <span className="absolute top-2 -left-[2.06rem] size-2 -translate-x-1/2 rounded-full bg-accent" />
                <p className="label text-accent">{item.time}</p>
                <h3 className="display mt-3 text-[1.6rem] text-ink">{item.title}</h3>
                <p className="mt-3 max-w-xl text-[0.99rem] leading-[1.85] text-muted">
                  {item.detail}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Sticky so the plate stays beside the list rather than leaving a tall
            empty column once it has scrolled past. */}
        <div className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start">
          <Parallax speed={0.04}>
            <Unveil className="arch">
              <Photo
                id="engagement-june2022-176"
                alt=""
                sizes="(min-width: 1024px) 30vw, 90vw"
                className="aspect-[3/4]"
              />
            </Unveil>
          </Parallax>
          <Reveal delay={0.35} className="label mt-5 text-faint">
            Central Iowa · golden hour
          </Reveal>
        </div>
      </section>

      {/* Four things that are always true. */}
      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell">
          <div className="max-w-2xl">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              {principles.eyebrow}
            </Reveal>
            <MaskText
              text={principles.heading}
              className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
            {principles.items.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 0.08}>
                <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="display mt-5 text-[1.7rem] text-ink">{item.title}</h3>
                <p className="mt-4 max-w-md text-[0.99rem] leading-[1.85] text-muted">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How the photographs are finished. This is the question clients compare
          photographers on, so it gets its own block rather than a footnote. */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="shell">
          <div className="max-w-2xl">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              {finishing.eyebrow}
            </Reveal>
            <MaskText
              text={finishing.heading}
              className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
            <Reveal delay={0.15} as="p" className="mt-8 text-[1.02rem] leading-[1.85] text-muted">
              {finishing.body}
            </Reveal>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden bg-line md:grid-cols-2">
            {FINISHING_LEVELS.map((level, i) => (
              <Reveal key={level.style} delay={i * 0.1} className="bg-canvas p-8 md:p-10">
                <p className="label text-faint">{level.applies}</p>
                <h3 className="display mt-6 text-[clamp(1.8rem,3vw,2.4rem)] text-ink">
                  {level.label}
                </h3>
                <p className="mt-5 text-[0.99rem] leading-[1.85] text-muted">{level.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What you receive — itemized. */}
      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              {receive.eyebrow}
            </Reveal>
            <MaskText
              text={receive.heading}
              className="display mt-6 text-[clamp(2rem,4.2vw,3.2rem)] text-ink"
            />
            <Reveal delay={0.15} as="p" className="mt-8 max-w-md text-[1rem] leading-[1.85] text-muted">
              {receive.body}
            </Reveal>
            <Reveal delay={0.22} className="mt-10">
              <Link
                to="/contact#investment"
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Packages and add-ons
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <ul className="lg:col-span-6 lg:col-start-7">
            {receive.items.map((line, i) => (
              <Reveal
                as="li"
                key={line}
                delay={i * 0.04}
                className="flex gap-5 border-b border-line py-5 text-[1rem] leading-relaxed text-muted"
              >
                <Tick className="mt-[0.55rem]" />
                {line}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Weather and reschedules — the same policy the guides carry. */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="shell">
          <div className="max-w-2xl">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              {weather.eyebrow}
            </Reveal>
            <MaskText
              text={weather.heading}
              className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink"
            />
          </div>

          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {weatherColumns('session').map((column, i) => (
              <Reveal key={column.title} delay={i * 0.07}>
                <h3 className="text-[1.08rem] text-ink">{column.title}</h3>
                <p className="mt-3 text-[0.94rem] leading-[1.8] text-muted">{column.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-14 max-w-3xl border-l border-accent/40 pl-6 text-[1rem] leading-[1.85] text-muted italic">
            {RESCHEDULE_NOTE}
          </Reveal>
        </div>
      </section>

      {/* Through to the six session types. */}
      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <MaskText
              text="Now pick your session"
              className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink"
            />
            <Reveal delay={0.12}>
              <Link
                to="/sessions"
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                All six, in detail
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {SESSIONS.map((session) => (
              <li key={session.id}>
                <Link
                  to={`/sessions/${session.id}`}
                  className="display text-[1.6rem] text-muted transition-colors duration-400 hover:text-accent"
                >
                  {session.title}
                </Link>
              </li>
            ))}
          </ul>

          <DrawRule className="mt-20" />

          <div className="mt-14 max-w-2xl">
            <MaskText
              text={close.heading}
              className="display text-[clamp(2.2rem,5.2vw,3.8rem)] text-ink"
            />
            <Reveal delay={0.15} as="p" className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
              {close.body}
            </Reveal>
            <Reveal delay={0.22} className="mt-10">
              <Link
                to="/contact"
                className="label rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
              >
                Ask me something
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
