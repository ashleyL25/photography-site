import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform, type Variants } from 'motion/react'
import clsx from 'clsx'
import { useThemeSettings } from '@/lib/site'

const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' } as const

/**
 * The Theme settings' animation choices: whether things reveal at all, how
 * fast, how far they rise, and whether photographs drift.
 */
function useMotionPrefs() {
  const a = useThemeSettings('animation', 'global')
  return {
    reveals: a.reveals !== false,
    speed: typeof a.speed === 'number' && a.speed > 0 ? a.speed / 100 : 1,
    distance: typeof a.distance === 'number' ? a.distance : 28,
    parallax: a.parallax !== false,
  }
}

/** Simple fade-and-rise, the workhorse for body copy and small elements. */
export function Reveal({
  children,
  delay = 0,
  y,
  className,
  as = 'div',
  html,
}: {
  children?: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span'
  /** Sanitized rich text from the dashboard, rendered in place of children. */
  html?: string
}) {
  const Tag = motion[as]
  const prefs = useMotionPrefs()
  return (
    <Tag
      className={className}
      initial={prefs.reveals ? { opacity: 0, y: y ?? prefs.distance } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9 * prefs.speed, delay: delay * prefs.speed, ease: [0.16, 1, 0.3, 1] }}
      {...(html !== undefined ? { dangerouslySetInnerHTML: { __html: html } } : { children })}
    />
  )
}

/**
 * Rich text, one revealed paragraph at a time.
 *
 * The dashboard stores paragraphs as HTML; the hand-built site staggered each
 * paragraph in on its own. Splitting the HTML back into its top-level blocks
 * keeps that rhythm — and lists and headings in the copy still render as
 * themselves, just revealed as one block each.
 */
export function RichParagraphs({
  html,
  className,
  step = 0.12,
  start = 0.1,
}: {
  html: string
  className?: string
  step?: number
  start?: number
}) {
  const blocks = splitBlocks(html)
  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.tag === 'p' ? (
          <Reveal key={i} as="p" delay={start + i * step} html={block.inner} className="rich" />
        ) : (
          <Reveal key={i} delay={start + i * step} html={block.outer} className="rich" />
        ),
      )}
    </div>
  )
}

export function splitBlocks(html: string): { tag: string; inner: string; outer: string }[] {
  if (!html) return []
  const out: { tag: string; inner: string; outer: string }[] = []
  const re = /<(p|ul|ol|h2|h3|h4|blockquote)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi
  let match: RegExpExecArray | null
  let last = 0
  while ((match = re.exec(html))) {
    const between = html.slice(last, match.index).trim()
    if (between) out.push({ tag: 'p', inner: between, outer: `<p>${between}</p>` })
    out.push({ tag: match[1].toLowerCase(), inner: match[3], outer: match[0] })
    last = re.lastIndex
  }
  const tail = html.slice(last).trim()
  if (tail) out.push({ tag: 'p', inner: tail, outer: `<p>${tail}</p>` })
  return out.filter((b) => b.inner.replace(/<br\s*\/?>|&nbsp;|\s/g, '') !== '')
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
  const prefs = useMotionPrefs()
  return (
    <Tag className={className}>
      {/* Keyed on the text: the viewport trigger is one-shot, so if the copy is
          swapped under a mounted instance the new words inherit a spent parent
          and never leave the mask. A fresh key remounts and re-observes. */}
      <motion.span
        key={text}
        className="inline"
        initial={prefs.reveals ? 'hidden' : false}
        whileInView="shown"
        viewport={VIEWPORT}
        transition={{ staggerChildren: stagger * prefs.speed, delayChildren: delay * prefs.speed }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-flex overflow-hidden pb-[0.12em] align-bottom"
          >
            <motion.span
              className={clsx('inline-block will-change-transform', wordClassName)}
              variants={wordVariants}
              transition={{ duration: 1 * prefs.speed, ease: [0.16, 1, 0.3, 1] }}
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
  const prefs = useMotionPrefs()

  return (
    <motion.div
      className={clsx('overflow-hidden', className)}
      initial={prefs.reveals ? { clipPath: closed } : false}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: 1.25 * prefs.speed, delay: delay * prefs.speed, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="h-full w-full"
        initial={prefs.reveals ? { scale: 1.24 } : false}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.6 * prefs.speed, delay: delay * prefs.speed, ease: [0.16, 1, 0.3, 1] }}
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
  const travel = useMotionPrefs().parallax ? speed : 0
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [`${travel * 100}%`, `${-travel * 100}%`])
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
  const prefs = useMotionPrefs()
  return (
    <motion.div
      className={clsx('h-px w-full origin-left bg-line', className)}
      initial={prefs.reveals ? { scaleX: 0 } : false}
      whileInView={{ scaleX: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.4 * prefs.speed, delay: delay * prefs.speed, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
