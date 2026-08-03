import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform, type Variants } from 'motion/react'
import clsx from 'clsx'

const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' } as const

/** Simple fade-and-rise, the workhorse for body copy and small elements. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span'
}) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}

const wordVariants: Variants = {
  hidden: { y: '110%', rotate: 3 },
  shown: { y: '0%', rotate: 0 },
}

/**
 * Word-by-word mask reveal: each word rides up from behind a clipped line box,
 * staggered left to right. Used for every section heading so the page has one
 * recognizable typographic gesture rather than a grab-bag of effects.
 */
export function MaskText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  as: Tag = 'h2',
}: {
  text: string
  className?: string
  wordClassName?: string
  delay?: number
  stagger?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}) {
  const words = text.split(' ')
  return (
    <Tag className={className}>
      {/* Keyed on the text: the viewport trigger is one-shot, so if the copy is
          swapped under a mounted instance the new words inherit a spent parent
          and never leave the mask. A fresh key remounts and re-observes. */}
      <motion.span
        key={text}
        className="inline"
        initial="hidden"
        whileInView="shown"
        viewport={VIEWPORT}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-flex overflow-hidden pb-[0.12em] align-bottom"
          >
            <motion.span
              className={clsx('inline-block will-change-transform', wordClassName)}
              variants={wordVariants}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/**
 * A photograph that unveils itself: the frame wipes open from the bottom edge
 * while the image inside counter-scales, so the picture appears to settle into
 * place rather than simply fade in.
 */
export function Unveil({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
}) {
  const closed =
    direction === 'up'
      ? 'inset(100% 0% 0% 0%)'
      : direction === 'left'
        ? 'inset(0% 100% 0% 0%)'
        : 'inset(0% 0% 0% 100%)'

  return (
    <motion.div
      className={clsx('overflow-hidden', className)}
      initial={{ clipPath: closed }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: 1.25, delay, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.24 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/**
 * Scroll-linked vertical drift. `speed` is the total travel in viewport-height
 * units across the element's full pass through the viewport.
 */
export function Parallax({
  children,
  speed = 0.12,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`])
  const y = useSpring(raw, { stiffness: 90, damping: 22, mass: 0.4 })

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}

/** A hairline that draws itself across the width of its container. */
export function DrawRule({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={clsx('h-px w-full origin-left bg-line', className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
