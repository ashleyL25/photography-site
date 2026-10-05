import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { DrawRule, MaskText, Parallax, Reveal, RichParagraphs, Unveil } from '@/components/motion'
import { Tick } from '@/components/TierCards'
import { useReducedMotion } from '@/lib/hooks'
import { useSiteInfo } from '@/lib/site'
import { ArrowLink, Buttons, type ButtonValue } from './links'
import { EYEBROW, bool, fill, frame, list, text, useHostSession, type WidgetProps } from './types'

/* ------------------------------------------------------------------ *
 * Marquee
 * ------------------------------------------------------------------ */

/** Keeps `value` inside [min, max) by wrapping — used to loop the track seamlessly. */
function wrap(min: number, max: number, value: number) {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

function Track({ words }: { words: string[] }) {
  return (
    <span className="flex shrink-0 items-center">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="flex items-center">
          <span className="display px-8 text-[clamp(2.4rem,7vw,6rem)] whitespace-nowrap md:px-14">{word}</span>
          <svg viewBox="0 0 24 30" className="h-6 w-5 shrink-0 text-accent md:h-9 md:w-7">
            <path d="M1 29V12a11 11 0 0 1 22 0v17" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      ))}
    </span>
  )
}

/**
 * Horizontal band of words. It idles at a constant crawl, then speeds up and
 * reverses with the direction of the page scroll — so the band reads as
 * physically connected to the reader's movement.
 */
