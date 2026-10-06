import clsx from 'clsx'
import { DrawRule, Reveal, RichParagraphs } from '@/components/motion'
import { Photo } from '@/components/Photo'
import { Tick } from '@/components/TierCards'
import { Heading } from './Heading'
import { Buttons, SmartLink, type ButtonValue } from './links'
import { TextPhotos } from './sessions'
import { EYEBROW, bool, frame, list, ratio, text, type WidgetProps } from './types'

/**
 * The plain building blocks — rich text, a heading, buttons, a list, columns,
 * embed code — and the session overview's layout for any page. Each one is as
 * simple as it sounds, with the Style tab doing the rest.
 */

/** Eyebrow and heading, aligned with the section. */
function Head({ content, centered, className }: { content: Record<string, unknown>; centered: boolean; className?: string }) {
  if (!text(content, 'eyebrow') && !text(content, 'heading')) return null
  return (
    <div className={className}>
      {text(content, 'eyebrow') && (
        <Reveal className={clsx(EYEBROW, centered && 'justify-center')}>
          <span className="h-px w-10 bg-accent" />
          {text(content, 'eyebrow')}
          {centered && <span className="h-px w-10 bg-accent" />}
        </Reveal>
      )}
      {text(content, 'heading') && <Heading content={content} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />}
    </div>
  )
}

const TEXT_SIZE: Record<string, string> = {
  sm: 'text-[0.95rem] leading-[1.8]',
  md: 'text-[1.04rem] leading-[1.9]',
  lg: 'text-[1.2rem] leading-[1.85]',
}

export function RichTextBlock({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const cols = text(content, 'text_columns') || '1'
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <div className={f.measure(cols === '1' ? 'max-w-2xl' : '')}>
          <Head content={content} centered={f.centered} className="mb-8" />
          <RichParagraphs
            html={text(content, 'body')}
            className={clsx(
              'space-y-6 text-muted',
              TEXT_SIZE[text(content, 'size')] ?? TEXT_SIZE.md,
              bool(content, 'drop_cap') && 'drop-cap',
              cols === '2' && 'md:columns-2 md:gap-12 [&>*]:break-inside-avoid',
              cols === '3' && 'md:columns-2 md:gap-12 lg:columns-3 [&>*]:break-inside-avoid',
            )}
          />
          <Reveal delay={0.2}>
            <Buttons buttons={list<ButtonValue>(content, 'buttons')} className={clsx('mt-10', f.centered && 'justify-center')} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function HeadingBlock({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: 'py-16 md:py-20' })
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <div className={f.measure('max-w-3xl')}>
          <Head content={content} centered={f.centered} />
          {text(content, 'subheading') && (
            <Reveal as="p" delay={0.12} className={clsx('mt-6 max-w-xl text-[1.05rem] leading-[1.85] text-muted', f.centered && 'mx-auto')}>
              {text(content, 'subheading')}
            </Reveal>
          )}
          {bool(content, 'rule') && <DrawRule className="mt-10" />}
        </div>
      </div>
    </section>
  )
}

export function TextPhotosBlock({ content, styles }: WidgetProps) {
  return (
    <TextPhotos
      content={content}
      styles={styles}
      body={text(content, 'body')}
      points={list<string>(content, 'points')}
      photo={text(content, 'photo')}
      alt={text(content, 'photo_alt')}
      photos={list<string>(content, 'photos')}
    />
  )
}

export function ButtonsRow({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: 'py-10 md:py-14' })
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Reveal>
          <Buttons buttons={list<ButtonValue>(content, 'buttons')} className={clsx(f.centered && 'justify-center')} />
        </Reveal>
      </div>
    </section>
  )
}

export function ListBlock({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const items = list<string>(content, 'items')
  const marker = text(content, 'marker') || 'tick'
  const cols = text(content, 'columns') || '1'
  const ruled = bool(content, 'ruled', true)
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <div className={f.measure(cols === '1' ? 'max-w-2xl' : '')}>
          <Head content={content} centered={f.centered} className="mb-10" />
          <ul
            className={clsx(
              'grid gap-x-10 text-left',
              cols === '2' && 'sm:grid-cols-2',
              cols === '3' && 'sm:grid-cols-2 lg:grid-cols-3',
              ruled ? 'border-t border-line' : 'gap-y-4',
            )}
          >
            {items.map((line, i) => (
              <Reveal
                as="li"
                key={`${line}-${i}`}
                delay={Math.min(i * 0.04, 0.4)}
                className={clsx('flex gap-5 text-[1rem] leading-relaxed text-muted', ruled && 'border-b border-line py-5')}
              >
                {marker === 'tick' && <Tick className="mt-[0.55rem]" />}
                {marker === 'number' && <span className="label w-6 shrink-0 pt-[0.2rem] text-accent">{String(i + 1).padStart(2, '0')}</span>}
                {marker === 'dot' && <span className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                {line}
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function ColumnsBlock({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const items = list<{ image: string; title: string; body: string; href: string; link_label: string }>(content, 'items')
  const shape = text(content, 'ratio') || '4/5'
  const divided = bool(content, 'divided')
  const n = Math.max(2, Math.min(items.length, 4))
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} className="mb-14" />
        <div
          className={clsx(
            'grid gap-x-10 gap-y-14',
            n === 2 && 'md:grid-cols-2',
            n === 3 && 'md:grid-cols-3',
            n === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
            divided && 'md:divide-x md:divide-line [&>*]:md:px-8 [&>*:first-child]:md:pl-0',
          )}
        >
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.08}>
              {item.image && (
                <div className={clsx('mb-6 overflow-hidden', shape === 'arch' && 'arch')}>
                  <Photo src={item.image} alt={item.title} sizes="(min-width: 768px) 30vw, 92vw" style={ratio(shape === 'arch' ? '3/4' : shape, '4/5')} />
                </div>
              )}
              {item.title && <h3 className="display text-[1.7rem] text-ink">{item.title}</h3>}
              <RichParagraphs html={item.body} className="mt-3 space-y-4 text-[0.98rem] leading-[1.8] text-muted" />
              {item.href && item.link_label && (
                <SmartLink href={item.href} className="label group mt-5 inline-flex items-center gap-2 text-accent">
                  {item.link_label}
                  <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                </SmartLink>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function EmbedCode({ content, styles }: WidgetProps) {
  const f = frame(styles)
  const html = text(content, 'html')
  if (!html) return null
  const width = text(content, 'width') || 'medium'
  const height = typeof content.height === 'number' ? content.height : 480
  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className={f.shell}>
        <Head content={content} centered={f.centered} className="mb-10" />
        <div className={clsx('mx-auto', width === 'narrow' ? 'max-w-xl' : width === 'medium' ? 'max-w-3xl' : '')}>
          {/* Sealed: the code can draw and run its own scripts, but cannot reach
              this page, its cookies or the dashboard. */}
          <iframe
            srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:transparent}body>*{max-width:100%}</style></head><body>${html}</body></html>`}
            title={text(content, 'heading') || 'Embedded content'}
            sandbox="allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
            allow="autoplay; fullscreen; picture-in-picture"
            className="w-full border-0"
            style={{ height }}
          />
        </div>
      </div>
    </section>
  )
}
