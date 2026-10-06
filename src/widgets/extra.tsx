import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useInView } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { Reveal, RichParagraphs, Unveil } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'
import { useSite, useSiteInfo } from '@/lib/site'
import { Heading } from './Heading'
import { ArrowLink, Buttons, SmartLink, type ButtonValue } from './links'
import { AlbumCard, AlbumIndex } from './portfolio'
import { swatchCss, swatchColor } from '@shared/palette'
import { EYEBROW, bool, columns, frame, list, ratio, text, type WidgetProps } from './types'

/**
 * The widgets added after the site was rebuilt in the dashboard. Each is drawn
 * in the site's own vocabulary — the label with a rule, the display face, arch
 * tops, hairlines — so a page built from them reads as the same site.
 */

/** Eyebrow and heading, with an optional link to the right of them. */
function Head({
  content,
  centered,
  className,
  link,
}: {
  content: Record<string, unknown>
  centered?: boolean
  className?: string
  link?: { href: string; label: string }
}) {
  const eyebrow = text(content, 'eyebrow')
  const heading = text(content, 'heading')
  if (!eyebrow && !heading && !link?.label) return null
  return (
    <div className={clsx('flex flex-wrap items-end gap-6', centered ? 'justify-center text-center' : 'justify-between', className)}>
      <div className={clsx('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <Reveal className={clsx(EYEBROW, centered && 'justify-center')}>
            <span className="h-px w-10 bg-accent" />
            {eyebrow}
            {centered && <span className="h-px w-10 bg-accent" />}
          </Reveal>
        )}
        {heading && <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />}
      </div>
      {link?.label && (
        <Reveal delay={0.12}>
          <ArrowLink href={link.href} label={link.label} />
        </Reveal>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Kind words
 * ------------------------------------------------------------------ */

type Testimonial = { quote: string; name: string; detail: string; image: string }

function Attribution({ item, centered, photos = true, accent }: { item: Testimonial; centered?: boolean; photos?: boolean; accent?: string }) {
  return (
    <div className={clsx('flex items-center gap-4', centered && 'justify-center')}>
      {photos && item.image && <Photo src={item.image} alt="" sizes="56px" className="h-14 w-14 shrink-0 rounded-full" />}
      <div className={centered ? 'text-left' : undefined}>
        {item.name && <p className="label" style={{ color: accent }}>{item.name}</p>}
        {item.detail && <p className="mt-1 text-[0.9rem] text-muted italic">{item.detail}</p>}
      </div>
    </div>
  )
}

export function Testimonials({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const items = list<Testimonial>(content, 'items').filter((t) => t.quote)
  const layout = text(content, 'layout') || 'slider'
  const autoplay = bool(content, 'autoplay', true)
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const accent = swatchCss(text(content, 'swatch') || 'accent')
  const photos = bool(content, 'show_photos', true)

  useEffect(() => {
    if (layout !== 'slider' || !autoplay || reduced || paused || items.length < 2) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), 7000)
    return () => window.clearTimeout(t)
  }, [index, layout, autoplay, reduced, paused, items.length])

  if (items.length === 0) return null
  const current = items[Math.min(index, items.length - 1)]

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={layout !== 'grid' || f.centered} className="mb-14 md:mb-20" />

        {layout === 'grid' ? (
          <ul className={clsx('grid gap-x-10 gap-y-14', columns(content.columns, items.length >= 3 ? '3' : '2'))}>
            {items.map((item, i) => (
              <Reveal as="li" key={i} delay={(i % 3) * 0.08} className="flex flex-col border-t border-line pt-8">
                <span aria-hidden className="display text-[3rem] leading-none" style={{ color: accent }}>“</span>
                <p className="mt-2 flex-1 text-[1.02rem] leading-[1.85] text-muted">{item.quote}</p>
                <div className="mt-8">
                  <Attribution item={item} photos={photos} accent={accent} />
                </div>
              </Reveal>
            ))}
          </ul>
        ) : (
          <div
            className="mx-auto max-w-4xl text-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <span aria-hidden className="display block text-[4.5rem] leading-[0.6]" style={{ color: accent }}>“</span>
            <div className="relative mt-6 grid">
              <AnimatePresence mode="wait" initial={false}>
                <motion.figure
                  key={layout === 'single' ? 0 : index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <blockquote className="display text-[calc(clamp(1.6rem,3.4vw,2.7rem)*var(--hs,1))] leading-[1.3] text-ink">
                    {(layout === 'single' ? items[0] : current).quote}
                  </blockquote>
                  <figcaption className="mt-10">
                    <Attribution item={layout === 'single' ? items[0] : current} centered photos={photos} accent={accent} />
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            {layout === 'slider' && items.length > 1 && (
              <div className="mt-12 flex items-center justify-center gap-6">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>←</span>
                </button>
                <div className="flex gap-2">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Testimonial ${i + 1}`}
                      aria-current={i === index}
                      onClick={() => setIndex(i)}
                      className={clsx('h-1.5 rounded-full transition-all duration-500', i === index ? 'w-8 bg-accent' : 'w-1.5 bg-line')}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => setIndex((i) => (i + 1) % items.length)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Figures
 * ------------------------------------------------------------------ */

/**
 * A figure that counts up from zero when it scrolls into view. The number of
 * decimal places is read from what was typed, so "4.90" lands on 4.90 rather
 * than 4.9, and anything that is not a plain number is shown as typed.
 */
function CountUp({ value, enabled }: { value: string; enabled: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduced = useReducedMotion()
  const match = value.trim().match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/)
  const target = match ? Number(match[2].replace(/,/g, '')) : NaN
  const decimals = match && match[2].includes('.') ? match[2].split('.')[1].length : 0
  const grouped = Boolean(match && match[2].includes(','))
  const animated = enabled && !reduced && Number.isFinite(target)
  const [shown, setShown] = useState(animated ? 0 : target)

  useEffect(() => {
    if (!animated || !inView) return
    const controls = animate(0, target, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: setShown })
    return () => controls.stop()
  }, [animated, inView, target])

  if (!match || !Number.isFinite(target)) return <span ref={ref}>{value}</span>
  const formatted = shown.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  })
  return (
    <span ref={ref}>
      {match[1]}
      {formatted}
      {match[3]}
    </span>
  )
}

export function Stats({ content, styles }: WidgetProps) {
  const f = frame(styles, { rule: true })
  const items = list<{ value: string; suffix: string; label: string }>(content, 'items').filter((s) => s.value || s.label)
  const countUp = bool(content, 'count_up', true)
  if (items.length === 0) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} className="mb-14" />
        <dl className={clsx('grid gap-x-10 gap-y-12', columns(content.columns, '3'), f.centered && 'text-center')}>
          {items.map((item, i) => (
            <Reveal key={i} delay={(i % 4) * 0.08} className="border-t border-line pt-6">
              <dd className="display text-[calc(clamp(2.8rem,6vw,4.8rem)*var(--hs,1))] leading-none" style={{ color: swatchCss(text(content, 'swatch') || 'ink') }}>
                <CountUp value={item.value} enabled={countUp} />
                {item.suffix && <span className="text-accent">{item.suffix}</span>}
              </dd>
              <dt className="label mt-5 text-faint">{item.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

const CARD_SHAPE: Record<string, string> = {
  arch: 'arch aspect-[3/4]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
}

export function Cards({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const items = list<{ image: string; title: string; body: string; href: string; link_label: string; swatch?: string }>(content, 'items').filter(
    (c) => c.title || c.image,
  )
  const style = text(content, 'style') || 'arch'
  const cardStyle = text(content, 'card_style') || 'plain'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} />
        {text(content, 'intro') && (
          <Reveal as="p" delay={0.1} className={clsx('mt-8 max-w-xl text-[1.02rem] leading-[1.85] text-muted', f.centered && 'mx-auto text-center')}>
            {text(content, 'intro')}
          </Reveal>
        )}
        <ul className={clsx('mt-14 grid gap-x-8 gap-y-16', columns(content.columns, '3'))}>
          {items.map((item, i) => {
            const body = (
              <>
                {style === 'none' ? (
                  <span className="display text-[2.6rem] leading-none text-accent">{String(i + 1).padStart(2, '0')}</span>
                ) : (
                  item.image && (
                    <div className={clsx('overflow-hidden', CARD_SHAPE[style])}>
                      <Photo
                        src={item.image}
                        alt={item.title}
                        sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className="h-full w-full"
                        imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                      />
                    </div>
                  )
                )}
                <h3 className={clsx('display text-[1.7rem] text-ink transition-colors duration-400', item.href && 'group-hover:text-accent', style === 'none' ? 'mt-5' : 'mt-6')}>
                  {item.title}
                </h3>
                {item.body && <p className="mt-3 text-[0.98rem] leading-[1.8] text-muted">{item.body}</p>}
                {item.href && item.link_label && (
                  <span className="label mt-5 inline-flex items-center gap-2 text-accent">
                    {item.link_label}
                    <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                  </span>
                )}
              </>
            )
            const filled = cardStyle === 'filled'
            const dark = filled && ['charcoal', 'forest', 'sage', 'accent'].includes(item.swatch ?? '')
            const boxClass = clsx(
              cardStyle === 'bordered' && 'card-frame h-full border border-line p-5 md:p-6',
              filled && clsx('card-frame h-full p-5 md:p-6', dark ? 'scheme-charcoal' : 'scheme-beige'),
            )
            const boxStyle = filled ? { backgroundColor: swatchColor(item.swatch || 'beige') } : undefined
            return (
              <Reveal as="li" key={i} delay={(i % 3) * 0.08}>
                <div className={boxClass} style={boxStyle}>
                  {item.href ? (
                    <SmartLink href={item.href} className="group block">
                      {body}
                    </SmartLink>
                  ) : (
                    body
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
 * Before and after
 * ------------------------------------------------------------------ */

export function BeforeAfter({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const start = typeof content.start === 'number' ? content.start : 50
  const [position, setPosition] = useState(start)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => setPosition(start), [start])

  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect()
    if (!rect) return
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }

  const before = text(content, 'before')
  const after = text(content, 'after')

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} />
        {text(content, 'body') && (
          <Reveal as="p" delay={0.1} className={clsx('mt-8 max-w-xl text-[1.02rem] leading-[1.85] text-muted', f.centered && 'mx-auto text-center')}>
            {text(content, 'body')}
          </Reveal>
        )}

        <Unveil className={clsx('mt-14', f.measure('max-w-5xl'), 'mx-auto')}>
          <div
            ref={box}
            className="relative cursor-ew-resize touch-pan-y overflow-hidden select-none"
            style={ratio(content.ratio, '3/2')}
            onPointerDown={(e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              moveTo(e.clientX)
            }}
            onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <Photo src={after} alt={text(content, 'after_label')} sizes="(min-width: 1024px) 64rem, 92vw" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
              <Photo src={before} alt={text(content, 'before_label')} sizes="(min-width: 1024px) 64rem, 92vw" className="absolute inset-0 h-full w-full" />
            </div>

            {text(content, 'before_label') && (
              <span className="label pointer-events-none absolute top-5 left-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
                {text(content, 'before_label')}
              </span>
            )}
            {text(content, 'after_label') && (
              <span className="label pointer-events-none absolute top-5 right-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
                {text(content, 'after_label')}
              </span>
            )}

            <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90" style={{ left: `${position}%` }}>
              <span className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/90 bg-charcoal/40 text-white backdrop-blur-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="m9 6-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(position)}
              onChange={(e) => setPosition(Number(e.target.value))}
              aria-label="Compare before and after"
              className="sr-only"
            />
          </div>
        </Unveil>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Albums
 * ------------------------------------------------------------------ */

export function AlbumGrid({ content, styles }: WidgetProps) {
  const { albums } = useSite()
  const f = frame(styles)
  const mode = text(content, 'mode') || 'latest'
  const limit = typeof content.limit === 'number' && content.limit > 0 ? content.limit : 3

  const shown = useMemo(() => {
    if (mode === 'pick') {
      return list<string>(content, 'albums')
        .map((id) => albums.find((a) => a.id === id))
        .filter((a): a is (typeof albums)[number] => Boolean(a))
    }
    const pool =
      mode === 'category'
        ? albums.filter((a) => !text(content, 'category') || a.category === text(content, 'category'))
        : mode === 'featured'
          ? albums.filter((a) => a.featured)
          : albums
    return pool.slice(0, limit)
  }, [albums, mode, content, limit])

  if (shown.length === 0) return null
  const layout = text(content, 'layout') || 'grid'
  const card = {
    shape: text(content, 'ratio') || '4/5',
    countLabel: bool(content, 'show_count') ? 'photographs' : null,
    showCategory: bool(content, 'show_category', true),
    showDetails: bool(content, 'show_details', true),
    hover: text(content, 'hover') || 'zoom',
  }

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head
          content={content}
          centered={f.centered}
          link={{ href: text(content, 'link_href'), label: text(content, 'link_label') }}
        />
        <div className="mt-14">
          {layout === 'index' ? (
            <AlbumIndex albums={shown} labels={card} />
          ) : layout === 'masonry' ? (
            <div className={clsx('gap-x-8', content.columns === '2' ? 'sm:columns-2' : content.columns === '4' ? 'sm:columns-2 lg:columns-4' : 'sm:columns-2 lg:columns-3')}>
              {shown.map((album, i) => (
                <Reveal key={album.id} delay={(i % 3) * 0.08} className="mb-16 break-inside-avoid">
                  <AlbumCard album={album} {...card} shape="auto" />
                </Reveal>
              ))}
            </div>
          ) : layout === 'carousel' ? (
            <div className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] md:-mx-10 md:px-10 [&::-webkit-scrollbar]:hidden">
              {shown.map((album) => (
                <div key={album.id} className="w-[72vw] shrink-0 snap-start sm:w-[40vw] lg:w-[28vw]">
                  <AlbumCard album={album} {...card} sizes="(min-width: 1024px) 28vw, 72vw" />
                </div>
              ))}
            </div>
          ) : (
            <ul className={clsx('grid gap-x-8 gap-y-16', columns(content.columns, '3'))}>
              {shown.map((album, i) => (
                <Reveal as="li" key={album.id} delay={(i % 3) * 0.08}>
                  <AlbumCard album={album} {...card} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Video
 * ------------------------------------------------------------------ */

/** A YouTube or Vimeo address as an embed URL, or null for anything else. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&autoplay=1`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`
  return null
}

export function Video({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const url = text(content, 'url')
  const poster = text(content, 'poster')
  const embed = embedUrl(url)
  const ambient = bool(content, 'ambient') && !embed
  const [playing, setPlaying] = useState(false)
  const html = text(content, 'html')
  if (!url && !html) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} className="mb-12" />
        <figure className={clsx(f.measure('max-w-5xl'), 'mx-auto')}>
          <Unveil>
            <div className="relative overflow-hidden bg-charcoal" style={ratio(content.ratio, '16/9')}>
              {html && !url ? (
                // Pasted embed code runs in a sealed frame: it can draw and run its
                // own scripts, but cannot reach this page, its cookies or the dashboard.
                <iframe
                  srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:transparent}body>*{max-width:100%}</style></head><body>${html}</body></html>`}
                  title={text(content, 'heading') || 'Embedded content'}
                  sandbox="allow-scripts allow-popups allow-presentation allow-forms"
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                />
              ) : ambient ? (
                <video src={url} poster={poster || undefined} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              ) : playing || !poster ? (
                embed ? (
                  <iframe
                    src={playing ? embed : embed.replace('autoplay=1', 'autoplay=0')}
                    title={text(content, 'heading') || 'Video'}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <video src={url} controls autoPlay={playing} playsInline className="absolute inset-0 h-full w-full object-cover" />
                )
              ) : (
                <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 block" aria-label="Play video">
                  <Photo src={poster} alt="" sizes="(min-width: 1024px) 64rem, 92vw" className="absolute inset-0 h-full w-full" />
                  <span className="absolute inset-0 bg-charcoal/20 transition-colors duration-500 group-hover:bg-charcoal/35" />
                  <span className="absolute top-1/2 left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
                      <path d="M7 4.5v15l13-7.5z" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </Unveil>
          {text(content, 'caption') && (
            <figcaption className="mt-4 text-[0.9rem] text-muted italic">{text(content, 'caption')}</figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Featured in
 * ------------------------------------------------------------------ */

export function Logos({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: 'py-14 md:py-20', rule: true })
  const items = list<{ name: string; image: string; href: string }>(content, 'items').filter((l) => l.name || l.image)
  const muted = bool(content, 'muted', true)
  if (items.length === 0) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={clsx(f.shell, 'text-center')}>
        {text(content, 'eyebrow') && (
          <Reveal className={clsx(EYEBROW, 'justify-center')}>
            <span className="h-px w-10 bg-accent" />
            {text(content, 'eyebrow')}
            <span className="h-px w-10 bg-accent" />
          </Reveal>
        )}
        {bool(content, 'scroll') ? (
          <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="logo-scroll flex w-max items-center gap-x-14">
              {[...items, ...items].map((item, i) => (
                <span key={i} className="shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={i < items.length ? item.name : ''} loading="lazy" className={clsx('h-8 w-auto max-w-[10rem] object-contain md:h-10', muted && 'opacity-60 grayscale')} />
                  ) : (
                    <span className={clsx('display text-[1.5rem] whitespace-nowrap text-ink', muted && 'opacity-60')}>{item.name}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ) : (
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
          {items.map((item, i) => {
            const mark = item.image ? (
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className={clsx('h-8 w-auto max-w-[10rem] object-contain md:h-10', muted && 'opacity-60 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0')}
              />
            ) : (
              <span className={clsx('display text-[1.5rem] text-ink', muted && 'opacity-60 transition-opacity duration-500 hover:opacity-100')}>
                {item.name}
              </span>
            )
            return (
              <Reveal as="li" key={i} delay={i * 0.05}>
                {item.href ? <SmartLink href={item.href}>{mark}</SmartLink> : mark}
              </Reveal>
            )
          })}
        </ul>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Banner
 * ------------------------------------------------------------------ */

const BAND_HEIGHT: Record<string, string> = {
  compact: 'min-h-[22rem] py-20',
  medium: 'min-h-[32rem] py-28',
  tall: 'min-h-[80svh] py-32',
}

export function CtaBand({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: '' })
  const image = text(content, 'image')
  const overlay = typeof content.overlay === 'number' ? content.overlay : 55
  const centered = text(content, 'align') !== 'left'

  return (
    <section
      id={f.id}
      className={clsx('relative isolate flex scroll-mt-24 items-center overflow-hidden', image ? 'scheme-photo' : 'bg-surface', BAND_HEIGHT[text(content, 'height')] ?? BAND_HEIGHT.medium, f.className)}
      style={f.style}
    >
      {image && (
        <>
          <Photo src={image} alt="" sizes="100vw" className="absolute inset-0 -z-10 h-full w-full" />
          <span aria-hidden className="absolute inset-0 -z-10 bg-charcoal" style={{ opacity: overlay / 100 }} />
        </>
      )}
      <div className={clsx('shell w-full', centered && 'text-center')}>
        <div className={clsx('max-w-3xl', centered && 'mx-auto')}>
          {text(content, 'eyebrow') && (
            <Reveal className={clsx(EYEBROW, centered && 'justify-center')}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
              {centered && <span className="h-px w-10 bg-accent" />}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2.4rem,5.6vw,4.8rem)*var(--hs,1))] text-ink" />
          {text(content, 'body') && (
            <Reveal as="p" delay={0.12} className={clsx('mt-8 max-w-xl text-[1.05rem] leading-[1.85] text-muted', centered && 'mx-auto')}>
              {text(content, 'body')}
            </Reveal>
          )}
          <Reveal delay={0.2}>
            <Buttons
              buttons={list<ButtonValue>(content, 'buttons')}
              className={clsx('mt-10', centered && 'justify-center', image && '[&_a]:border-white/80')}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Two columns of text
 * ------------------------------------------------------------------ */

const SIDE_SPLIT: Record<string, [string, string]> = {
  '33': ['lg:col-span-4', 'lg:col-span-7 lg:col-start-6'],
  '40': ['lg:col-span-5', 'lg:col-span-6 lg:col-start-7'],
  '50': ['lg:col-span-6', 'lg:col-span-6 lg:col-start-7'],
}

export function TwoColumn({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const buttons = list<ButtonValue>(content, 'buttons')

  if (text(content, 'layout') === 'side') {
    const [left, right] = SIDE_SPLIT[text(content, 'split')] ?? SIDE_SPLIT['40']
    return (
      <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
        <div className={clsx(f.shell, 'grid gap-12 lg:grid-cols-12')}>
          <div className={clsx(left, bool(content, 'sticky', true) && 'lg:sticky lg:top-28 lg:self-start')}>
            <Head content={content} />
            <Reveal delay={0.2}>
              <Buttons buttons={buttons} className="mt-10" />
            </Reveal>
          </div>
          <div className={right}>
            <RichParagraphs html={text(content, 'left')} className="space-y-6 text-[1.04rem] leading-[1.9] text-muted" />
            {text(content, 'right') && (
              <RichParagraphs html={text(content, 'right')} className="mt-6 space-y-6 text-[1.04rem] leading-[1.9] text-muted" start={0.1} />
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} className="mb-12" />
        <div className={clsx('grid gap-x-16 gap-y-8 md:grid-cols-2', f.measure())}>
          <RichParagraphs html={text(content, 'left')} className="space-y-6 text-[1.02rem] leading-[1.85] text-muted" />
          <RichParagraphs html={text(content, 'right')} className="space-y-6 text-[1.02rem] leading-[1.85] text-muted" start={0.1} />
        </div>
        <Reveal delay={0.2}>
          <Buttons buttons={buttons} className={clsx('mt-12', f.centered && 'justify-center')} />
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Map
 * ------------------------------------------------------------------ */

const MAP_HEIGHT: Record<string, string> = { sm: 'h-72', md: 'h-[26rem]', lg: 'h-[36rem]' }

export function MapEmbed({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const query = text(content, 'query')
  const zoom = typeof content.zoom === 'number' ? content.zoom : 12
  const body = text(content, 'body')
  if (!query) return null
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`

  const map = (
    <Unveil className={clsx('overflow-hidden border border-line', MAP_HEIGHT[text(content, 'height')] ?? MAP_HEIGHT.md)}>
      <iframe
        src={src}
        title={`Map of ${query}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0 grayscale-[0.6] sepia-[0.15]"
      />
    </Unveil>
  )

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        {body ? (
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Head content={content} />
              <Reveal as="p" delay={0.12} className="mt-8 text-[1.02rem] leading-[1.85] whitespace-pre-line text-muted">
                {body}
              </Reveal>
            </div>
            <div className="lg:col-span-8">{map}</div>
          </div>
        ) : (
          <>
            <Head content={content} centered={f.centered} className="mb-12" />
            {map}
          </>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Instagram
 * ------------------------------------------------------------------ */

export function Instagram({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const site = useSiteInfo()
  const images = list<string>(content, 'images')
  if (images.length === 0) return null
  const across = text(content, 'columns') || '6'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <Head
          content={content}
          centered={f.centered}
          className="mb-12"
          link={site.instagram ? { href: site.instagram, label: text(content, 'link_label') || site.instagramHandle } : undefined}
        />
      </div>
      <ul className={clsx('grid gap-1', across === '3' ? 'grid-cols-3' : across === '4' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 md:grid-cols-6')}>
        {images.map((src, i) => (
          <li key={`${src}-${i}`}>
            <a href={site.instagram || undefined} target="_blank" rel="noreferrer noopener" className="group relative block overflow-hidden">
              <Photo
                src={src}
                alt=""
                sizes={across === '3' ? '33vw' : across === '4' ? '25vw' : '17vw'}
                className="aspect-square"
                imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
              />
              <span aria-hidden className="absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/25" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * About me card
 * ------------------------------------------------------------------ */

export function AuthorCard({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const site = useSiteInfo()
  const stacked = text(content, 'layout') === 'stacked'
  const shape = text(content, 'shape') || 'circle'
  const portrait = text(content, 'portrait')

  const picture = portrait && (
    <Unveil className={clsx(shape === 'arch' && 'arch', shape === 'circle' && 'rounded-full', 'overflow-hidden')}>
      <Photo
        src={portrait}
        alt={text(content, 'name')}
        sizes="320px"
        className={clsx(shape === 'circle' ? 'aspect-square' : 'aspect-[4/5]', 'w-full')}
      />
    </Unveil>
  )

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <div
          className={clsx(
            'mx-auto max-w-4xl',
            bool(content, 'boxed', true) && 'card-frame border border-line p-8 md:p-12',
            stacked ? 'text-center' : 'grid items-center gap-10 md:grid-cols-12',
          )}
        >
          {picture && <div className={stacked ? 'mx-auto mb-8 w-40 md:w-48' : 'mx-auto w-48 md:col-span-4 md:w-full'}>{picture}</div>}
          <div className={stacked ? undefined : picture ? 'md:col-span-8' : 'md:col-span-12'}>
            {text(content, 'role') && <Reveal className="label text-accent">{text(content, 'role')}</Reveal>}
            {text(content, 'name') && (
              <Reveal as="p" delay={0.05} className="display mt-4 text-[calc(clamp(2rem,4vw,3rem)*var(--hs,1))] text-ink">
                {text(content, 'name')}
              </Reveal>
            )}
            <RichParagraphs html={text(content, 'bio')} className={clsx('mt-6 space-y-5 text-[1.02rem] leading-[1.85] text-muted', stacked && 'mx-auto max-w-xl')} start={0.1} />
            <Reveal delay={0.2} className={clsx('mt-8 flex flex-wrap items-center gap-x-8 gap-y-4', stacked && 'justify-center')}>
              <Buttons buttons={list<ButtonValue>(content, 'buttons')} className={stacked ? 'justify-center' : undefined} />
              {bool(content, 'show_links', true) && (
                <span className="flex items-center gap-6">
                  {site.instagram && (
                    <a href={site.instagram} target="_blank" rel="noreferrer noopener" className="label border-b border-line pb-1 text-muted transition-colors hover:border-accent hover:text-accent">
                      {site.instagramHandle || 'Instagram'} ↗
                    </a>
                  )}
                  {site.email && (
                    <a href={`mailto:${site.email}`} className="label border-b border-line pb-1 text-muted transition-colors hover:border-accent hover:text-accent">
                      Email
                    </a>
                  )}
                </span>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
