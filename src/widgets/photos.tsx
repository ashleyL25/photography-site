import { Heading } from './Heading'
import { useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import clsx from 'clsx'
import { Photo, aspectOf } from '@/components/Photo'
import { Lightbox } from '@/components/Lightbox'
import { Parallax, Reveal, RichParagraphs, Unveil } from '@/components/motion'
import { useColumnCount, useReducedMotion } from '@/lib/hooks'
import { usePhotoRegistry } from '@/lib/photos'
import { ArrowLink, Buttons, type ButtonValue } from './links'
import { EYEBROW, bool, columns as gridColumns, frame, list, ratio, text, type WidgetProps } from './types'

/* ------------------------------------------------------------------ *
 * Selected work
 * ------------------------------------------------------------------ */

/**
 * Asymmetric gallery. Column spans and offsets are hand-placed rather than
 * generated so the grid breaks in the right places, and alternating parallax
 * speeds keep the whole block from scrolling as one flat sheet.
 */
const LAYOUT = [
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-1',
  'col-span-12 sm:col-span-6 lg:col-span-5 lg:col-start-6 lg:mt-32',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-1 lg:-mt-16',
  'col-span-12 sm:col-span-7 lg:col-span-5 lg:col-start-5 lg:mt-16',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-10 lg:-mt-40',
  'col-span-12 sm:col-span-7 lg:col-span-6 lg:col-start-2 lg:mt-4',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-9 lg:-mt-24',
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-2 lg:mt-8',
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-7 lg:-mt-16',
]

const RATIO: Record<string, string> = { tall: 'aspect-[3/4.3]', wide: 'aspect-[4/2.9]', std: 'aspect-[4/5]' }

export function SelectedWork({ content, styles }: WidgetProps) {
  const f = frame(styles, { id: 'work', pad: 'py-28 md:py-40', rule: true })
  const items = list<{ image: string; caption: string; span: string }>(content, 'items').filter((i) => i.image)
  const showCaptions = bool(content, 'show_captions', true)
  const showCounter = bool(content, 'show_counter', true)

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <Heading
              content={content}
              className="display mt-6 max-w-2xl text-[calc(clamp(2.4rem,6vw,5.2rem)*var(--hs,1))] text-ink"
            />
          </div>
          <Reveal delay={0.2}>
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-12 gap-x-5 gap-y-14 md:gap-x-8 md:gap-y-20">
          {items.map((item, i) => (
            <figure key={`${item.image}-${i}`} className={clsx('group', LAYOUT[i % LAYOUT.length])}>
              <Parallax speed={i % 2 === 0 ? 0.05 : -0.05}>
                <Unveil direction={i % 3 === 1 ? 'left' : 'up'}>
                  <Photo
                    src={item.image}
                    alt={item.caption}
                    sizes="(min-width: 1024px) 34vw, (min-width: 640px) 48vw, 92vw"
                    className={clsx('w-full', RATIO[item.span] ?? RATIO.std)}
                    imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                </Unveil>
              </Parallax>
              {(showCaptions || showCounter) && (
                <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <span className="text-[0.9rem] text-muted italic">{showCaptions ? item.caption : ''}</span>
                  {showCounter && (
                    <span className="label text-faint">
                      {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Stacked steps
 * ------------------------------------------------------------------ */

type StepValue = { title: string; body: string; image: string }

/** One pinned step. Later cards slide over earlier ones, which recede as they go. */
function Step({ step, index, total, count }: { step: StepValue; index: number; total: number; count: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25])

  return (
    <div
      ref={ref}
      className="sticky"
      // Clears the fixed header, which is taller by the status-bar inset it pads
      // itself by on iOS. Each card then parks slightly lower than the last so
      // the stack stays legible as it collects.
      style={{ top: `calc(6rem + env(safe-area-inset-top) + ${index * 1.75}rem)`, zIndex: index + 1 }}
    >
      <motion.article
        style={reduced ? undefined : { scale, opacity }}
        className="card-frame grid origin-top overflow-hidden rounded-sm border border-line bg-surface shadow-[0_-24px_70px_-40px_rgb(0_0_0/0.45)] md:grid-cols-2"
      >
        <div className="flex flex-col justify-between gap-10 p-8 md:p-14 lg:p-16">
          <div className="flex items-center justify-between">
            <span className="display text-[calc(clamp(3.5rem,7vw,6rem)*var(--hs,1))] leading-none text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            {count && (
              <span className="label text-faint">
                Step {index + 1} of {total}
              </span>
            )}
          </div>
          <div>
            <h3 className="display text-[calc(clamp(2rem,3.6vw,3.1rem)*var(--hs,1))] text-ink">{step.title}</h3>
            <p className="mt-5 max-w-md text-[1rem] leading-[1.85] text-muted">{step.body}</p>
          </div>
        </div>

        <div className="relative min-h-[16rem] md:min-h-[26rem]">
          <Photo src={step.image} alt="" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full" />
        </div>
      </motion.article>
    </div>
  )
}

export function Process({ content, styles }: WidgetProps) {
  const f = frame(styles, { id: 'process', pad: 'py-28 md:py-40', rule: true })
  const steps = list<StepValue>(content, 'steps')

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <Heading content={content} className="display mt-6 text-[calc(clamp(2.2rem,5.2vw,4.4rem)*var(--hs,1))] text-ink" />
        </div>

        <div className="mt-20 pb-16">
          {steps.map((step, i) => (
            <Step key={`${step.title}-${i}`} step={step} index={i} total={steps.length} count={bool(content, 'show_step_count', true)} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Photo gallery — balanced masonry with a lightbox
 * ------------------------------------------------------------------ */

/**
 * Balanced-column masonry. Each photograph goes into whichever column is
 * currently shortest, measured in aspect ratio, so the columns end level —
 * which CSS columns cannot do, and which is the difference between a gallery
 * and a list that happens to be in columns.
 */
/** The hover treatment a card or photograph takes, from the widget's Hover effect. */
export function hoverClasses(hover: string) {
  if (hover === 'none') return { group: '', img: '' }
  if (hover === 'lift') return { group: 'transition-transform duration-700 ease-[var(--ease-out-expo)] hover:-translate-y-1.5', img: 'transition-[filter] duration-700 group-hover:brightness-105' }
  return { group: '', img: 'transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045]' }
}

const GAP: Record<string, string> = { tight: 'gap-2 md:gap-3', normal: 'gap-5 md:gap-7', loose: 'gap-8 md:gap-12' }

export function columnize(photos: string[], columns: number): string[][] {
  const buckets = Array.from({ length: columns }, () => ({ items: [] as string[], height: 0 }))
  for (const photo of photos) {
    const shortest = buckets.reduce((a, b) => (a.height <= b.height ? a : b))
    shortest.items.push(photo)
    shortest.height += 1 / aspectOf(photo)
  }
  return buckets.map((b) => b.items)
}

export function MasonryGallery({
  photos,
  title,
  caption,
  maxColumns = 3,
  gap = 'normal',
  drift = false,
  lightbox = true,
  hover = 'zoom',
}: {
  photos: string[]
  title: string
  caption?: string
  maxColumns?: number
  gap?: string
  drift?: boolean
  lightbox?: boolean
  hover?: string
}) {
  const fx = hoverClasses(hover)
  const gapClass = GAP[gap] ?? GAP.normal
  usePhotoRegistry()
  const columns = Math.min(useColumnCount(), maxColumns)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const grid = useMemo(() => columnize(photos, Math.max(1, columns)), [photos, columns])

  return (
    <>
      <div className={clsx('flex items-start', gapClass)}>
        {grid.map((column, ci) => {
          const col = (
          <div key={ci} className={clsx('flex min-w-0 flex-1 flex-col', gapClass)}>
            {column.map((photo, ri) => (
              <motion.button
                key={`${photo}-${ri}`}
                type="button"
                onClick={() => lightbox && setOpenIndex(photos.indexOf(photo))}
                className={clsx('group relative block w-full overflow-hidden', lightbox ? 'cursor-zoom-in' : 'cursor-default', fx.group)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.8, delay: Math.min(ri * 0.05 + ci * 0.04, 0.5), ease: [0.16, 1, 0.3, 1] }}
              >
                <Photo
                  src={photo}
                  alt={`${title} — photograph ${photos.indexOf(photo) + 1}`}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                  className="w-full"
                  imgClassName={fx.img}
                />
                {hover !== 'none' && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
                  />
                )}
              </motion.button>
            ))}
          </div>
          )
          // Drift: each column travels at its own speed, the middle one against the others.
          return drift ? (
            <Parallax key={ci} speed={[0.06, -0.08, 0.12, -0.04][ci % 4]} className="min-w-0 flex-1">
              {col}
            </Parallax>
          ) : (
            col
          )
        })}
      </div>

      <Lightbox
        ids={photos}
        index={lightbox ? openIndex : null}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        caption={caption ? () => caption : undefined}
      />
    </>
  )
}

export function PhotoGallery({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const photos = list<string>(content, 'images')
  const heading = text(content, 'heading')
  const layout = text(content, 'layout') || 'masonry'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        {(text(content, 'eyebrow') || heading) && (
          <div className="mb-14 max-w-2xl">
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            {heading && <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />}
          </div>
        )}
        {(layout === 'masonry' || layout === 'drift') && (
          <MasonryGallery
            photos={photos}
            title={heading || 'Gallery'}
            caption={text(content, 'caption') || undefined}
            maxColumns={Number(text(content, 'columns')) || 3}
            gap={text(content, 'gap')}
            drift={layout === 'drift'}
            lightbox={bool(content, 'lightbox', true)}
            hover={text(content, 'hover') || 'zoom'}
          />
        )}
      </div>
      {layout !== 'masonry' && layout !== 'drift' && (
        <CroppedGallery
          lightbox={bool(content, 'lightbox', true)}
          hover={text(content, 'hover') || 'zoom'}
          photos={photos}
          title={heading || 'Gallery'}
          caption={text(content, 'caption') || undefined}
          carousel={layout === 'carousel'}
          columns={text(content, 'columns') || '3'}
          shape={text(content, 'ratio')}
          gap={text(content, 'gap')}
        />
      )}
    </section>
  )
}

/**
 * Every photograph cropped to one shape — as an even grid, or a row that
 * scrolls sideways and snaps. The carousel runs to the edge of the screen and
 * starts in line with the page's content, so it reads as leaving the frame.
 */
function CroppedGallery({
  photos,
  title,
  caption,
  carousel,
  columns,
  shape,
  gap,
  lightbox,
  hover,
}: {
  photos: string[]
  title: string
  caption?: string
  carousel: boolean
  columns: string
  shape: string
  gap: string
  lightbox: boolean
  hover: string
}) {
  const fx = hoverClasses(hover)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const track = useRef<HTMLDivElement>(null)
  const gapClass = GAP[gap] ?? GAP.normal
  const cardWidth = columns === '2' ? 'w-[78vw] sm:w-[46vw]' : columns === '4' ? 'w-[64vw] sm:w-[34vw] lg:w-[23vw]' : 'w-[72vw] sm:w-[40vw] lg:w-[30vw]'

  const nudge = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  const items = photos.map((photo, i) => (
    <motion.button
      key={`${photo}-${i}`}
      type="button"
      onClick={() => lightbox && setOpenIndex(i)}
      className={clsx('group relative block overflow-hidden', lightbox ? 'cursor-zoom-in' : 'cursor-default', fx.group, carousel && clsx('shrink-0 snap-start', cardWidth))}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.8, delay: Math.min((i % 4) * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Photo
        src={photo}
        alt={`${title} — photograph ${i + 1}`}
        sizes={carousel ? '(min-width: 1024px) 30vw, 72vw' : '(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw'}
        className="w-full"
        style={ratio(shape)}
        imgClassName={fx.img}
      />
    </motion.button>
  ))

  return (
    <>
      {carousel ? (
        <div className="relative">
          <div
            ref={track}
            className={clsx(
              'flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'shell-inset',
              gapClass,
            )}
          >
            {items}
          </div>
          {photos.length > 2 && (
            <div className="shell mt-6 flex justify-end gap-3">
              {[-1, 1].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => nudge(dir)}
                  aria-label={dir < 0 ? 'Previous photographs' : 'Next photographs'}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>{dir < 0 ? '←' : '→'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={clsx('shell grid', gridColumns(columns), gapClass)}>{items}</div>
      )}
      <Lightbox
        ids={photos}
        index={lightbox ? openIndex : null}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        caption={caption ? () => caption : undefined}
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * One photograph
 * ------------------------------------------------------------------ */

const SHAPE: Record<string, string> = {
  auto: '',
  arch: 'arch aspect-[3/4]',
  wide: 'aspect-[3/2]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  tall: 'aspect-[2/3]',
  cinema: 'aspect-[21/9]',
}

const FRAME: Record<string, string> = {
  none: '',
  hairline: 'border border-line p-0',
  plate: 'border border-accent/35 p-2.5 md:p-3.5',
  print: 'bg-[#fbf8f4] p-3 pb-10 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.5)] md:p-5 md:pb-16',
}

export function ImageBlock({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const width = text(content, 'width')
  const shape = text(content, 'shape') || 'auto'
  const frameStyle = text(content, 'frame') || 'none'
  const src = text(content, 'image')
  const [open, setOpen] = useState(false)
  const lightbox = bool(content, 'lightbox')

  let picture = (
    <Unveil className={shape === 'arch' ? 'arch' : undefined}>
      <Photo
        src={src}
        alt={text(content, 'alt')}
        sizes={width === 'full' ? '100vw' : width === 'narrow' ? '(min-width: 768px) 48rem, 92vw' : '92vw'}
        className={clsx('w-full', SHAPE[shape])}
        focus={text(content, 'focal') === 'top' ? 'center 20%' : text(content, 'focal') === 'bottom' ? 'center 80%' : undefined}
      />
    </Unveil>
  )
  if (bool(content, 'parallax')) picture = <Parallax speed={0.06}>{picture}</Parallax>
  if (lightbox)
    picture = (
      <button type="button" onClick={() => setOpen(true)} className="block w-full cursor-zoom-in" aria-label="Open full size">
        {picture}
      </button>
    )

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <figure className={clsx(width === 'full' ? 'w-full' : 'shell', width === 'narrow' && 'max-w-3xl')}>
        <div className={FRAME[frameStyle]}>{picture}</div>
        {text(content, 'caption') && (
          <figcaption className={clsx('mt-4 text-[0.9rem] text-muted italic', width === 'full' && 'shell')}>
            {text(content, 'caption')}
          </figcaption>
        )}
      </figure>
      {lightbox && <Lightbox ids={[src]} index={open ? 0 : null} onClose={() => setOpen(false)} onNavigate={() => {}} />}
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Photograph and text
 * ------------------------------------------------------------------ */

const SPLIT: Record<string, { text: string; image: string; imageLeft: string; textRight: string }> = {
  small: { text: 'lg:col-span-7', image: 'lg:col-span-4 lg:col-start-9', imageLeft: 'lg:col-span-4 lg:col-start-1', textRight: 'lg:col-start-6' },
  even: { text: 'lg:col-span-6', image: 'lg:col-span-5 lg:col-start-8', imageLeft: 'lg:col-span-5 lg:col-start-1', textRight: 'lg:col-start-7' },
  large: { text: 'lg:col-span-5', image: 'lg:col-span-6 lg:col-start-7', imageLeft: 'lg:col-span-6 lg:col-start-1', textRight: 'lg:col-start-8' },
}

export function ImageText({ content, styles }: WidgetProps) {
  const f = frame(styles, { rule: true })
  const left = text(content, 'side') === 'left'
  const split = SPLIT[text(content, 'split')] ?? SPLIT.even
  const overlap = bool(content, 'overlap')
  const parallax = bool(content, 'parallax', true)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid items-center gap-14 lg:grid-cols-12 lg:gap-16', f.pad)} style={f.style}>
        <div className={clsx(split.text, left && clsx('lg:order-2', split.textRight), overlap && 'relative z-[1] lg:bg-canvas/90 lg:p-10 lg:backdrop-blur-sm', overlap && (left ? 'lg:-ml-16' : 'lg:-mr-16'))}>
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          {text(content, 'heading') && (
            <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />
          )}
          <RichParagraphs
            html={text(content, 'body')}
            className="mt-8 max-w-xl space-y-6 text-[1.04rem] leading-[1.9] text-muted"
            step={0.06}
            start={0.06}
          />
          <Reveal delay={0.2}>
            <Buttons buttons={list<ButtonValue>(content, 'buttons')} className="mt-10" />
          </Reveal>
        </div>

        <div className={clsx(left ? clsx('lg:order-1', split.imageLeft) : split.image)}>
          <Parallax speed={parallax ? 0.05 : 0}>
            <Unveil className={bool(content, 'arch', true) ? 'arch' : undefined}>
              <Photo
                src={text(content, 'image')}
                alt={text(content, 'alt')}
                sizes="(min-width: 1024px) 36vw, 90vw"
                className="w-full"
                style={ratio(content.ratio, '3/4')}
              />
            </Unveil>
          </Parallax>
        </div>
      </div>
    </section>
  )
}
