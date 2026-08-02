import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react'
import { HERO, SITE } from '@/data/site'
import { Photo } from '@/components/Photo'
import { useReducedMotion } from '@/lib/hooks'

const HERO_PHOTO = 'engagement-june2022-54'
const INTRO_DELAY = 1.15

/** Letters rise out of a clipped line box, staggered left to right. */
function Letters({ text, className, delay }: { text: string; className?: string; delay: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              delay: delay + i * 0.055,
              duration: 1.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export function Hero() {
  const wrap = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })

  // As the page moves, the edge-to-edge plate draws itself in and grows an
  // arch, turning the opening frame into a hung print.
  const sideInset = useTransform(scrollYProgress, [0, 1], ['0%', '11%'])
  const topInset = useTransform(scrollYProgress, [0, 1], ['0%', '4%'])
  const arch = useTransform(scrollYProgress, [0, 1], ['0px', '320px'])
  const foot = useTransform(scrollYProgress, [0, 1], ['0px', '6px'])
  const clipPath = useMotionTemplate`inset(${topInset} ${sideInset} ${topInset} ${sideInset} round ${arch} ${arch} ${foot} ${foot})`

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-38%'])
  // Clear the type early — a half-faded wordmark lying over someone's face
  // reads as a rendering fault, not a transition.
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scrim = useTransform(scrollYProgress, [0, 1], [0.42, 0.12])

  return (
    <div ref={wrap} id="hero" className="relative h-[168svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={reduced ? undefined : { clipPath }}
        >
          <Photo
            id={HERO_PHOTO}
            alt="A couple standing close together in a summer field, framed by a tree in full white blossom"
            sizes="100vw"
            priority
            className="h-full w-full"
            imgClassName={reduced ? undefined : 'ken-burns'}
          />
          <motion.div
            className="absolute inset-0"
            style={{ opacity: reduced ? 0.45 : scrim }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-[rgb(var(--scrim))]" />
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim)/0.55)] via-transparent to-[rgb(var(--scrim)/0.75)]"
          />
        </motion.div>

        {/* The hero always sits on a photograph, so its text is fixed light
            rather than themed — contrast has to hold in both palettes. */}
        <motion.div
          className="shell relative z-10 flex h-full flex-col justify-between py-24 text-beige md:py-28"
          style={reduced ? undefined : { y: textY, opacity: textOpacity }}
        >
          <motion.p
            className="label self-center text-beige/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: INTRO_DELAY + 0.7, duration: 1.2 }}
          >
            {HERO.eyebrow}
          </motion.p>

          {/* Dropped below the optical centre so the wordmark crosses the
              couple's torsos rather than their faces. */}
          <div className="flex translate-y-[9vh] flex-col items-center text-center">
            <h1 className="display flex flex-col items-center">
              <Letters
                text={HERO.lead}
                delay={INTRO_DELAY}
                className="block text-[clamp(4.5rem,20vw,17rem)] leading-[0.86] tracking-[0.02em]"
              />
              <span className="mt-6 flex w-full items-center gap-5 md:mt-8 md:gap-8">
                <motion.span
                  className="h-px flex-1 origin-right bg-beige/35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: INTRO_DELAY + 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <Letters
                  text={HERO.script}
                  delay={INTRO_DELAY + 0.32}
                  className="label shrink-0 text-[clamp(0.6rem,1.5vw,0.95rem)] tracking-[0.55em] text-beige/90"
                />
                <motion.span
                  className="h-px flex-1 origin-left bg-beige/35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: INTRO_DELAY + 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </h1>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-between">
            <motion.p
              className="max-w-sm text-center text-[0.95rem] leading-relaxed text-beige/80 md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: INTRO_DELAY + 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {HERO.sub}
            </motion.p>

            <motion.a
              href="#about"
              className="group flex items-center gap-4 text-beige"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: INTRO_DELAY + 1.1, duration: 1.1 }}
            >
              <span className="label text-beige/70 transition-colors group-hover:text-beige">
                {HERO.scroll}
              </span>
              <span className="relative block h-12 w-px overflow-hidden bg-beige/30">
                <motion.span
                  className="absolute inset-x-0 top-0 block h-4 bg-beige"
                  animate={{ y: [-16, 48] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
                />
              </span>
            </motion.a>
          </div>
        </motion.div>

        <span className="sr-only">
          {SITE.name} — {SITE.tagline}
        </span>
      </div>
    </div>
  )
}
