import { motion } from 'motion/react'
import clsx from 'clsx'
import { GALLERY } from '@/data/site'
import { MaskText, Reveal } from '@/components/motion'

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
 * The gallery's twelve-month life, drawn as a timeline.
 *
 * The two reminder markers sit close together at the far right, so labels
 * alternate above and below the rule to keep them from colliding, and the
 * end markers anchor inward so nothing overflows the container.
 */
export function Delivery() {
  return (
    <section
      id="delivery"
      className="relative scroll-mt-24 overflow-hidden border-t border-line py-28 md:py-40"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              {GALLERY.eyebrow}
            </Reveal>
            <MaskText
              text={GALLERY.heading}
              className="display mt-6 text-[clamp(2rem,4.4vw,3.6rem)] text-ink"
            />
          </div>
          <Reveal
            delay={0.15}
            as="p"
            className="self-end text-[1.02rem] leading-[1.85] text-muted lg:col-span-5 lg:col-start-8"
          >
            {GALLERY.body}
          </Reveal>
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

          {GALLERY.timeline.map((point, i) => {
            const above = i % 2 === 1
            const anchor =
              point.at === 0
                ? 'translate-x-0 text-left'
                : point.at === 100
                  ? '-translate-x-full text-right'
                  : '-translate-x-1/2 text-center'

            return (
              <motion.div
                key={point.label}
                className="absolute top-1/2"
                style={{ left: `${point.at}%` }}
                initial={{ opacity: 0, y: above ? 12 : -12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ delay: 0.4 + i * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
                <span
                  className={clsx(
                    'absolute left-0 w-px bg-accent/40',
                    above ? 'bottom-0 h-10' : 'top-0 h-10',
                  )}
                />
                <div
                  className={clsx(
                    'absolute w-44',
                    anchor,
                    above ? 'bottom-14' : 'top-14',
                  )}
                >
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
          {GALLERY.timeline.map((point, i) => (
            <Reveal as="li" key={point.label} delay={i * 0.1} className="relative">
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
