import { Heading } from './Heading'
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
import { swatchCss } from '@shared/palette'
import { ArrowLink, Buttons, type ButtonValue } from './links'
import { EYEBROW, bool, columns, fill, frame, list, text, useHostSession, type WidgetProps } from './types'

/* ------------------------------------------------------------------ *
 * Marquee
 * ------------------------------------------------------------------ */

/** Keeps `value` inside [min, max) by wrapping — used to loop the track seamlessly. */
function wrap(min: number, max: number, value: number) {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

const MARQUEE_SIZE: Record<string, string> = {
  sm: 'px-5 text-[clamp(1.4rem,3.4vw,2.6rem)] md:px-8',
  md: 'px-6 text-[clamp(1.9rem,5vw,4rem)] md:px-10',
  lg: 'px-8 text-[clamp(2.4rem,7vw,6rem)] md:px-14',
}

function Separator({ kind, size }: { kind: string; size: string }) {
  const small = size === 'sm'
  if (kind === 'none') return null
  if (kind === 'dot') return <span className={clsx('shrink-0 rounded-full bg-accent', small ? 'h-1.5 w-1.5' : 'h-2 w-2 md:h-3 md:w-3')} />
  if (kind === 'star')
    return (
      <svg viewBox="0 0 24 24" className={clsx('shrink-0 text-accent', small ? 'h-4 w-4' : 'h-6 w-6 md:h-8 md:w-8')}>
        <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 30" className={clsx('shrink-0 text-accent', small ? 'h-4 w-3.5' : 'h-6 w-5 md:h-9 md:w-7')}>
      <path d="M1 29V12a11 11 0 0 1 22 0v17" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const MARQUEE_FACE: Record<string, string> = {
  display: 'display',
  italic: 'font-serif italic',
  label: 'label tracking-[0.3em]',
}

function Track({ words, size, separator, face, outline }: { words: string[]; size: string; separator: string; face: string; outline: boolean }) {
  return (
    <span className="flex shrink-0 items-center">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="flex items-center">
          <span
            className={clsx('whitespace-nowrap', MARQUEE_FACE[face] ?? MARQUEE_FACE.display, MARQUEE_SIZE[size] ?? MARQUEE_SIZE.lg)}
            style={outline ? { color: 'transparent', WebkitTextStroke: '1px var(--ink)' } : undefined}
          >
            {word}
          </span>
          <Separator kind={separator} size={size} />
        </span>
      ))}
    </span>
  )
}

