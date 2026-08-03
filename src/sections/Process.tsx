import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { PROCESS } from '@/data/site'
import { Photo } from '@/components/Photo'
import { MaskText, Reveal } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'

/** One pinned step. Later cards slide over earlier ones, which recede as they go. */
function Step({ step, index, total }: { step: (typeof PROCESS)[number]; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25])

  return (
    <div
      ref={ref}
      className="sticky"
      // `env(...)` clears the fixed header, which is taller by the status-bar
      // inset on iOS. Each card parks slightly lower than the last so the stack
      // stays legible as it collects.
      style={{
        top: `calc(6rem + env(safe-area-inset-top) + ${index * 1.75}rem)`,
        zIndex: index + 1,
      }}
    >
      <motion.article
        style={reduced ? undefined : { scale, opacity }}
        className="grid origin-top overflow-hidden rounded-sm border border-line bg-surface shadow-[0_-24px_70px_-40px_rgb(0_0_0/0.45)] md:grid-cols-2"
      >
        <div className="flex flex-col justify-between gap-10 p-8 md:p-14 lg:p-16">
          <div className="flex items-center justify-between">
            <span className="display text-[clamp(3.5rem,7vw,6rem)] leading-none text-accent">
              {step.index}
            </span>
            <span className="label text-faint">
              Step {index + 1} of {total}
            </span>
          </div>
          <div>
            <h3 className="display text-[clamp(2rem,3.6vw,3.1rem)] text-ink">{step.title}</h3>
            <p className="mt-5 max-w-md text-[1rem] leading-[1.85] text-muted">{step.body}</p>
          </div>
        </div>

        <div className="relative min-h-[16rem] md:min-h-[26rem]">
          <Photo
            id={step.photoId}
            alt=""
            sizes="(min-width: 768px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </motion.article>
    </div>
  )
}

export function Process() {
  return (
    <section
      id="process"
      className="relative scroll-mt-24 border-t border-line py-28 md:py-40"
    >
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            Start to finish
          </Reveal>
          <MaskText
            text="Three steps, and none of them are stressful."
            className="display mt-6 text-[clamp(2.2rem,5.2vw,4.4rem)] text-ink"
          />
        </div>

        <div className="mt-20 pb-16">
          {PROCESS.map((step, i) => (
            <Step key={step.index} step={step} index={i} total={PROCESS.length} />
          ))}
        </div>
      </div>
    </section>
  )
}
