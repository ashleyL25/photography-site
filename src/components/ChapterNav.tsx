import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import clsx from 'clsx'

type Chapter = { id: string; title: string }

const num = (i: number) => String(i + 1).padStart(2, '0')

/** Where the island parks once it has been picked up. */
const STICKY_TOP = 'calc(1.25rem + env(safe-area-inset-top))'

/**
 * `true` once a sticky element has reached its offset and pinned.
 *
 * Measures the element's own distance from the top against its resolved `top`,
 * which is the only way to know without a sentinel — and `getComputedStyle`
 * resolves the `env()` in that offset for us. Read the *untransformed* wrapper,
 * not the pill inside it: `getBoundingClientRect` includes transforms, and the
 * pill is the thing this state then goes on to move.
 */
function useStuck(ref: React.RefObject<HTMLElement | null>) {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      const offset = parseFloat(getComputedStyle(el).top) || 0
      setStuck(el.getBoundingClientRect().top <= offset + 1)
    }

    check()
    addEventListener('scroll', check, { passive: true })
    addEventListener('resize', check)
    return () => {
      removeEventListener('scroll', check)
      removeEventListener('resize', check)
    }
  }, [ref])

  return stuck
}

/**
 * The chapter index for a prep guide, in two forms.
 *
 * Desktop keeps the full-width sticky strip: there is room for every chapter at
 * once, so showing them all is the best thing to do.
 *
 * Mobile gets a floating glass island instead, and deliberately does NOT try to
 * be the same control. A row of ten chips on a phone is a row you can only see
 * three of, with no hint that the rest exist and no way to tell where you are in
 * the document — a horizontal scrollbar would announce the problem rather than
 * solve it. So the island shows the one thing that is actually useful while you
 * read (which chapter you are in, and how far through you are) and holds the
 * full list behind a tap.
 *
 * Being an island also means nothing is sealed against the top edge of the
 * screen, which is what made the old sticky bar awkward on an iPhone: content
 * passing behind a detached, blurred object reads as intended rather than as a
 * gap.
 */
export function ChapterNav({ chapters, active }: { chapters: Chapter[]; active: string }) {
  return (
    <>
      <DesktopStrip chapters={chapters} active={active} />
      <FloatingIsland chapters={chapters} active={active} />
    </>
  )
}

function DesktopStrip({ chapters, active }: { chapters: Chapter[]; active: string }) {
  return (
    <nav
      aria-label="Chapters"
      className="sticky top-16 z-40 hidden border-y border-line bg-canvas/90 backdrop-blur-xl lg:block print:hidden"
    >
      <div className="shell flex gap-1 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chapters.map((chapter, i) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            aria-current={active === chapter.id ? 'true' : undefined}
            className={clsx(
              'label shrink-0 rounded-full border px-5 py-2.5 whitespace-nowrap transition-colors duration-400',
              active === chapter.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:border-accent hover:text-accent',
            )}
          >
            <span className="mr-2 text-[0.85em] opacity-60">{num(i)}</span>
            {chapter.title}
          </a>
        ))}
      </div>
    </nav>
  )
}

function FloatingIsland({ chapters, active }: { chapters: Chapter[]; active: string }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const stuck = useStuck(wrap)

  // Read progress, drawn as a ring around the chapter number. A spring keeps it
  // from twitching on a phone's jittery scroll.
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  const index = Math.max(
    0,
    chapters.findIndex((c) => c.id === active),
  )
  const current = chapters[index]
  if (!current) return null

  // Compact once it has actually been picked up off the page, so the shrink is
  // the moment it takes over rather than something that happened out of sight.
  const tight = stuck && !open

  return (
    <>
      {/* Tap anywhere else to dismiss. A button rather than a bare div so it is
          reachable by keyboard and announced. */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close chapter list"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-[rgb(var(--scrim))]/30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>

      {/* `sticky`, not `fixed`: the island sits in the page where the chapter
          index belongs — under the letter — and is only picked up once you
          scroll down to it. The wrapper stays transform-free so `useStuck` can
          measure it; the shrink rides on the pill inside. */}
      <div
        ref={wrap}
        style={{ top: STICKY_TOP }}
        className="sticky z-50 lg:hidden print:hidden"
      >
        <motion.div
          animate={{ y: tight ? -6 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={clsx(
            'mx-auto w-[min(21rem,calc(100vw-2rem))] overflow-hidden border border-line bg-surface/80 shadow-[0_8px_32px_rgb(0_0_0/0.12)] backdrop-blur-xl transition-[border-radius] duration-500',
            open ? 'rounded-[1.6rem]' : 'rounded-full',
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={clsx(
              'flex w-full items-center transition-all duration-500 ease-[var(--ease-out-expo)]',
              tight ? 'gap-3 px-3 py-2' : 'gap-4 px-4 py-3',
            )}
          >
            <ProgressRing value={progress} label={num(index)} tight={tight} />

            <span className="min-w-0 flex-1 text-left">
              <span className="label block text-[0.58rem] text-faint">
                Chapter {num(index)} of {String(chapters.length).padStart(2, '0')}
              </span>
              <span className="mt-1 block truncate text-[0.95rem] leading-tight text-ink">
                {current.title}
              </span>
            </span>

            <motion.span
              aria-hidden
              className="shrink-0 text-accent"
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor">
                <path d="M3 6l5 5 5-5" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.nav
                aria-label="Chapters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                {/* Capped so a ten-chapter guide cannot outgrow the screen. */}
                <ul className="max-h-[55svh] overflow-y-auto border-t border-line px-2 py-2">
                  {chapters.map((chapter, i) => {
                    const on = chapter.id === active
                    return (
                      <li key={chapter.id}>
                        <a
                          href={`#${chapter.id}`}
                          onClick={() => setOpen(false)}
                          aria-current={on ? 'true' : undefined}
                          className={clsx(
                            'flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors duration-300',
                            on ? 'bg-accent/10 text-accent' : 'text-muted active:bg-line',
                          )}
                        >
                          <span className="label w-5 shrink-0 text-[0.6rem] opacity-60">
                            {num(i)}
                          </span>
                          <span className="text-[0.95rem] leading-tight">{chapter.title}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

/** Chapter number with a scroll-progress ring drawn around it. */
function ProgressRing({
  value,
  label,
  tight,
}: {
  value: ReturnType<typeof useSpring>
  label: string
  tight: boolean
}) {
  return (
    <span
      className={clsx(
        'relative grid shrink-0 place-items-center transition-all duration-500',
        tight ? 'size-8' : 'size-9',
      )}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="1.5" className="stroke-line" />
        <motion.circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="stroke-accent"
          style={{ pathLength: value }}
        />
      </svg>
      <span className="label text-[0.6rem] text-accent">{label}</span>
    </span>
  )
}
