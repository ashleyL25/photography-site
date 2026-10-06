import { Heading } from './Heading'
import { useContext, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { TierCards, Tick } from '@/components/TierCards'
import { DrawRule, MaskText, Parallax, Reveal, RichParagraphs, Unveil } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'
import { usePricing, useRetouching, useSite } from '@/lib/site'
import { ArrowLink, Buttons, SmartLink, type ButtonValue } from './links'
import { EYEBROW, PreviewContext, bool, frame, list, text, useHost, type WidgetProps } from './types'
import type { PublicTier } from '@shared/types'

/**
 * The session a session widget shows: the page's own, or the one picked in its
 * Which session field. Null when there is neither — on an ordinary page with
 * nothing chosen yet — and the widget then draws nothing.
 */
export function useSourceSession(content: Record<string, unknown>) {
  const host = useHost()
  const { sessions } = useSite()
  const source = text(content, 'source') || 'host'
  if (source === 'pick') return sessions.find((s) => s.id === text(content, 'session')) ?? null
  if (host.kind === 'session') return host.session
  if (host.kind === 'guide') return host.session
  return null
}

/**
 * What a session widget draws in the dashboard preview when it has no session
 * to show, so it reads as "needs a choice" rather than as missing. Nothing on
 * the live site.
 */
export function NeedsSession({ label }: { label: string }) {
  const preview = useContext(PreviewContext)
  if (!preview) return null
  return (
    <section className="py-16">
      <div className="shell">
        <div className="border border-dashed border-line px-8 py-10 text-center">
          <p className="label text-accent">{label}</p>
          <p className="mt-3 text-[0.95rem] text-muted">
            This page isn’t a session’s own page — choose one under <em>Which session</em> to show it here.
          </p>
        </div>
      </div>
    </section>
  )
}

/** The session types a widget was told to show, in that order — or all of them. */
function usePickedSessions(content: Record<string, unknown>) {
  const { sessions } = useSite()
  const picked = list<string>(content, 'sessions')
  if (picked.length === 0) return sessions
  return picked.map((id) => sessions.find((s) => s.id === id)).filter((s): s is (typeof sessions)[number] => Boolean(s))
}

/** The tier marked featured, falling back to the middle of the ladder. */
export function headlineTier(tiers: PublicTier[]): PublicTier | undefined {
  return tiers.find((t) => t.featured) ?? tiers[Math.floor(tiers.length / 2)]
}

/* ------------------------------------------------------------------ *
 * Session list — the homepage's centerpiece interaction
 * ------------------------------------------------------------------ */

/**
 * On a fine pointer it reads as a bare typographic index — no thumbnails at all
 * — and the photograph for whichever row you are hovering flies in under the
 * cursor. On touch and narrow screens it degrades to a straightforward grid of
 * arch-topped cards, which is the better pattern there anyway.
 */
export function SessionsIndex({ content, styles }: WidgetProps) {
  const sessions = usePickedSessions(content)
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const f = frame(styles, { id: 'sessions', pad: 'py-28 md:py-40' })

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

  const active = sessions.find((s) => s.id === hovered)

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <Heading content={content} className="display mt-6 text-[clamp(3rem,9vw,7.5rem)] text-ink" />
          </div>
          {text(content, 'blurb') && (
            <Reveal delay={0.2} className="max-w-xs pb-4 text-[0.95rem] leading-relaxed text-muted">
              {text(content, 'blurb')}
            </Reveal>
          )}
        </div>

        <DrawRule className="mt-14" />

        {/* ---- Fine-pointer view: typographic index + cursor-tracked preview ---- */}
        <ul ref={listRef} className="relative hidden lg:block" onMouseMove={track} onMouseLeave={() => setHovered(null)}>
          {sessions.map((session, i) => (
            <li key={session.id} className="border-b border-line">
              <Link
                to={`/sessions/${session.slug}`}
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
                    <Photo src={active.photo} alt="" sizes="15rem" className="aspect-[3/4]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </ul>

        {/* ---- Touch / narrow view: arch card grid ---- */}
        <ul className="grid gap-x-6 gap-y-12 pt-12 sm:grid-cols-2 lg:hidden">
          {sessions.map((session, i) => (
            <Reveal as="li" key={session.id} delay={(i % 2) * 0.1}>
              <Link to={`/sessions/${session.slug}`} className="group block">
                <div className="arch overflow-hidden">
                  <Photo
                    src={session.photo}
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

/* ------------------------------------------------------------------ *
 * Session cards — the sessions page
 * ------------------------------------------------------------------ */

export function SessionCards({ content, styles }: WidgetProps) {
  const { albums } = useSite()
  const sessions = usePickedSessions(content)
  const f = frame(styles)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell', f.pad)} style={f.style}>
        <ul className="grid gap-x-8 gap-y-20 lg:grid-cols-2">
          {sessions.map((session, i) => {
            const tier = headlineTier(session.tiers)
            const count = session.category ? albums.filter((a) => a.category === session.category).length : 0

            return (
              <Reveal as="li" key={session.id} delay={(i % 2) * 0.1}>
                <Link to={`/sessions/${session.slug}`} className="group block">
                  <div className="arch overflow-hidden">
                    <Photo
                      src={session.photo}
                      alt={session.title}
                      sizes="(min-width: 1024px) 44vw, 90vw"
                      className="aspect-[4/5]"
                      imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="label text-faint">{session.index}</span>
                      <h2 className="display text-[clamp(2rem,3.6vw,2.9rem)] text-ink transition-colors duration-500 group-hover:text-accent">
                        {session.title}
                      </h2>
                    </div>
                    <span className="label text-accent">{session.fromPrice}</span>
                  </div>

                  <p className="label mt-4 leading-[1.6] text-faint">{session.runs}</p>
                  <p className="mt-5 max-w-lg text-[1rem] leading-[1.85] text-muted">{session.blurb}</p>

                  {tier && (
                    <p className="mt-5 text-[0.9rem] text-faint italic">
                      {text(content, 'featured_prefix')} {tier.name} — {tier.images}, {tier.time.toLowerCase()}.
                    </p>
                  )}
                </Link>

                <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  <Link
                    to={`/sessions/${session.slug}`}
                    className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors duration-400 hover:border-accent hover:text-accent"
                  >
                    {text(content, 'cta_label')}
                    <span aria-hidden>→</span>
                  </Link>
                  {session.guideSlug && (
                    <Link
                      to={`/guides/${session.guideSlug}`}
                      className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                    >
                      {text(content, 'guide_label')}
                    </Link>
                  )}
                  {count > 0 && (
                    <Link
                      to={`/portfolio?c=${session.category}`}
                      className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
                    >
                      {count} {count === 1 ? 'session' : 'sessions'}
                    </Link>
                  )}
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * In every session
 * ------------------------------------------------------------------ */

export function AlwaysIncluded({ content, styles }: WidgetProps) {
  const { alwaysIncluded } = usePricing()
  const f = frame(styles, { surface: true, rule: true })
  const links = list<{ label: string; href: string }>(content, 'links').filter((l) => l.label && l.href)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
          {links.length > 0 && (
            <Reveal delay={0.16} className="mt-10 flex flex-col items-start gap-5">
              {links.map((link, i) => (
                <ArrowLink key={link.href} href={link.href} label={link.label} quiet={i > 0} />
              ))}
            </Reveal>
          )}
        </div>

        <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
          {alwaysIncluded.map((line, i) => (
            <Reveal
              as="li"
              key={`${line}-${i}`}
              delay={i * 0.06}
              className="flex gap-5 border-b border-line pb-5 text-[1.02rem] leading-relaxed text-muted"
            >
              <Tick className="mt-[0.6rem]" />
              {line}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Pick your session
 * ------------------------------------------------------------------ */

export function SessionLinks({ content, styles }: WidgetProps) {
  const sessions = usePickedSessions(content)
  const f = frame(styles, { surface: true, rule: true })
  const closeHeading = text(content, 'close_heading')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading content={content} className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink" />
          <Reveal delay={0.12}>
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                to={`/sessions/${session.slug}`}
                className="display text-[1.6rem] text-muted transition-colors duration-400 hover:text-accent"
              >
                {session.title}
              </Link>
            </li>
          ))}
        </ul>

        {closeHeading && (
          <>
            <DrawRule className="mt-20" />
            <div className="mt-14 max-w-2xl">
              <MaskText text={closeHeading} className="display text-[clamp(2.2rem,5.2vw,3.8rem)] text-ink" />
              {text(content, 'close_body') && (
                <Reveal delay={0.15} as="p" className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
                  {text(content, 'close_body')}
                </Reveal>
              )}
              {text(content, 'close_label') && (
                <Reveal delay={0.22} className="mt-10">
                  <SmartLink
                    href={text(content, 'close_href') || '/contact'}
                    className="label rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
                  >
                    {text(content, 'close_label')}
                  </SmartLink>
                </Reveal>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * A session's own page
 * ------------------------------------------------------------------ */

/** The long copy and the two supporting frames. */
export function SessionOverview({ content, styles }: WidgetProps) {
  const session = useSourceSession(content)
  const custom = text(content, 'source') === 'custom'
  if (!custom && !session) return <NeedsSession label="What it actually is" />
  return (
    <TextPhotos
      content={content}
      styles={styles}
      body={custom ? text(content, 'body') : session!.detail}
      points={custom ? list<string>(content, 'points') : session!.points}
      photo={custom ? text(content, 'photo') : session!.photo}
      alt={custom ? text(content, 'photo_alt') : session!.title}
      photos={custom ? list<string>(content, 'photos') : session!.gallery}
    />
  )
}

const MAIN_SHAPE: Record<string, string> = {
  arch: 'arch aspect-[3/4]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
}

/**
 * Text and a ticked list beside a main photograph with smaller ones under it —
 * a session's "What it actually is", and the Text beside photographs widget.
 */
export function TextPhotos({
  content,
  styles,
  body,
  points,
  photo,
  alt,
  photos,
}: {
  content: Record<string, unknown>
  styles: Record<string, unknown>
  body: string
  points: string[]
  photo: string
  alt: string
  photos: string[]
}) {
  const f = frame(styles)
  const left = text(content, 'image_side') === 'left'
  const shape = text(content, 'shape') || 'arch'
  const count = Number(text(content, 'small_count') || '2')
  const small = photos.slice(0, count)
  const showPoints = bool(content, 'show_points', true) && points.length > 0

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-14 lg:grid-cols-12 lg:gap-16', f.pad)} style={f.style}>
        <div className={clsx('lg:col-span-6', left && 'lg:order-2 lg:col-start-7')}>
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          {text(content, 'heading') && <Heading content={content} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />}

          <RichParagraphs
            html={body}
            className="mt-10 max-w-xl space-y-6 text-[1.06rem] leading-[1.9] text-muted"
            step={0.06}
            start={0.06}
          />

          {showPoints && (
            <>
              <DrawRule className="mt-12" />
              <ul className="mt-8 space-y-4">
                {points.map((point, i) => (
                  <Reveal as="li" key={`${point}-${i}`} delay={i * 0.06} className="flex gap-4 text-[0.99rem] leading-relaxed text-muted">
                    <Tick className="mt-[0.6rem]" />
                    {point}
                  </Reveal>
                ))}
              </ul>
            </>
          )}

          <Reveal delay={0.2}>
            <Buttons buttons={list<ButtonValue>(content, 'buttons')} className="mt-10" />
          </Reveal>
        </div>

        <div className={clsx('lg:col-span-5', left ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-8')}>
          {photo && (
            <Parallax speed={0.05}>
              <Unveil className={shape === 'arch' ? 'arch' : undefined}>
                <Photo src={photo} alt={alt} sizes="(min-width: 1024px) 36vw, 90vw" className={MAIN_SHAPE[shape] ?? MAIN_SHAPE.arch} />
              </Unveil>
            </Parallax>
          )}

          {small.length > 0 && (
            <div className={clsx('mt-6 grid gap-6', small.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
              {small.map((p, i) => (
                <Unveil key={`${p}-${i}`} delay={0.15 + i * 0.1}>
                  <Photo src={p} alt="" sizes="(min-width: 1024px) 18vw, 44vw" className="aspect-[4/5]" />
                </Unveil>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** This session's tier ladder. */
export function SessionPricing({ content, styles }: WidgetProps) {
  const session = useSourceSession(content)
  const retouching = useRetouching()
  const { alwaysIncluded, byRequestNote } = usePricing()
  const f = frame(styles, { id: 'pricing', rule: true })
  if (!session) return <NeedsSession label="Session pricing" />
  if (session.tiers.length === 0) return null
  const hidePrices = !session.pricesShown
  const editing = retouching[session.editingStyle]

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <Heading content={content} className="display mt-6 text-[clamp(2.2rem,5vw,4rem)] text-ink" />
          </div>
          {session.intro && (
            <Reveal delay={0.15} className="max-w-md pb-3 text-[0.97rem] leading-[1.8] text-muted">
              {session.intro}
            </Reveal>
          )}
        </div>

        <DrawRule className="mt-14" />

        <div className="mt-12">
          <TierCards
            tiers={session.tiers}
            cta={{ label: text(content, 'cta_label'), to: `/contact?session=${session.slug}` }}
            hidePrices={hidePrices}
          />
        </div>

        {hidePrices && byRequestNote && (
          <Reveal delay={0.2} className="mt-10 max-w-2xl border-l border-accent/40 pl-6 text-[0.97rem] leading-[1.8] text-muted">
            {byRequestNote}
          </Reveal>
        )}

        {/* How much finishing work this kind of session gets. It is the reason
            the image counts differ so much between session types. */}
        {editing.label && (
          <Reveal delay={0.15} className="mt-12 max-w-2xl">
            <p className="label text-accent">{editing.label}</p>
            <p className="mt-4 text-[0.95rem] leading-[1.8] text-muted">{editing.body}</p>
          </Reveal>
        )}

        {session.note && (
          <Reveal delay={0.2} className="mt-10 max-w-2xl text-[0.9rem] leading-relaxed text-faint italic">
            {session.note}
          </Reveal>
        )}

        {alwaysIncluded.length > 0 && (
          <div className="mt-16 border-t border-line pt-10">
            <Reveal className="label text-faint">{text(content, 'included_label')}</Reveal>
            <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {alwaysIncluded.map((line, i) => (
                <Reveal as="li" key={`${line}-${i}`} delay={i * 0.05} className="flex gap-4 text-[0.94rem] leading-relaxed text-muted">
                  <Tick className="mt-[0.5rem]" />
                  {line}
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        <Reveal delay={0.2} className="mt-10">
          <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} quiet />
        </Reveal>
      </div>
    </section>
  )
}

/** The guide connected to this session. */
export function SessionGuide({ content, styles }: WidgetProps) {
  const session = useSourceSession(content)
  const { guides } = useSite()
  const f = frame(styles, { surface: true, rule: true })
  const slug = text(content, 'source') === 'guide' ? text(content, 'guide') : session?.guideSlug
  if (!slug) return session || text(content, 'source') === 'guide' ? null : <NeedsSession label="Session prep guide" />
  const guide = guides.find((g) => g.slug === slug)
  if (!guide) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[clamp(2.2rem,5vw,3.8rem)] text-ink" />
          {guide.subtitle && (
            <Reveal delay={0.15} className="mt-8 max-w-lg text-[1.04rem] leading-[1.9] text-muted">
              {guide.subtitle}
            </Reveal>
          )}
          <Reveal delay={0.22} className="mt-10">
            <Link
              to={`/guides/${guide.slug}`}
              className="label inline-block rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              {text(content, 'button_label')}
            </Link>
          </Reveal>
        </div>

        <dl className="lg:col-span-5 lg:col-start-8">
          {guide.meta.map((row, i) => (
            <Reveal key={`${row.label}-${i}`} delay={i * 0.05} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
              <dt className="label shrink-0 text-faint">{row.label}</dt>
              <dd className="text-right text-[0.98rem] text-ink">{row.value}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** Albums from this session's portfolio category. */
export function SessionAlbums({ content, styles }: WidgetProps) {
  const session = useSourceSession(content)
  const { albums } = useSite()
  const f = frame(styles, { rule: true })
  if (!session) return <NeedsSession label="Sessions like yours" />
  if (!session.category) return null
  const limit = typeof content.limit === 'number' ? content.limit : 3
  const shoots = albums.filter((a) => a.category === session.category).slice(0, limit)
  if (shoots.length === 0) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading content={content} className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink" />
          <Reveal delay={0.12}>
            <ArrowLink href={`/portfolio?c=${session.category}`} label={text(content, 'link_label')} />
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shoots.map((shoot, i) => (
            <Reveal as="li" key={shoot.id} delay={(i % 3) * 0.08}>
              <Link to={`/portfolio/${shoot.slug}`} className="group block">
                <div className="overflow-hidden">
                  <Photo
                    src={shoot.cover}
                    alt={shoot.title}
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 90vw"
                    className="aspect-[4/5]"
                    imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                  />
                </div>
                <h3 className="display mt-5 text-[1.5rem] text-ink transition-colors duration-400 group-hover:text-accent">
                  {shoot.title}
                </h3>
                <p className="label mt-2 text-faint">{shoot.dateLabel}</p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Previous and next through the sessions. */
export function SessionNav({ content, styles }: WidgetProps) {
  const current = useSourceSession(content)
  const { sessions } = useSite()
  const f = frame(styles, { surface: true, rule: true, pad: '' })
  if (!current || sessions.length < 2) return <NeedsSession label="Previous and next session" />

  const position = sessions.findIndex((s) => s.id === current.id)
  if (position < 0) return null
  const previous = sessions[(position - 1 + sessions.length) % sessions.length]
  const next = sessions[(position + 1) % sessions.length]

  return (
    <nav id={f.id} aria-label="Other sessions" className={f.className}>
      <div className="shell grid sm:grid-cols-2">
        {[
          { session: previous, direction: text(content, 'previous_label'), align: 'text-left sm:pr-10' },
          {
            session: next,
            direction: text(content, 'next_label'),
            align: 'border-t border-line sm:border-t-0 sm:border-l sm:pl-10 sm:text-right',
          },
        ].map((item) => (
          <Link key={item.direction} to={`/sessions/${item.session.slug}`} className={`group py-12 ${item.align}`}>
            <span className="label text-faint">{item.direction}</span>
            <span className="display mt-3 block text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink transition-colors duration-400 group-hover:text-accent">
              {item.session.title}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
