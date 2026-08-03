import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { ADD_ONS, ALWAYS_INCLUDED, BOOKING, PACKAGE_SETS } from '@/data/packages'
import { BLACK_AND_WHITE, SESSIONS_BY_ID } from '@/data/site'
import { TierCards, Tick } from '@/components/TierCards'
import { DrawRule, MaskText, Reveal } from '@/components/motion'

/**
 * Pricing. Lives on the contact page, directly above the FAQ — hence the
 * same-page `#enquire` links rather than a route change.
 *
 * Six session types × three tiers is eighteen cards, which is far too many to
 * show at once, so the session type is a tab and three cards show at a time.
 * Each session's own page carries the same ladder without the tabs.
 */
export function Investment() {
  const [activeId, setActiveId] = useState(PACKAGE_SETS[0].id)
  const set = PACKAGE_SETS.find((s) => s.id === activeId) ?? PACKAGE_SETS[0]
  const session = SESSIONS_BY_ID[set.id]

  return (
    <section id="investment" className="relative scroll-mt-24 border-t border-line py-28 md:py-40">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Investment
            </Reveal>
            <MaskText
              text="Three tiers for every kind of session"
              className="display mt-6 max-w-2xl text-[clamp(2.2rem,5.2vw,4.4rem)] text-ink"
            />
          </div>
          <Reveal delay={0.15} className="max-w-sm pb-3 text-[0.95rem] leading-relaxed text-muted">
            Nothing is quoted after the fact. Pick the session, then pick how much of a day you
            want — the time, the locations, the outfits and the number of photographs are stated on
            every tier.
          </Reveal>
        </div>

        <DrawRule className="mt-14" />

        {/* Session type selector. */}
        <div
          role="tablist"
          aria-label="Session type"
          className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-8 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {PACKAGE_SETS.map((option) => {
            const label = SESSIONS_BY_ID[option.id]?.title ?? option.id
            const selected = option.id === activeId
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
                {label}
              </button>
            )
          })}
        </div>

        {/* Keyed on the set, so switching tab remounts the block and replays the
            entrance. Deliberately NOT wrapped in AnimatePresence: an exit
            animation here leaves the outgoing panel mounted and the incoming one
            never gets rendered, so the tab highlight moves and the cards do not. */}
        <motion.div
          key={set.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-10 max-w-2xl text-[1rem] leading-[1.85] text-muted">{set.intro}</p>

          <TierCards set={set} cta={{ label: 'Enquire', href: '#enquire' }} />

          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-6">
            {set.note ? (
              <p className="max-w-xl text-[0.88rem] leading-relaxed text-faint italic">
                {set.note}
              </p>
            ) : (
              <span />
            )}
            {session && (
              <Link
                to={`/sessions/${session.id}`}
                className="label inline-flex shrink-0 items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                More about {session.title.toLowerCase()}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </motion.div>

        {/* What every session carries, regardless of which card you picked. */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal className="label text-faint">In every session</Reveal>
            <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {ALWAYS_INCLUDED.map((line, i) => (
                <Reveal
                  as="li"
                  key={line}
                  delay={i * 0.06}
                  className="flex gap-4 text-[0.95rem] leading-relaxed text-muted"
                >
                  <Tick className="mt-[0.55rem]" />
                  {line}
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal delay={0.2} className="lg:col-span-5">
            <p className="label text-accent">{BLACK_AND_WHITE.eyebrow}</p>
            <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
              {BLACK_AND_WHITE.body}
            </p>
          </Reveal>
        </div>

        {/* Add-ons — one flat list, priced, so nothing is a surprise later. */}
        <div className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <MaskText
              text="If you want more"
              className="display text-[clamp(1.9rem,4vw,3rem)] text-ink"
            />
            <Reveal delay={0.12} className="max-w-sm pb-2 text-[0.9rem] leading-relaxed text-muted">
              Added before the session or after it — including after you have seen the gallery and
              changed your mind, which is the most common one.
            </Reveal>
          </div>

          <DrawRule className="mt-10" />

          <ul>
            {ADD_ONS.map((item, i) => (
              <Reveal
                as="li"
                key={item.label}
                delay={i * 0.04}
                className="grid gap-2 border-b border-line py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-10"
              >
                <div>
                  <p className="text-[1.02rem] text-ink">{item.label}</p>
                  {item.detail && (
                    <p className="mt-1.5 max-w-xl text-[0.88rem] leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  )}
                </div>
                <p className="display text-[1.6rem] whitespace-nowrap text-accent sm:text-right">
                  {item.price}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* How booking works. */}
        <div className="mt-24">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            {BOOKING.eyebrow}
          </Reveal>
          <MaskText
            text={BOOKING.heading}
            className="display mt-6 max-w-3xl text-[clamp(1.9rem,4.2vw,3.2rem)] text-ink"
          />

          <ol className="mt-14 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
            {BOOKING.steps.map((step, i) => (
              <Reveal key={step.index} delay={i * 0.08} className="bg-canvas p-8">
                <span className="label text-faint">{step.index}</span>
                <h3 className="display mt-5 text-[1.5rem] text-ink">{step.title}</h3>
                <p className="mt-3 text-[0.93rem] leading-relaxed text-muted">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.2} className="mt-16 text-[0.85rem] text-faint italic">
          Travel anywhere in the Des Moines metro is included; further afield is welcome for a
          travel fee, quoted before you commit to anything.
        </Reveal>
      </div>
    </section>
  )
}
