import { useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { MARQUEE } from '@/data/site'
import { useReducedMotion } from '@/lib/hooks'

/** Keeps `value` inside [min, max) by wrapping — used to loop the track seamlessly. */
function wrap(min: number, max: number, value: number) {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

function Track() {
  return (
    <span className="flex shrink-0 items-center">
      {MARQUEE.map((word) => (
        <span key={word} className="flex items-center">
          <span className="display px-8 text-[clamp(2.4rem,7vw,6rem)] whitespace-nowrap md:px-14">
            {word}
          </span>
          <svg viewBox="0 0 24 30" className="h-6 w-5 shrink-0 text-accent md:h-9 md:w-7">
            <path
              d="M1 29V12a11 11 0 0 1 22 0v17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      ))}
    </span>
  )
}

/**
 * Horizontal band of service words. It idles at a constant crawl, then speeds
 * up and reverses with the direction of the page scroll — so the band reads as
 * physically connected to the reader's movement.
 */
export function Marquee() {
  const reduced = useReducedMotion()
  const baseX = useMotionValue(0)
  const direction = useRef(1)

  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 46, stiffness: 380 })
  const factor = useTransform(smooth, [-1600, 0, 1600], [-4, 0, 4], { clamp: false })

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let move = direction.current * 1.6 * (delta / 1000)
    const f = factor.get()
    if (f < 0) direction.current = -1
    else if (f > 0) direction.current = 1
    move += move * Math.abs(f)
    baseX.set(wrap(-50, 0, baseX.get() - move))
  })

  const x = useTransform(baseX, (v) => `${v}%`)

  return (
    <section
      aria-label="Session types"
      className="relative overflow-hidden border-y border-line bg-surface py-8 md:py-12"
    >
      <motion.div className="flex w-max" style={reduced ? undefined : { x }}>
        {/* Two identical tracks so the 50% wrap is invisible. */}
        <Track />
        <Track />
      </motion.div>
    </section>
  )
}
