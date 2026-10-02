import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { TierCards, Tick } from '@/components/TierCards'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { usePricing, useRetouching, useSite, useWeather } from '@/lib/site'
import { EYEBROW, bool, frame, list, text, type WidgetProps } from './types'

/* ------------------------------------------------------------------ *
 * Investment — every session's tiers on tabs
 * ------------------------------------------------------------------ */

/**
 * Six session types × three tiers is eighteen cards, far too many at once, so
 * the session type is a tab and three cards show at a time. Each session's own
 * page carries the same ladder without the tabs.
 */
export function Investment({ content, styles }: WidgetProps) {
  const { sessions } = useSite()
  const pricing = usePricing()
  const retouching = useRetouching()
  const priced = sessions.filter((s) => s.tiers.length > 0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const f = frame(styles, { id: 'investment', pad: 'py-28 md:py-40', rule: true })

  const session = priced.find((s) => s.id === activeId) ?? priced[0]
  const hidePrices = session ? !session.pricesShown : false
  const editing = session ? retouching[session.editingStyle] : null

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <MaskText
              text={text(content, 'heading')}
              className="display mt-6 max-w-2xl text-[clamp(2.2rem,5.2vw,4.4rem)] text-ink"
            />
          </div>
          {text(content, 'blurb') && (
            <Reveal delay={0.15} className="max-w-sm pb-3 text-[0.95rem] leading-relaxed text-muted">
              {text(content, 'blurb')}
            </Reveal>
          )}
        </div>

        <DrawRule className="mt-14" />

        {session && (
          <>
            {/* Session type selector. The negative inline margin lets the row
                bleed to the screen edge as it scrolls on a phone, so the padding
                that replaces it has to come back on the same axis. */}
            <div
              role="tablist"
              aria-label="Session type"
              className="-mx-6 mt-10 flex gap-2 overflow-x-auto px-6 pb-10 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {priced.map((option) => {
                const selected = option.id === session.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(option.id)}
                    className={clsx(
                      'label shrink-0 rounded-full border px-6 py-3 whitespace-nowrap transition-colors duration-400',
                      selected
                        ? 'border-accent bg-accent text-canvas'
                        : 'border-line text-muted hover:border-accent hover:text-accent',
                    )}
                  >
                    {option.title}
                  </button>
                )
              })}
            </div>

            {/* Keyed on the session, so switching tab remounts the block and
                replays the entrance. Deliberately NOT wrapped in AnimatePresence:
                an exit animation here leaves the outgoing panel mounted and the
                incoming one never gets rendered. */}
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {session.intro && <p className="mb-12 max-w-2xl text-[1rem] leading-[1.85] text-muted">{session.intro}</p>}

              <TierCards
                tiers={session.tiers}
                cta={{ label: text(content, 'cta_label'), href: text(content, 'cta_href') || '#inquire' }}
                hidePrices={hidePrices}
              />

              {hidePrices && pricing.byRequestNote && (
                <p className="mt-10 max-w-2xl border-l border-accent/40 pl-6 text-[0.97rem] leading-[1.8] text-muted">
                  {pricing.byRequestNote}
                </p>
              )}

              {editing?.label && (
                <div className="mt-10 max-w-2xl">
                  <p className="label text-accent">{editing.label}</p>
                  <p className="mt-4 text-[0.95rem] leading-[1.8] text-muted">{editing.body}</p>
                </div>
              )}

              <div className="mt-10 flex flex-wrap items-baseline justify-between gap-6">
                {session.note ? (
                  <p className="max-w-xl text-[0.88rem] leading-relaxed text-faint italic">{session.note}</p>
                ) : (
                  <span />
                )}
                <Link
                  to={`/sessions/${session.slug}`}
                  className="label inline-flex shrink-0 items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  More about {session.title.toLowerCase()}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}

        {/* What every session carries, regardless of which card you picked. */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal className="label text-faint">{text(content, 'included_label')}</Reveal>
            <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {pricing.alwaysIncluded.map((line, i) => (
                <Reveal as="li" key={`${line}-${i}`} delay={i * 0.06} className="flex gap-4 text-[0.95rem] leading-relaxed text-muted">
                  <Tick className="mt-[0.55rem]" />
                  {line}
                </Reveal>
              ))}
            </ul>
          </div>

          {pricing.blackAndWhite.body && (
            <Reveal delay={0.2} className="lg:col-span-5">
              <p className="label text-accent">{pricing.blackAndWhite.eyebrow}</p>
              <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
                {pricing.blackAndWhite.body}
              </p>
            </Reveal>
          )}
        </div>

        {/* Add-ons — one flat list, priced, so nothing is a surprise later. */}
        {pricing.addOns.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <MaskText text={text(content, 'addons_heading')} className="display text-[clamp(1.9rem,4vw,3rem)] text-ink" />
              {text(content, 'addons_blurb') && (
                <Reveal delay={0.12} className="max-w-sm pb-2 text-[0.9rem] leading-relaxed text-muted">
                  {text(content, 'addons_blurb')}
                </Reveal>
              )}
            </div>

            <DrawRule className="mt-10" />

            <ul>
              {pricing.addOns.map((item, i) => (
                <Reveal
                  as="li"
                  key={`${item.label}-${i}`}
                  delay={i * 0.04}
                  className="grid gap-2 border-b border-line py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-10"
                >
                  <div>
                    <p className="text-[1.02rem] text-ink">{item.label}</p>
                    {item.detail && <p className="mt-1.5 max-w-xl text-[0.88rem] leading-relaxed text-muted">{item.detail}</p>}
                  </div>
                  <p className="display text-[1.6rem] whitespace-nowrap text-accent sm:text-right">{item.price}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        {/* How booking works. */}
        {bool(content, 'show_booking', true) && pricing.booking.steps.length > 0 && (
          <div className="mt-24">
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {pricing.booking.eyebrow}
            </Reveal>
            <MaskText
              text={pricing.booking.heading}
              className="display mt-6 max-w-3xl text-[clamp(1.9rem,4.2vw,3.2rem)] text-ink"
            />

            <ol className="mt-14 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
              {pricing.booking.steps.map((step, i) => (
                <Reveal key={`${step.title}-${i}`} delay={i * 0.08} className="bg-canvas p-8">
                  <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="display mt-5 text-[1.5rem] text-ink">{step.title}</h3>
                  <p className="mt-3 text-[0.93rem] leading-relaxed text-muted">{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        )}

        {text(content, 'footnote') && (
          <Reveal delay={0.2} className="mt-16 text-[0.85rem] text-faint italic">
            {text(content, 'footnote')}
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * How photographs are finished
 * ------------------------------------------------------------------ */

export function FinishingLevels({ content, styles }: WidgetProps) {
  const retouching = useRetouching()
  const f = frame(styles, { rule: true })
  const levels = [
    { key: 'retouched', ...retouching.retouched, applies: text(content, 'applies_retouched') },
    { key: 'natural', ...retouching.natural, applies: text(content, 'applies_natural') },
  ]

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
          {text(content, 'body') && (
            <Reveal delay={0.15} as="p" className="mt-8 text-[1.02rem] leading-[1.85] text-muted">
              {text(content, 'body')}
            </Reveal>
          )}
        </div>

        <div className="mt-16 grid gap-px overflow-hidden bg-line md:grid-cols-2">
          {levels.map((level, i) => (
            <Reveal key={level.key} delay={i * 0.1} className="bg-canvas p-8 md:p-10">
              <p className="label text-faint">{level.applies}</p>
              <h3 className="display mt-6 text-[clamp(1.8rem,3vw,2.4rem)] text-ink">{level.label}</h3>
              <p className="mt-5 text-[0.99rem] leading-[1.85] text-muted">{level.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Weather and moving a date
 * ------------------------------------------------------------------ */

export function WeatherPolicy({ content, styles }: WidgetProps) {
  const { columns, reschedule } = useWeather(text(content, 'word') || 'session')
  const f = frame(styles, { rule: true })

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column, i) => (
            <Reveal key={`${column.title}-${i}`} delay={i * 0.07}>
              <h3 className="text-[1.08rem] text-ink">{column.title}</h3>
              <p className="mt-3 text-[0.94rem] leading-[1.8] text-muted">{column.body}</p>
            </Reveal>
          ))}
        </div>

        {reschedule && (
          <Reveal
            delay={0.2}
            className="mt-14 max-w-3xl border-l border-accent/40 pl-6 text-[1rem] leading-[1.85] text-muted italic"
          >
            {reschedule}
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Gallery timeline
 * ------------------------------------------------------------------ */

const VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const

/** Twelve faint ticks along the rule, one per month, to sell the full year. */
function MonthTicks() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line"
          style={{ left: `${(i / 12) * 100}%` }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ delay: 0.5 + i * 0.035, duration: 0.4 }}
        />
      ))}
    </>
  )
}

/**
 * The gallery's twelve-month life, drawn as a timeline. The two reminder
 * markers sit close together at the far right, so labels alternate above and
 * below the rule to keep them from colliding, and the end markers anchor inward
 * so nothing overflows the container.
 */
export function GalleryTimeline({ content, styles }: WidgetProps) {
  const points = list<{ at: number; label: string; detail: string }>(content, 'points')
  const f = frame(styles, { id: 'delivery', pad: 'py-28 md:py-40', rule: true })

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.pad, f.className)}>
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.4vw,3.6rem)] text-ink" />
          </div>
          {text(content, 'body') && (
            <Reveal
              delay={0.15}
              as="p"
              className="self-end text-[1.02rem] leading-[1.85] text-muted lg:col-span-5 lg:col-start-8"
            >
              {text(content, 'body')}
            </Reveal>
          )}
        </div>

        {/* ---- Horizontal timeline ---- */}
        <div className="relative mt-28 hidden h-40 md:block">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2">
            <span className="absolute inset-0 bg-line" />
            <motion.span
              className="absolute inset-0 origin-left bg-accent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEWPORT}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <MonthTicks />
          </div>

          {points.map((point, i) => {
            const above = i % 2 === 1
            const anchor =
              point.at <= 0 ? 'translate-x-0 text-left' : point.at >= 100 ? '-translate-x-full text-right' : '-translate-x-1/2 text-center'

            return (
              <motion.div
                key={`${point.label}-${i}`}
                className="absolute top-1/2"
                style={{ left: `${point.at}%` }}
                initial={{ opacity: 0, y: above ? 12 : -12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ delay: 0.4 + i * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
                <span className={clsx('absolute left-0 w-px bg-accent/40', above ? 'bottom-0 h-10' : 'top-0 h-10')} />
                <div className={clsx('absolute w-44', anchor, above ? 'bottom-14' : 'top-14')}>
                  <p className="label text-ink">{point.label}</p>
                  <p className="mt-2 text-[0.85rem] leading-snug text-muted">{point.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ---- Stacked equivalent for narrow screens ---- */}
        <ol className="relative mt-16 space-y-10 border-l border-line pl-8 md:hidden">
          <motion.span
            className="absolute top-0 -left-px h-full w-px origin-top bg-accent"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          {points.map((point, i) => (
            <Reveal as="li" key={`${point.label}-${i}`} delay={i * 0.1} className="relative">
              <span className="absolute top-2 -left-[2.06rem] size-2 -translate-x-1/2 rounded-full bg-accent" />
              <p className="label text-ink">{point.label}</p>
              <p className="mt-2 text-[0.9rem] leading-snug text-muted">{point.detail}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