export function Marquee({ content, styles }: WidgetProps) {
  const reduced = useReducedMotion()
  const baseX = useMotionValue(0)
  const direction = useRef(1)
  const words = list<string>(content, 'items')
  const f = frame(styles, { pad: 'py-8 md:py-12', surface: true })

  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 46, stiffness: 380 })
  const factor = useTransform(smooth, [-1600, 0, 1600], [-4, 0, 4], { clamp: false })

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let move = direction.current * 1.6 * (delta / 1000)
    const v = factor.get()
    if (v < 0) direction.current = -1
    else if (v > 0) direction.current = 1
    move += move * Math.abs(v)
    baseX.set(wrap(-50, 0, baseX.get() - move))
  })

  const x = useTransform(baseX, (v) => `${v}%`)

  return (
    <section
      id={f.id}
      aria-label="Session types"
      className={clsx('relative overflow-hidden border-y border-line', f.pad, f.className)}
    >
      <motion.div className="flex w-max" style={reduced ? undefined : { x }}>
        {/* Two identical tracks so the 50% wrap is invisible. */}
        <Track words={words} />
        <Track words={words} />
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Story
 * ------------------------------------------------------------------ */

/**
 * The thesis of the page, set against a pair of offset plates that drift at
 * different rates.
 */
export function Story({ content, styles }: WidgetProps) {
  const f = frame(styles, { id: 'story', pad: 'py-28 md:py-44' })
  const stats = list<{ value: string; label: string }>(content, 'stats').filter((s) => s.value || s.label)
  const offset = text(content, 'image_offset')

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)}>
      <div className="shell grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7 lg:pr-12">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}

          <MaskText text={text(content, 'heading')} className="display mt-8 text-[clamp(2.2rem,5.4vw,4.6rem)] text-ink" />

          <RichParagraphs
            html={text(content, 'body')}
            className="mt-10 max-w-xl space-y-6 text-[1.05rem] leading-[1.85] text-muted"
          />

          {stats.length > 0 && (
            <>
              <DrawRule className="mt-14" delay={0.2} />
              <dl className="mt-10 grid grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                  <Reveal key={`${stat.label}-${i}`} delay={0.15 + i * 0.1}>
                    <dt className="label mb-3 text-faint">{stat.label}</dt>
                    <dd className="display text-[clamp(2.2rem,4vw,3.4rem)] text-ink">{stat.value}</dd>
                  </Reveal>
                ))}
              </dl>
            </>
          )}
        </div>

        {/* `self-start` keeps this column the height of the photograph rather
            than the (much taller) text column, so the offset plate below can
            anchor to the plate's real bottom edge. */}
        <div className="relative lg:col-span-5 lg:self-start">
          <Parallax speed={0.06}>
            <Unveil className="arch" delay={0.05}>
              <Photo
                src={text(content, 'image')}
                alt={text(content, 'alt')}
                sizes="(min-width: 1024px) 34vw, 90vw"
                className="aspect-[3/4.2]"
              />
            </Unveil>
          </Parallax>

          {offset && (
            <div className="absolute -bottom-20 left-0 w-[46%] sm:left-4 lg:-bottom-28 lg:-left-28 lg:w-[54%]">
              <Parallax speed={-0.14}>
                <Unveil delay={0.25} direction="left" className="ring-8 ring-canvas">
                  <Photo
                    src={offset}
                    alt={text(content, 'alt_offset')}
                    sizes="(min-width: 1024px) 18vw, 42vw"
                    className="aspect-[5/4]"
                  />
                </Unveil>
              </Parallax>
              {text(content, 'caption') && (
                <Reveal delay={0.5} className="label mt-5 text-faint">
                  {text(content, 'caption')}
                </Reveal>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Heading and text
 * ------------------------------------------------------------------ */

export function TextBlock({ content, styles }: WidgetProps) {
  const layout = text(content, 'layout')
  const f = frame(styles, { rule: layout !== 'stacked', surface: layout === 'split' })
  const buttons = list<ButtonValue>(content, 'buttons')
  const eyebrow = text(content, 'eyebrow')
  const heading = text(content, 'heading')

  if (layout === 'split') {
    return (
      <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            {eyebrow && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {eyebrow}
              </Reveal>
            )}
            {heading && (
              <MaskText text={heading} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
            )}
          </div>

          <div className="max-w-xl space-y-6 text-[1.04rem] leading-[1.9] text-muted lg:col-span-6 lg:col-start-7">
            <RichParagraphs html={text(content, 'body')} className="space-y-6" step={0.08} start={0} />
            <Reveal delay={0.24}>
              <Buttons buttons={buttons} className="mt-4" />
            </Reveal>
          </div>
        </div>
      </section>
    )
  }

  if (layout === 'close') {
    return (
      <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
        <div className="shell">
          <div className="max-w-2xl">
          {eyebrow && <Reveal className="label text-accent">{eyebrow}</Reveal>}
          {heading && (
            <MaskText text={heading} className="display mt-6 text-[clamp(2.2rem,5.2vw,3.8rem)] text-ink" />
          )}
          <RichParagraphs
            html={text(content, 'body')}
            className="mt-8 space-y-6 text-[1.04rem] leading-[1.9] text-muted"
            start={0.15}
          />
          <Reveal delay={0.22}>
            <Buttons buttons={buttons} className="mt-10" />
          </Reveal>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {eyebrow && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {eyebrow}
            </Reveal>
          )}
          {heading && <MaskText text={heading} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />}
          <RichParagraphs
            html={text(content, 'body')}
            className="mt-8 space-y-6 text-[1.02rem] leading-[1.85] text-muted"
            start={0.15}
          />
          <Reveal delay={0.22}>
            <Buttons buttons={buttons} className="mt-10" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Behind the camera
 * ------------------------------------------------------------------ */

export function AboutIntro({ content, styles }: WidgetProps) {
  const site = useSiteInfo()
  const f = frame(styles, { id: 'about', pad: 'py-28 md:py-40', surface: true, rule: true })

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.pad, f.className)}>
      <div className="shell grid items-center gap-16 lg:grid-cols-12 lg:gap-20">
        <div className="relative lg:col-span-5">
          <Parallax speed={0.05}>
            <Unveil className="arch" direction="left">
              <Photo
                src={text(content, 'image')}
                alt={text(content, 'alt')}
                sizes="(min-width: 1024px) 36vw, 88vw"
                className="aspect-[4/5]"
              />
            </Unveil>
          </Parallax>

          {/* Framing rule that overshoots the plate — a printed-page gesture. */}
          <Reveal
            delay={0.4}
            className="pointer-events-none absolute -top-6 -right-6 hidden h-[calc(100%+3rem)] w-[70%] border border-accent/40 lg:block"
          >
            <span className="sr-only" />
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}

          <MaskText text={text(content, 'heading')} className="display mt-8 text-[clamp(2.1rem,4.8vw,4rem)] text-ink" />

          <RichParagraphs
            html={text(content, 'body')}
            className="mt-10 max-w-2xl space-y-6 text-[1.05rem] leading-[1.85] text-muted"
            step={0.1}
          />

          <Reveal delay={0.4} className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
            {text(content, 'signature') && (
              <span
                className="display text-[2.6rem] leading-none text-accent"
                aria-hidden
                style={{ transform: 'rotate(-4deg)' }}
              >
                {text(content, 'signature')}
              </span>
            )}
            {bool(content, 'show_instagram', true) && site.instagram && (
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {site.instagramHandle}
                <span aria-hidden>↗</span>
              </a>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Numbered points
 * ------------------------------------------------------------------ */

export function NumberedCards({ content, styles }: WidgetProps) {
  const f = frame(styles, { surface: true, rule: true })
  const items = list<{ title: string; body: string }>(content, 'items')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
          {items.map((item, i) => (
            <Reveal key={`${item.title}-${i}`} delay={(i % 2) * 0.08}>
              <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="display mt-5 text-[1.7rem] text-ink">{item.title}</h3>
              <p className="mt-4 max-w-md text-[0.99rem] leading-[1.85] text-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Itemized list
 * ------------------------------------------------------------------ */

export function ChecklistSplit({ content, styles }: WidgetProps) {
  const f = frame(styles, { surface: true, rule: true })
  const items = list<string>(content, 'items')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.2vw,3.2rem)] text-ink" />
          {text(content, 'body') && (
            <Reveal delay={0.15} as="p" className="mt-8 max-w-md text-[1rem] leading-[1.85] text-muted">
              {text(content, 'body')}
            </Reveal>
          )}
          <Reveal delay={0.22} className="mt-10">
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>

        <ul className="lg:col-span-6 lg:col-start-7">
          {items.map((line, i) => (
            <Reveal
              as="li"
              key={`${line}-${i}`}
              delay={i * 0.04}
              className="flex gap-5 border-b border-line py-5 text-[1rem] leading-relaxed text-muted"
            >
              <Tick className="mt-[0.55rem]" />
              {line}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Start-to-finish timeline
 * ------------------------------------------------------------------ */

export function TimelineArc({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const items = list<{ time: string; title: string; detail: string }>(content, 'items')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-14 lg:grid-cols-12 lg:gap-16', f.pad)}>
        <div className="lg:col-span-7">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2.2rem,5vw,4rem)] text-ink" />
          {text(content, 'lead') && (
            <Reveal delay={0.15} as="p" className="mt-8 max-w-xl text-[1.02rem] leading-[1.85] text-muted">
              {text(content, 'lead')}
            </Reveal>
          )}

          <ol className="relative mt-16 space-y-12 border-l border-line pl-8">
            {items.map((item, i) => (
              <Reveal as="li" key={`${item.title}-${i}`} delay={i * 0.06} className="relative">
                <span className="absolute top-2 -left-[2.06rem] size-2 -translate-x-1/2 rounded-full bg-accent" />
                <p className="label text-accent">{item.time}</p>
                <h3 className="display mt-3 text-[1.6rem] text-ink">{item.title}</h3>
                <p className="mt-3 max-w-xl text-[0.99rem] leading-[1.85] text-muted">{item.detail}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Sticky so the plate stays beside the list rather than leaving a tall
            empty column once it has scrolled past. */}
        {text(content, 'image') && (
          <div className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start">
            <Parallax speed={0.04}>
              <Unveil className="arch">
                <Photo
                  src={text(content, 'image')}
                  alt={text(content, 'alt')}
                  sizes="(min-width: 1024px) 30vw, 90vw"
                  className="aspect-[3/4]"
                />
              </Unveil>
            </Parallax>
            {text(content, 'caption') && (
              <Reveal delay={0.35} className="label mt-5 text-faint">
                {text(content, 'caption')}
              </Reveal>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Portrait and short essays
 * ------------------------------------------------------------------ */

export function AboutEssays({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const columns = list<{ title: string; body: string }>(content, 'columns')
  const portrait = text(content, 'portrait')
  const secondary = text(content, 'secondary')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-16 lg:grid-cols-12 lg:gap-20', f.pad)}>
        {/* Sticky so the portrait stays beside the essays instead of leaving a
            tall empty column once it scrolls past. */}
        <div className="relative lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <Parallax speed={0.05}>
            <Unveil className="arch" direction="left">
              {portrait && (
                <Photo
                  src={portrait}
                  alt={text(content, 'portrait_alt')}
                  sizes="(min-width: 1024px) 36vw, 88vw"
                  className="aspect-[4/5]"
                />
              )}
            </Unveil>
          </Parallax>
          {text(content, 'caption') && (
            <Reveal delay={0.4} className="label mt-5 text-faint">
              {text(content, 'caption')}
            </Reveal>
          )}

          {secondary && (
            <div className="mt-8">
              <Unveil delay={0.2}>
                <Photo
                  src={secondary}
                  alt={text(content, 'secondary_alt')}
                  sizes="(min-width: 1024px) 36vw, 88vw"
                  className="aspect-[4/5]"
                />
              </Unveil>
            </div>
          )}
        </div>

        <div className="space-y-14 lg:col-span-7">
          {columns.map((column, i) => (
            <div key={`${column.title}-${i}`}>
              <Reveal delay={i * 0.08} className="label text-accent">
                {String(i + 1).padStart(2, '0')} · {column.title}
              </Reveal>
              <Reveal as="p" delay={0.06 + i * 0.08} className="mt-5 max-w-2xl text-[1.05rem] leading-[1.85] text-muted">
                {column.body}
              </Reveal>
              {i < columns.length - 1 && <DrawRule className="mt-14" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Milestones
 * ------------------------------------------------------------------ */

export function Milestones({ content, styles }: WidgetProps) {
  const f = frame(styles, { surface: true, rule: true })
  const entries = list<{ year: string; title: string; body: string }>(content, 'entries')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <MaskText text={text(content, 'heading')} className="display max-w-xl text-[clamp(2.2rem,5vw,4rem)] text-ink" />

        <ol className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, i) => (
            <Reveal as="li" key={`${entry.year}-${i}`} delay={(i % 3) * 0.1}>
              <div className="flex items-baseline gap-4">
                <span className="display text-[clamp(1.9rem,3vw,2.6rem)] text-accent">{entry.year}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-4 text-[1.15rem] text-ink">{entry.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{entry.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Aside and call to action
 * ------------------------------------------------------------------ */

export function AsideCta({ content, styles }: WidgetProps) {
  const f = frame(styles)
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-16 lg:grid-cols-12 lg:gap-20', f.pad)}>
        <Reveal className="lg:col-span-5">
          <p className="label text-accent">{text(content, 'aside_title')}</p>
          <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
            {text(content, 'aside_body')}
          </p>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <MaskText text={text(content, 'heading')} className="display text-[clamp(2.2rem,5vw,3.8rem)] text-ink" />
          <Reveal delay={0.12}>
            <Buttons buttons={list<ButtonValue>(content, 'buttons')} className="mt-10" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Closing call to action
 * ------------------------------------------------------------------ */

export function CtaClose({ content, styles }: WidgetProps) {
  const session = useHostSession()
  const f = frame(styles, { rule: true })
  const tokens: Record<string, string> = session
    ? { session: session.title.toLowerCase(), slug: session.slug, title: session.title }
    : { session: 'session', slug: '', title: '' }

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      {/* The measure is capped on an inner element rather than on `shell`
          itself: `shell` carries `margin-inline: auto`, so narrowing it
          re-centres the block off the gutter every other section lines up on. */}
      <div className="shell">
        <div className="max-w-2xl">
        {bool(content, 'rule') && <DrawRule className="mb-14" />}
        {text(content, 'eyebrow') && <Reveal className="label text-accent">{text(content, 'eyebrow')}</Reveal>}
        <MaskText
          text={fill(text(content, 'heading'), tokens)}
          className="display mt-6 text-[clamp(2.2rem,5.4vw,4rem)] text-ink"
        />
        {text(content, 'body') && (
          <Reveal delay={0.15} className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
            {fill(text(content, 'body'), tokens)}
          </Reveal>
        )}
        <Reveal delay={0.22}>
          <Buttons buttons={list<ButtonValue>(content, 'buttons')} className="mt-10" tokens={tokens} />
        </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Pull quote
 * ------------------------------------------------------------------ */

export function Quote({ content, styles }: WidgetProps) {
  const f = frame(styles)
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell max-w-3xl text-center">
        <MaskText as="p" text={text(content, 'quote')} className="display text-[clamp(1.9rem,4.4vw,3.4rem)] text-ink" />
        {text(content, 'attribution') && (
          <Reveal delay={0.2} className="label mt-8 text-accent">
            {text(content, 'attribution')}
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Questions
 * ------------------------------------------------------------------ */

function Question({
  item,
  open,
  onToggle,
}: {
  item: { q: string; a: string }
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full items-center justify-between gap-8 py-6 text-left"
        >
          <span
            className={clsx(
              'text-[1.08rem] transition-colors duration-400',
              open ? 'text-accent' : 'text-ink group-hover:text-accent',
            )}
          >
            {item.q}
          </span>
          <span className="relative grid size-6 shrink-0 place-items-center">
            <span className="absolute h-px w-4 bg-current transition-colors duration-400 group-hover:bg-accent" />
            <motion.span
              className="absolute h-4 w-px bg-current transition-colors duration-400 group-hover:bg-accent"
              animate={{ scaleY: open ? 0 : 1, rotate: open ? 90 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pr-10 pb-7 text-[1rem] leading-[1.85] text-muted">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Faq({ content, styles }: WidgetProps) {
  const f = frame(styles, { surface: true, rule: true })
  const items = list<{ q: string; a: string }>(content, 'items')
  const [open, setOpen] = useState<number | null>(bool(content, 'open_first', true) ? 0 : null)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-4">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4vw,3.2rem)] text-ink" />
          {text(content, 'intro') && (
            <Reveal delay={0.16} className="mt-8 max-w-sm text-[0.95rem] leading-relaxed text-muted">
              {text(content, 'intro')}
            </Reveal>
          )}
          {text(content, 'link_label') && (
            <Reveal delay={0.22} className="mt-8">
              <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} quiet />
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <DrawRule />
          {items.map((item, i) => (
            <Question
              key={`${item.q}-${i}`}
              item={item}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
