import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { SESSIONS } from '@/data/site'
import { Photo } from '@/components/Photo'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'

/**
 * The session list is the page's centerpiece interaction.
 *
 * On a fine pointer it reads as a bare typographic index — no thumbnails at all
 * — and the photograph for whichever row you are hovering flies in under the
 * cursor. On touch and narrow screens it degrades to a straightforward grid of
 * arch-topped cards, which is the better pattern there anyway.
 */
export function Sessions() {
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 240, damping: 28, mass: 0.35 })
  const y = useSpring(pointerY, { stiffness: 240, damping: 28, mass: 0.35 })

  const track = (e: React.MouseEvent) => {
    const box = listRef.current?.getBoundingClientRect()
    if (!box) return
    pointerX.set(e.clientX - box.left)
    pointerY.set(e.clientY - box.top)
  }

  const active = SESSIONS.find((s) => s.id === hovered)

  return (
    <section id="sessions" className="relative scroll-mt-24 py-28 md:py-40">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              What I photograph
            </Reveal>
            <MaskText
              text="Sessions"
              className="display mt-6 text-[clamp(3rem,9vw,7.5rem)] text-ink"
            />
          </div>
          <Reveal delay={0.2} className="max-w-xs pb-4 text-[0.95rem] leading-relaxed text-muted">
            Six ways in. Senior sessions are a set package; everything else is planned around
            you — usually one location, chosen together, anywhere in the Des Moines metro.
          </Reveal>
        </div>

        <DrawRule className="mt-14" />

        {/* ---- Fine-pointer view: typographic index + cursor-tracked preview ---- */}
        <ul
          ref={listRef}
          className="relative hidden lg:block"
          onMouseMove={track}
          onMouseLeave={() => setHovered(null)}
        >
          {SESSIONS.map((session, i) => (
            <li key={session.id} className="border-b border-line">
              <Link
                to={`/sessions/${session.id}`}
                onMouseEnter={() => setHovered(session.id)}
                onFocus={() => setHovered(session.id)}
                onBlur={() => setHovered(null)}
                className="group grid grid-cols-12 items-center gap-8 py-9 transition-colors duration-500"
              >
                <motion.span
                  className="label col-span-1 text-faint transition-colors duration-500 group-hover:text-accent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  {session.index}
                </motion.span>

                {/* The trigger lives on the unclipped wrapper: a child sitting
                    fully outside an `overflow: hidden` parent never intersects,
                    so `whileInView` on it would wait forever. */}
                <motion.span
                  className="col-span-5 block overflow-hidden"
                  initial="hidden"
                  whileInView="shown"
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                >
                  <motion.span
                    className="display block text-[clamp(2rem,4.4vw,3.9rem)] whitespace-nowrap text-ink transition-colors duration-500 group-hover:text-accent"
                    variants={{ hidden: { y: '105%' }, shown: { y: '0%' } }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="inline-block transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-6">
                      {session.title}
                    </span>
                  </motion.span>
                </motion.span>

                <span className="col-span-5 max-w-md text-[0.95rem] leading-relaxed text-muted opacity-60 transition-opacity duration-500 group-hover:opacity-100">
                  {session.blurb}
                </span>

                <span className="col-span-1 flex justify-end">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 -translate-x-2 text-faint opacity-0 transition-all duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M4 12h16M14 6l6 6-6 6" strokeWidth="1.2" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}

          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 z-20 w-[15rem]"
              style={{ x, y, translateX: '-42%', translateY: '-52%' }}
            >
              <AnimatePresence mode="popLayout">
                {active && (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 0.9, rotate: -4, clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ opacity: 1, scale: 1, rotate: -2, clipPath: 'inset(0% 0 0 0)' }}
                    exit={{ opacity: 0, scale: 0.94, rotate: 2, clipPath: 'inset(0 0 100% 0)' }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="arch overflow-hidden shadow-2xl shadow-black/25"
                  >
                    <Photo
                      id={active.photoId}
                      alt=""
                      sizes="15rem"
                      className="aspect-[3/4]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </ul>

        {/* ---- Touch / narrow view: arch card grid ---- */}
        <ul className="grid gap-x-6 gap-y-12 pt-12 sm:grid-cols-2 lg:hidden">
          {SESSIONS.map((session, i) => (
            <Reveal as="li" key={session.id} delay={(i % 2) * 0.1}>
              <Link to={`/sessions/${session.id}`} className="group block">
                <div className="arch overflow-hidden">
                  <Photo
                    id={session.photoId}
                    alt={session.title}
                    sizes="(min-width: 640px) 44vw, 88vw"
                    className="aspect-[3/4]"
                    imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                </div>
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="label text-faint">{session.index}</span>
                  <h3 className="display text-[1.9rem] text-ink">{session.title}</h3>
                </div>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{session.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
