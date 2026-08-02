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
  photoId,
  children,
}: {
  eyebrow: string
  heading: string
  body?: string
  photoId: string
  children?: ReactNode
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Photo id={photoId} alt="" sizes="100vw" priority className="h-full w-full" />
        <div aria-hidden className="absolute inset-0 bg-[rgb(var(--scrim))]/68" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim))]/75 via-[rgb(var(--scrim))]/45 to-[rgb(var(--scrim))]/85"
        />
      </div>

      <div className="shell pt-40 pb-20 text-beige md:pt-52 md:pb-28">
        <Reveal className="label flex items-center gap-4 text-champagne">
          <span className="h-px w-10 bg-champagne" />
          {eyebrow}
        </Reveal>

        <MaskText
          as="h1"
          text={heading}
          className="display mt-8 max-w-4xl text-[clamp(2.8rem,8vw,6.5rem)] text-beige"
        />

        {body && (
          <Reveal delay={0.15} as="p" className="mt-8 max-w-xl leading-[1.85] text-beige/75">
            {body}
          </Reveal>
        )}

        {children}
      </div>
    </section>
  )
}
