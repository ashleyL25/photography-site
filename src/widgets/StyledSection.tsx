import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { DrawRule } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'

const g = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

const FOCAL: Record<string, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
}

const ENTRANCE = {
  fade: { initial: { opacity: 0 }, shown: { opacity: 1 } },
  rise: { initial: { opacity: 0, y: 48 }, shown: { opacity: 1, y: 0 } },
  scale: { initial: { opacity: 0, scale: 1.04 }, shown: { opacity: 1, scale: 1 } },
  curtain: { initial: { clipPath: 'inset(100% 0 0 0)' }, shown: { clipPath: 'inset(0% 0 0 0)' } },
} as const

/** The arch-and-rules ornament, the site's motif as a divider. */
function ArchRule() {
  return (
    <div aria-hidden className="shell flex items-center gap-5 py-2 text-accent/70">
      <span className="h-px flex-1 bg-line" />
      <svg viewBox="0 0 24 30" className="h-6 w-5 shrink-0">
        <path d="M1 29V12a11 11 0 0 1 22 0v17" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function Rule({ kind }: { kind: unknown }) {
  if (kind === 'line') return <div className="shell"><DrawRule /></div>
  if (kind === 'arch') return <ArchRule />
  return null
}

/**
 * The Style tab, applied around a section.
 *
 * Each widget renders its own section with the spacing and band it was
 * designed with; this paints what the Style tab adds on top — a colour band or
 * a photograph behind it, lines above and below, and an entrance animation —
 * and gets out of the way entirely when nothing is set, so an untouched page
 * renders exactly as it was built.
 */
export function StyledSection({ styles, children }: { styles: Record<string, unknown>; children: ReactNode }) {
  const bg = g(styles.background)
  const rules = g(styles.rules)
  const animation = g(styles.animation)
  const plain =
    (bg.scheme === 'auto' || !bg.scheme) &&
    !bg.image &&
    !(typeof animation.type === 'string' && animation.type in ENTRANCE) &&
    rules.top !== 'line' &&
    rules.top !== 'arch' &&
    rules.bottom !== 'line' &&
    rules.bottom !== 'arch'
  // Nothing set: no wrapper at all, so an untouched page is exactly as built.
  if (plain) return <>{children}</>
  return <Painted styles={styles}>{children}</Painted>
}

function Painted({ styles, children }: { styles: Record<string, unknown>; children: ReactNode }) {
  const bg = g(styles.background)
  const rules = g(styles.rules)
  const animation = g(styles.animation)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const scheme = typeof bg.scheme === 'string' && bg.scheme !== 'auto' ? bg.scheme : null
  const image = typeof bg.image === 'string' && bg.image ? bg.image : null
  const entrance = typeof animation.type === 'string' && animation.type in ENTRANCE ? (animation.type as keyof typeof ENTRANCE) : null
  const top = rules.top === 'line' || rules.top === 'arch' ? rules.top : null
  const bottom = rules.bottom === 'line' || rules.bottom === 'arch' ? rules.bottom : null

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  const overlay = typeof bg.overlay === 'number' ? bg.overlay : 55
  const parallax = bg.parallax !== false && !reduced

  const body = (
    <>
      {top && <Rule kind={top} />}
      {children}
      {bottom && <Rule kind={bottom} />}
    </>
  )

  return (
    <div
      ref={ref}
      className={clsx(
        'relative',
        image ? 'scheme-photo isolate overflow-hidden' : scheme && `scheme-${scheme}`,
        (image || (scheme && scheme !== 'canvas')) && 'bg-canvas text-ink',
      )}
    >
      {image && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <motion.div className="absolute -inset-y-[10%] inset-x-0" style={parallax ? { y: drift } : undefined}>
            <Photo
              src={image}
              alt=""
              sizes="100vw"
              className="h-full w-full"
              imgClassName={FOCAL[String(bg.focal)] ?? 'object-center'}
            />
          </motion.div>
          <div className="absolute inset-0 bg-[rgb(var(--scrim))]" style={{ opacity: overlay / 100 }} />
        </div>
      )}

      {entrance && !reduced ? (
        <motion.div
          initial={ENTRANCE[entrance].initial}
          whileInView={ENTRANCE[entrance].shown}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{
            duration: entrance === 'curtain' ? 1.2 : 0.9,
            delay: typeof animation.delay === 'number' ? animation.delay : 0,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {body}
        </motion.div>
      ) : (
        body
      )}
    </div>
  )
}