const MARQUEE_SPEED: Record<string, number> = { slow: 0.8, normal: 1.6, fast: 3.2 }

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
  const size = text(content, 'size') || 'lg'
  const separator = text(content, 'separator') || 'arch'
  const speed = MARQUEE_SPEED[text(content, 'speed')] ?? MARQUEE_SPEED.normal
  const reactive = bool(content, 'react_to_scroll', true)
  const face = text(content, 'face') || 'display'
  const outline = bool(content, 'outline')
  const heading = text(content, 'direction') === 'right' ? -1 : 1

  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 46, stiffness: 380 })
  const factor = useTransform(smooth, [-1600, 0, 1600], [-4, 0, 4], { clamp: false })

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let move = direction.current * heading * speed * (delta / 1000)
    const v = reactive ? factor.get() : 0
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
      className={clsx('relative overflow-hidden border-y border-line', f.pad, f.className)} style={f.style}
    >
      <motion.div className="flex w-max" style={reduced ? undefined : { x }}>
        {/* Two identical tracks so the 50% wrap is invisible. */}
        <Track words={words} size={size} separator={separator} face={face} outline={outline} />
        <Track words={words} size={size} separator={separator} face={face} outline={outline} />
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
  const left = text(content, 'image_side') === 'left'

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className={clsx('lg:col-span-7', left ? 'lg:order-2 lg:pl-12' : 'lg:pr-12')}>
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}

          <Heading content={content} className="display mt-8 text-[calc(clamp(2.2rem,5.4vw,4.6rem)*var(--hs,1))] text-ink" />

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
                    <dd className="display text-[calc(clamp(2.2rem,4vw,3.4rem)*var(--hs,1))] text-ink">{stat.value}</dd>
                  </Reveal>
                ))}
              </dl>
            </>
          )}
        </div>

        {/* `self-start` keeps this column the height of the photograph rather
            than the (much taller) text column, so the offset plate below can
            anchor to the plate's real bottom edge. */}
        <div className={clsx('relative lg:col-span-5 lg:self-start', left && 'lg:order-1')}>
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
            <div
              className={clsx(
                'absolute -bottom-20 w-[46%] lg:-bottom-28 lg:w-[54%]',
                left ? 'right-0 sm:right-4 lg:-right-28' : 'left-0 sm:left-4 lg:-left-28',
              )}
            >
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
  const prose = clsx(bool(content, 'drop_cap') && 'drop-cap', text(content, 'text_columns') === '2' && 'md:columns-2 md:gap-12 [&>*]:break-inside-avoid')

  if (layout === 'split') {
    return (
      <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            {eyebrow && (
              <Reveal className={clsx(EYEBROW, f.centered && 'justify-center')}>
                <span className="h-px w-10 bg-accent" />
                {eyebrow}
              </Reveal>
            )}
            {heading && (
              <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />
            )}
          </div>

          <div className="max-w-xl space-y-6 text-[1.04rem] leading-[1.9] text-muted lg:col-span-6 lg:col-start-7">
            <RichParagraphs html={text(content, 'body')} className={clsx('space-y-6', prose)} step={0.08} start={0} />
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
      <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
        <div className={f.shell}>
          <div className={f.measure('max-w-2xl')}>
          {eyebrow && <Reveal className="label text-accent">{eyebrow}</Reveal>}
          {heading && (
            <Heading content={content} className="display mt-6 text-[calc(clamp(2.2rem,5.2vw,3.8rem)*var(--hs,1))] text-ink" />
          )}
          <RichParagraphs
            html={text(content, 'body')}
            className={clsx('mt-8 space-y-6 text-[1.04rem] leading-[1.9] text-muted', prose)}
            start={0.15}
          />
          <Reveal delay={0.22}>
            <Buttons buttons={buttons} className={clsx('mt-10', f.centered && 'justify-center')} />
          </Reveal>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <div className={f.measure('max-w-2xl')}>
          {eyebrow && (
            <Reveal className={clsx(EYEBROW, f.centered && 'justify-center')}>
              <span className="h-px w-10 bg-accent" />
              {eyebrow}
            </Reveal>
          )}
          {heading && <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />}
          <RichParagraphs
            html={text(content, 'body')}
            className={clsx('mt-8 space-y-6 text-[1.02rem] leading-[1.85] text-muted', prose)}
            start={0.15}
          />
          <Reveal delay={0.22}>
            <Buttons buttons={buttons} className={clsx('mt-10', f.centered && 'justify-center')} />
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
  const right = text(content, 'image_side') === 'right'

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.pad, f.className)} style={f.style}>
      <div className="shell grid items-center gap-16 lg:grid-cols-12 lg:gap-20">
        <div className={clsx('relative lg:col-span-5', right && 'lg:order-2')}>
          <Parallax speed={0.05}>
            <Unveil className={text(content, 'shape') === 'arch' || !text(content, 'shape') ? 'arch' : undefined} direction={right ? 'right' : 'left'}>
              <Photo
                src={text(content, 'image')}
                alt={text(content, 'alt')}
                sizes="(min-width: 1024px) 36vw, 88vw"
                className={text(content, 'shape') === 'square' ? 'aspect-square' : 'aspect-[4/5]'}
              />
            </Unveil>
          </Parallax>

          {/* Framing rule that overshoots the plate — a printed-page gesture. */}
          {bool(content, 'frame_rule', true) && <Reveal
            delay={0.4}
            className={clsx(
              'pointer-events-none absolute -top-6 hidden h-[calc(100%+3rem)] w-[70%] border border-accent/40 lg:block',
              right ? '-left-6' : '-right-6',
            )}
          >
            <span className="sr-only" />
          </Reveal>}
        </div>

        <div className="lg:col-span-7">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}

          <Heading content={content} className="display mt-8 text-[calc(clamp(2.1rem,4.8vw,4rem)*var(--hs,1))] text-ink" />

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
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />
        </div>

        <div className={clsx('mt-16 grid gap-x-12 gap-y-14', columns(content.columns, '2'))}>
          {items.map((item, i) => (
            <Reveal key={`${item.title}-${i}`} delay={(i % 2) * 0.08}>
              {bool(content, 'show_numbers', true) && <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>}
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
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.2vw,3.2rem)*var(--hs,1))] text-ink" />
          {text(content, 'body') && (
            <Reveal delay={0.15} as="p" className="mt-8 max-w-md text-[1rem] leading-[1.85] text-muted">
              {text(content, 'body')}
            </Reveal>
          )}
          <Reveal delay={0.22} className="mt-10">
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>

        <ul className={clsx('lg:col-span-6 lg:col-start-7', text(content, 'list_columns') === '2' && 'sm:grid sm:grid-cols-2 sm:gap-x-10')}>
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
      <div className={clsx('shell grid gap-14 lg:grid-cols-12 lg:gap-16', f.pad)} style={f.style}>
        <div className="lg:col-span-7">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2.2rem,5vw,4rem)*var(--hs,1))] text-ink" />
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
      <div className={clsx('shell grid gap-16 lg:grid-cols-12 lg:gap-20', f.pad)} style={f.style}>
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
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <Heading content={content} className="display max-w-xl text-[calc(clamp(2.2rem,5vw,4rem)*var(--hs,1))] text-ink" />

        <ol className={clsx('mt-16 grid gap-x-10 gap-y-12', columns(content.columns, '3'))}>
          {entries.map((entry, i) => (
            <Reveal as="li" key={`${entry.year}-${i}`} delay={(i % 3) * 0.1}>
              <div className="flex items-baseline gap-4">
                <span className="display text-[calc(clamp(1.9rem,3vw,2.6rem)*var(--hs,1))] text-accent">{entry.year}</span>
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
      <div className={clsx('shell grid gap-16 lg:grid-cols-12 lg:gap-20', f.pad)} style={f.style}>
        <Reveal className="lg:col-span-5">
          <p className="label text-accent">{text(content, 'aside_title')}</p>
          <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
            {text(content, 'aside_body')}
          </p>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <Heading content={content} className="display text-[calc(clamp(2.2rem,5vw,3.8rem)*var(--hs,1))] text-ink" />
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
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      {/* The measure is capped on an inner element rather than on `shell`
          itself: `shell` carries `margin-inline: auto`, so narrowing it
          re-centres the block off the gutter every other section lines up on. */}
      <div className={f.shell}>
        <div className={text(content, 'layout') === 'split' ? 'grid items-end gap-10 lg:grid-cols-12' : f.measure('max-w-2xl')}>
        <div className={text(content, 'layout') === 'split' ? 'lg:col-span-7' : undefined}>
        {bool(content, 'rule') && <DrawRule className="mb-14" />}
        {text(content, 'eyebrow') && <Reveal className="label text-accent">{text(content, 'eyebrow')}</Reveal>}
        <Heading
          content={content}
          text={fill(text(content, 'heading'), tokens)}
          className="display mt-6 text-[calc(clamp(2.2rem,5.4vw,4rem)*var(--hs,1))] text-ink"
        />
        {text(content, 'body') && (
          <Reveal delay={0.15} className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
            {fill(text(content, 'body'), tokens)}
          </Reveal>
        )}
        </div>
        <Reveal delay={0.22} className={text(content, 'layout') === 'split' ? 'lg:col-span-5 lg:justify-self-end' : undefined}>
          <Buttons
            buttons={list<ButtonValue>(content, 'buttons')}
            className={clsx(text(content, 'layout') === 'split' ? 'lg:justify-end' : 'mt-10', f.centered && 'justify-center')}
            tokens={tokens}
          />
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
  const aside = text(content, 'style') === 'aside'
  const accent = swatchCss(text(content, 'swatch') || 'accent')
  const marks = bool(content, 'marks')
  const source = text(content, 'source')
  const image = text(content, 'image')
  const left = aside || f.align === 'left' || Boolean(image)

  const words = (
    <>
      {marks && (
        <span aria-hidden className="display block text-[5rem] leading-[0.6]" style={{ color: accent }}>
          “
        </span>
      )}
      {aside ? (
        <div className="border-l pl-8" style={{ borderColor: accent }}>
          <Reveal as="p" className="font-serif text-[clamp(1.4rem,2.6vw,2rem)] leading-[1.5] text-ink italic">
          {text(content, 'quote')}
        </Reveal>
        </div>
      ) : (
        <MaskText as="p" text={text(content, 'quote')} className="display text-[calc(clamp(1.9rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />
      )}
      {(text(content, 'attribution') || source) && (
        <Reveal delay={0.2} className={clsx('label mt-8', aside && 'pl-8')}>
          <span style={{ color: accent }}>{text(content, 'attribution')}</span>
          {source && <span className="ml-3 text-faint normal-case italic">{source}</span>}
        </Reveal>
      )}
    </>
  )

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      {image ? (
        <div className={clsx(f.shell, 'grid items-center gap-12 md:grid-cols-12 md:gap-16')}>
          <Unveil className="arch mx-auto w-2/3 md:col-span-4 md:w-full">
            <Photo src={image} alt="" sizes="(min-width: 768px) 28vw, 60vw" className="aspect-[4/5]" />
          </Unveil>
          <div className="md:col-span-7 md:col-start-6">{words}</div>
        </div>
      ) : (
        <div className={clsx(f.shell, !left && 'text-center', f.width === 'auto' && 'max-w-3xl', f.measure())}>{words}</div>
      )}
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
  const single = bool(content, 'one_at_a_time', true)
  const [openRows, setOpenRows] = useState<number[]>(bool(content, 'open_first', true) ? [0] : [])
  const toggle = (i: number) =>
    setOpenRows((rows) => (rows.includes(i) ? rows.filter((r) => r !== i) : single ? [i] : [...rows, i]))
  const stacked = text(content, 'layout') === 'stacked'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={clsx('shell grid gap-12', stacked ? 'max-w-3xl' : 'lg:grid-cols-12 lg:gap-20')}>
        <div className={stacked ? undefined : 'lg:col-span-4'}>
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4vw,3.2rem)*var(--hs,1))] text-ink" />
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

        <div className={stacked ? undefined : 'lg:col-span-7 lg:col-start-6'}>
          <DrawRule />
          {items.map((item, i) => (
            <Question
              key={`${item.q}-${i}`}
              item={item}
              open={openRows.includes(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
