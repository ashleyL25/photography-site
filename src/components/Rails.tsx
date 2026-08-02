import { motion, useScroll, useSpring } from 'motion/react'
import clsx from 'clsx'
import { SECTIONS, SITE } from '@/data/site'
import { useActiveSection } from '@/lib/hooks'

const IDS = SECTIONS.map((s) => s.id)

/**
 * Fixed left-hand index rail — the page's navigational signature. A hairline
 * tracks total scroll progress; each section gets a tick that lengthens and
 * warms to copper as you reach it, with the label revealed on hover or when active.
 */
export function IndexRail() {
  const active = useActiveSection(IDS)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <motion.aside
      aria-hidden
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="group fixed top-1/2 left-8 z-50 hidden -translate-y-1/2 xl:block"
    >
      <div className="relative flex flex-col gap-5 pl-4">
        <span className="absolute top-1 bottom-1 left-0 w-px bg-line" />
        <motion.span
          className="absolute top-1 left-0 w-px origin-top bg-accent"
          style={{ scaleY: progress, height: 'calc(100% - 0.5rem)' }}
        />

        {SECTIONS.map((section) => {
          const on = active === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-3"
              tabIndex={-1}
            >
              <span
                className={clsx(
                  'h-px transition-all duration-500 ease-[var(--ease-out-expo)]',
                  on ? 'w-7 bg-accent' : 'w-3 bg-faint group-hover:w-5',
                )}
              />
              <span
                className={clsx(
                  'label whitespace-nowrap transition-all duration-500 ease-[var(--ease-out-expo)]',
                  on
                    ? 'translate-x-0 text-ink opacity-100'
                    : '-translate-x-1 text-faint opacity-0 group-hover:translate-x-0 group-hover:opacity-70',
                )}
              >
                {section.label}
              </span>
            </a>
          )
        })}
      </div>
    </motion.aside>
  )
}

/** Right-hand counterweight: a vertical Instagram link that keeps the margins symmetrical. */
export function SocialRail() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-1/2 right-8 z-50 hidden -translate-y-1/2 xl:block"
    >
      <a
        href={SITE.instagram}
        target="_blank"
        rel="noreferrer noopener"
        className="label flex items-center gap-5 text-faint transition-colors duration-400 hover:text-accent [writing-mode:vertical-rl]"
      >
        <span className="h-16 w-px bg-line" />
        {SITE.instagramHandle}
      </a>
    </motion.aside>
  )
}
