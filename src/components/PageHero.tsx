import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Photo } from './Photo'
import { MaskText, Reveal } from './motion'

/**
 * Compact masthead for interior pages: a scrimmed plate behind a heading,
 * sized so the page's real content starts above the fold on a laptop.
 */
export function PageHero({
  eyebrow,
  heading,
  body,
  image,
  children,
  id,
  className,
  height = 'auto',
  align = 'left',
  vertical = 'bottom',
  overlay = 68,
  focus,
  slowZoom = false,
  scrollCue = false,
  after,
}: {
  eyebrow: string
  heading: string
  body?: string
  image: string
  children?: ReactNode
  id?: string
  className?: string
  /** 'auto' keeps the designed padding; the others set a share of the screen. */
  height?: string
  align?: string
  vertical?: string
  overlay?: number
  focus?: string
  slowZoom?: boolean
  scrollCue?: boolean
  /** Rendered under the body — the buttons, for instance. */
  after?: ReactNode
}) {
  const sized = height !== 'auto'
  const centred = align === 'center'
  return (
    <section
      id={id}
      className={clsx(
        'relative isolate overflow-hidden',
        sized && 'flex flex-col',
        sized && (vertical === 'center' ? 'justify-center' : 'justify-end'),
        height === 'medium' && 'min-h-[55svh]',
        height === 'tall' && 'min-h-[75svh]',
        height === 'full' && 'min-h-[100svh]',
        className,
      )}
    >
      {/* The whole plate drops out on paper — see the print block in index.css. */}
      <div className="absolute inset-0 -z-10 print:hidden">
        <Photo
          src={image}
          alt=""
          sizes="100vw"
          priority
          className="h-full w-full"
          focus={focus}
          imgClassName={slowZoom ? 'animate-[slow-zoom_24s_ease-out_forwards]' : undefined}
        />
        <div aria-hidden className="absolute inset-0 bg-[rgb(var(--scrim))]" style={{ opacity: overlay / 100 }} />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim))]/75 via-[rgb(var(--scrim))]/45 to-[rgb(var(--scrim))]/85"
        />
      </div>

      <div className={clsx('shell w-full pt-40 pb-20 text-beige md:pt-52 md:pb-28 print:pt-0 print:pb-6 print:text-ink', centred && 'text-center')}>
        {eyebrow && (
          <Reveal className={clsx('label flex items-center gap-4 text-champagne print:text-accent', centred && 'justify-center')}>
            <span className="h-px w-10 bg-champagne print:bg-accent" />
            {eyebrow}
            {centred && <span className="h-px w-10 bg-champagne print:bg-accent" />}
          </Reveal>
        )}

        <MaskText
          as="h1"
          text={heading}
          className={clsx('display mt-8 max-w-4xl text-[clamp(2.8rem,8vw,6.5rem)] text-beige print:text-[2.4rem] print:text-ink', centred && 'mx-auto')}
        />

        {body && (
          <Reveal
            delay={0.15}
            as="p"
            className={clsx('mt-8 max-w-xl leading-[1.85] text-beige/75 print:text-muted', centred && 'mx-auto')}
          >
            {body}
          </Reveal>
        )}

        {after}
        {children}
      </div>
      {scrollCue && (
        <div aria-hidden className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-beige/70 md:flex print:hidden">
          <span className="label text-[0.7rem]">Scroll</span>
          <span className="h-12 w-px origin-top animate-[scroll-cue_2.4s_ease-in-out_infinite] bg-beige/60" />
        </div>
      )}
    </section>
  )
}
