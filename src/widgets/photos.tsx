import { useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import clsx from 'clsx'
import { Photo, aspectOf } from '@/components/Photo'
import { Lightbox } from '@/components/Lightbox'
import { MaskText, Parallax, Reveal, RichParagraphs, Unveil } from '@/components/motion'
import { useColumnCount, useReducedMotion } from '@/lib/hooks'
import { usePhotoRegistry } from '@/lib/photos'
import { ArrowLink, Buttons, type ButtonValue } from './links'
import { EYEBROW, bool, frame, list, text, type WidgetProps } from './types'

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

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.pad, f.className)}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <MaskText
              text={text(content, 'heading')}
              className="display mt-6 max-w-2xl text-[clamp(2.4rem,6vw,5.2rem)] text-ink"
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
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <span className="text-[0.9rem] text-muted italic">{item.caption}</span>
                <span className="label text-faint">
                  {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>
              </figcaption>
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
function Step({ step, index, total }: { step: StepValue; index: number; total: number }) {
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
        className="grid origin-top overflow-hidden rounded-sm border border-line bg-surface shadow-[0_-24px_70px_-40px_rgb(0_0_0/0.45)] md:grid-cols-2"
      >
        <div className="flex flex-col justify-between gap-10 p-8 md:p-14 lg:p-16">
          <div className="flex items-center justify-between">
            <span className="display text-[clamp(3.5rem,7vw,6rem)] leading-none text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="label text-faint">
              Step {index + 1} of {total}
            </span>
          </div>
          <div>
            <h3 className="display text-[clamp(2rem,3.6vw,3.1rem)] text-ink">{step.title}</h3>
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
    <section id={f.id} className={clsx('relative scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2.2rem,5.2vw,4.4rem)] text-ink" />
        </div>

        <div className="mt-20 pb-16">
          {steps.map((step, i) => (
            <Step key={`${step.title}-${i}`} step={step} index={i} total={steps.length} />
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
}: {
  photos: string[]
  title: string
  caption?: string
  maxColumns?: number
}) {
  usePhotoRegistry()
  const columns = Math.min(useColumnCount(), maxColumns)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const grid = useMemo(() => columnize(photos, Math.max(1, columns)), [photos, columns])

  return (
    <>
      <div className="flex items-start gap-5 md:gap-7">
        {grid.map((column, ci) => (
          <div key={ci} className="flex min-w-0 flex-1 flex-col gap-5 md:gap-7">
            {column.map((photo, ri) => (
              <motion.button
                key={`${photo}-${ri}`}
                type="button"
                onClick={() => setOpenIndex(photos.indexOf(photo))}
                className="group relative block w-full cursor-zoom-in overflow-hidden"
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
                  imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/15"
                />
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <Lightbox
        ids={photos}
        index={openIndex}
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

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        {(text(content, 'eyebrow') || heading) && (
          <div className="mb-14 max-w-2xl">
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            {heading && <MaskText text={heading} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />}
          </div>
        )}
        <MasonryGallery
          photos={photos}
          title={heading || 'Gallery'}
          caption={text(content, 'caption') || undefined}
          maxColumns={Number(text(content, 'columns')) || 3}
        />
      </div>
    </section>
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
}

export function ImageBlock({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const width = text(content, 'width')
  const shape = text(content, 'shape') || 'auto'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <figure className={clsx(width === 'full' ? 'w-full' : 'shell', width === 'narrow' && 'max-w-3xl')}>
        <Unveil className={shape === 'arch' ? 'arch' : undefined}>
          <Photo
            src={text(content, 'image')}
            alt={text(content, 'alt')}
            sizes={width === 'full' ? '100vw' : width === 'narrow' ? '(min-width: 768px) 48rem, 92vw' : '92vw'}
            className={clsx('w-full', SHAPE[shape])}
          />
        </Unveil>
        {text(content, 'caption') && (
          <figcaption className={clsx('mt-4 text-[0.9rem] text-muted italic', width === 'full' && 'shell')}>
            {text(content, 'caption')}
          </figcaption>
        )}
      </figure>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Photograph and text
 * ------------------------------------------------------------------ */

export function ImageText({ content, styles }: WidgetProps) {
  const f = frame(styles, { rule: true })
  const left = text(content, 'side') === 'left'

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid items-center gap-14 lg:grid-cols-12 lg:gap-16', f.pad)}>
        <div className={clsx('lg:col-span-6', left && 'lg:order-2 lg:col-start-7')}>
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}
          {text(content, 'heading') && (
            <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
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

        <div className={clsx('lg:col-span-5', left ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-8')}>
          <Parallax speed={0.05}>
            <Unveil className={bool(content, 'arch', true) ? 'arch' : undefined}>
              <Photo
                src={text(content, 'image')}
                alt={text(content, 'alt')}
                sizes="(min-width: 1024px) 36vw, 90vw"
                className="aspect-[3/4]"
              />
            </Unveil>
          </Parallax>
        </div>
      </div>
    </section>
  )
}
